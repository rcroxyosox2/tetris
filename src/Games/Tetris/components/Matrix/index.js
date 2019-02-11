import React from 'react';
import * as styles from './styles';
import { Shape, Tile, Collision, collisionsLocations, tileTypes, scoreTypes } from 'Games/Tetris/models';
import { makeArray } from 'utils/';
import { keyLabels } from 'Games/Tetris/controls/keyCodes'

export class GridSquare extends React.PureComponent {
  render() {
    return <styles.GridSquare {...this.props} />
  }
}

const explosionAnimationTimePerTile = 100;

export class GridRow extends React.PureComponent {


  state = {
    explodingIndexs: []
  }

  getNextExplodingIndexs() {
    const cl = this.props.cols.length;
    return [this.state.explodingIndexs[0]-1, this.state.explodingIndexs[1]+1].map(i => {
      if (i < -1) { return 0 };
      if (i > cl) { return cl };
      return i;
    })
  }

  showExplosion(atIndex) {
    return new Promise((resolve) => {
      this.setState({explodingIndexs:[atIndex,atIndex]}, () => {
        const cl = this.props.cols.length;
        this.explodingInterval = setInterval(() => {
          this.setState({explodingIndexs: this.getNextExplodingIndexs()}, () => {
            if (this.state.explodingIndexs.indexOf(-1) > -1 && this.state.explodingIndexs.indexOf(cl) > -1) {
              this.setState({explodingIndexs: []}, () => {
                clearInterval(this.explodingInterval);
                resolve();
              });
            }
          });
        }, explosionAnimationTimePerTile)
      });
    })
  }

  componentWillUnmount() {
    this.explodingInterval && clearInterval(this.explodingInterval);
  }

  render() {
    return (
      <styles.GridRow>
        { this.props.cols.map((v,i) => {
          const exploding = this.state.explodingIndexs.indexOf(i) > -1;
          return <GridSquare key={i} sqSize={this.props.sqSize} tileType={v} exploding={exploding} />;
        }) }
      </styles.GridRow>
    );
  }
}


export class GridMatrixBase extends React.PureComponent {

  constructor(props) {
    super(props)
    window.addEventListener('resize', this.handleResize);
    this.containerRef = React.createRef();
    this.state = this.getGridSettings();
    this.state.grid = this.generateGrid();
    this.rowRefs = makeArray(this.getRowsCols().rows).map(() => React.createRef());
  }

  getShape = () => {
    return this.props.shape;
  }

  getRowsCols = () => {

    if (this.props.rows && this.props.cols) {
      return { rows: this.props.rows, cols: this.props.cols }
    }

    const boundingShape = this.getShape().setMinBoundingGridFromSubShape();
    const cols = Math.max.apply(this, boundingShape.map(ss => ss.x)) + 1;
    const rows = Math.max.apply(this, boundingShape.map(ss => ss.y)) + 1;
    return {
      rows, cols
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.shape !== this.getShape()) {
      this.promiseToDrawToGrid();
    }
  }

  handleResize = () => {
    this.setState({ ...this.state, ...this.getGridSettings()});
  }

  generateGrid = () => {
    return makeArray(this.getRowsCols().rows).map(() => makeArray(this.getRowsCols().cols).map(() => null));
  }

  promiseToDrawToGrid = ({ shape } = {}) => {

    return new Promise((resolve) => {
      shape = (shape) ? shape : this.getShape();
      const grid = this.generateGrid();

      shape && shape.getOffsetSubShapes().forEach(subShapeCord => {
        grid[subShapeCord.y][subShapeCord.x] = shape.tileType;
      });

      if (shape && !shape.tileType) {
        shape = null;
      }

      this.setState({...this.state, grid, shape}, () => {
        resolve();
      });
    })

  }

  getGridSettings = () => {
    const rows = this.getRowsCols().rows;
    const cols = this.getRowsCols().cols;
    const height = (this.containerRef.current) ? this.containerRef.current.getBoundingClientRect().height : window.innerHeight;
    const width = (this.containerRef.current) ? this.containerRef.current.getBoundingClientRect().width : window.innerWidth;

    const widthSqSize = Math.floor(width / cols);
    const heightSqSize = Math.floor(height / rows);
    const totalWidth = heightSqSize*cols;

    const sqSize = ((totalWidth > window.innerWidth)
    || (this.containerRef.current && totalWidth > this.containerRef.current.getBoundingClientRect().width))
    ? widthSqSize : heightSqSize;

    return { sqSize };
  }

  componentDidMount = () => {
    this.setState(this.getGridSettings(), () => {
      this.promiseToDrawToGrid();
    });
  }

  componentWillUnmount = () => {
    window.removeEventListener('resize', this.handleResize);
  }

  render() {
    return (
      <styles.GridMatrixContainer ref={this.containerRef} {...this.props}>
        <styles.GridMatrix>
        { this.state.grid.map((cols,i) => {
            return  <GridRow key={i} {...this.state} cols={cols} ref={this.rowRefs[i]} />}
          )
        }
        </styles.GridMatrix>
      </styles.GridMatrixContainer>
    );
  }
}

export default class GridMatrix extends GridMatrixBase {

  constructor(props) {
    super(props);
    this.state.staticTiles = [
      // new Tile({position: new Shape.Cord(5,6)}),
      // new Tile({position: new Shape.Cord(3,3)})
    ];
    this.explodeReadyRows = [];
    this.timeOuts = [];
  }



  getTileCollisionType = (shapeTileCord, tileCord, nextDirection) => {
    let collision;

    if (tileCord.y > shapeTileCord.y) {
      collision = collisionsLocations.BOTTOM;
    } else if (tileCord.y < shapeTileCord.y) {
      collision = collisionsLocations.TOP;
    } else if (nextDirection && tileCord.y === shapeTileCord.y) {
      collision = collisionsLocations.RIGHT;
    }

    if (tileCord.x > shapeTileCord.x) {
      collision = collisionsLocations.RIGHT;
    } else if (tileCord.x < shapeTileCord.x) {
      collision = collisionsLocations.LEFT;
    } else if (nextDirection && tileCord.x === shapeTileCord.x) {
      collision = collisionsLocations.RIGHT;
    }

    return collision;
  }

  getShapeCollision = ({shape, nextDx = 0, nextDy = 0, nextDirection}) => {
    let collision = false;
    if (!shape) {
      return collision;
    }
    let p = (typeof nextDirection !== 'undefined') ? shape.getRotationalPositionByDirection(nextDirection) : null;
    let subShapes = shape.getOffsetSubShapes(p);
    let tileCollision = null;
    const l = subShapes.length;
    const tiles = this.state.staticTiles;

    for (let i=0; i<l; i++) {
      const cord = subShapes[i];
      const nextX = cord.x + nextDx;
      const nextY = cord.y + nextDy;

      // Check collisions with the edges
      if (nextY > this.getRowsCols().rows-1) {
        collision = new Collision({
          collisionLocation: collisionsLocations.BOTTOM
        });
        break;
      } else if (nextY < 0) {
        collision = new Collision({
          collisionLocation: collisionsLocations.TOP
        });
        break;
      }

      if (nextX > this.getRowsCols().cols-1) {
        collision = new Collision({
          collisionLocation: collisionsLocations.RIGHT
        });
        break;
      } else if (nextX < 0) {
        collision = new Collision({
          collisionLocation: collisionsLocations.LEFT
        });
        break;
      }


      // Check colisions with the tiles (TODO: this is probably not performant)
      tileCollision = tiles.filter(tile => tile.position.x === nextX && tile.position.y === nextY)[0];
      if (tileCollision) {
        collision = new Collision({
          collisionLocation: this.getTileCollisionType(cord, tileCollision.position, nextDirection),
          collisionWith: tileCollision
        });
        break;
      }
    }

    return collision;
  }

  promiseToDrawToGrid = ({ shape, staticTiles } = {}) => {
    return new Promise((resolve) => {

      shape = (shape) ? shape : this.getShape();
      staticTiles = (staticTiles) ? this.state.staticTiles.concat(staticTiles) : this.state.staticTiles;

      const grid = this.generateGrid();

      shape && shape.getOffsetSubShapes().forEach(subShapeCord => {
        grid[subShapeCord.y][subShapeCord.x] = shape.tileType;
      });

      staticTiles.forEach(tile => {
        grid[tile.position.y][tile.position.x] = tile.tileType;
      });

      this.setState({...this.state, grid, staticTiles}, () => {
        resolve();
      });
    })
  }

  moveShape = (nextDx, nextDy, nextDirection) => {

    const shape = this.getShape();
    if (!shape) {
      return;
    }

    let collision;

    const moveCollision = this.getShapeCollision({shape, nextDx, nextDy});
    if (!moveCollision) {
      shape.position.x += nextDx;
      shape.position.y += nextDy;
    }

    const rotateCollision = this.getShapeCollision({shape, nextDirection});
    if (!rotateCollision) {
      const p = shape.getRotationalPositionByDirection(nextDirection);
      shape.rotationalPosition = p;
    }

    collision = moveCollision || rotateCollision;

    if (!collision || collision.collisionLocation !== collisionsLocations.BOTTOM) {
      this.promiseToDrawToGrid({ shape });
    } else {

      this.promiseToHandleCollision(collision)
      .then(this.animateLinesDestroyed)
      .then(({ collidingShape, rowsToDestroy } = {}) => {

        if (!collidingShape) {
          return;
        }

        const promises = [
          this.props.promiseToUpdateShapeQueue(),
          this.props.promiseToUpdateScore({ rowsToDestroy, collidingShape })
        ]

        return Promise.all(promises);

      })
      .catch(e => {
        // Uh oh
        console.log(e);
      });
    }
  }

  destroyStaticTilesInRows = () => {
    console.log();
  }

  animateLinesDestroyed = ({ collidingShape } = {}) => {
    return new Promise((resolve, reject) => {

      if (!collidingShape) {
        resolve();
        return;
      }

      const rowsToDestroy = this.rowsToDestroy();
      const rowRefs = rowsToDestroy.map(k => this.rowRefs[k].current);

      if (rowRefs.length > 0) {
        const promises = rowRefs.map(rowComponent => rowComponent.showExplosion(5));
        const staticTiles = rowsToDestroy.map(x => makeArray(this.getRowsCols().cols)
        .map(y => new Tile({position: new Shape.Cord(x,y), tileType: null})))
        .reduce((a1,a2) => a1.concat(a2));
        Promise.all(promises).then(() => {
          resolve({ collidingShape, rowsToDestroy });
        })
      } else {
        resolve({ collidingShape });
      }
    })
  }

  promiseToHandleCollision = (collision) => {
    return new Promise((resolve, reject) => {
      const shape = this.getShape();

      if (shape.collision) {
        resolve();
        return;
      }

      shape.tileType = null;
      shape.collision = collision;

      this.collisionTimeout = setTimeout(() => {
        const staticTiles = shape.getShapeAsTilesArr(tileTypes.B);
        return this.promiseToDrawToGrid({ shape, staticTiles }).then(() => {
          delete this.collisionTimeout;
          resolve({ collidingShape: shape });
        });
      }, this.props.collisionDelay);
      this.timeOuts.push(this.collisionTimeout);
    });
  }

  rowsToDestroy = () => {
    return this.state.grid.map((row, i) => {
      return (row.filter(v => v === null).length === 0) ? i : null;
    }).filter(v => v !== null);
  }

  handleKeyDown = (e, { keyLabelPressed }) => {
    let x = 0;
    let y = 0;
    let rotation;

    // Handle movement
    switch(keyLabelPressed) {
      case keyLabels.UP:
      y = -1;
      break;
      case keyLabels.DOWN:
      y = 1;
      break;
      case keyLabels.LEFT:
      x = -1;
      break;
      case keyLabels.RIGHT:
      x = 1;
      break;
      case keyLabels.PRIMARY:
      rotation = keyLabels.RIGHT;
      break;
      default:
      break;
    }

    this.moveShape(x, y, rotation);
  }

  componentWillUnmount() {
    super.componentWillUnmount()
    this.timeOuts.forEach(timeOut => timeOut && clearTimeout(timeOut));
  }
}