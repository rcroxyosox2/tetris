import React from 'react';
import * as styles from './styles';
import { Collision, collisionsLocations, tileTypes } from 'Games/Tetris/models';
import { makeArray } from 'utils/';
import { keyLabels } from 'Games/Tetris/controls/keyCodes'

export class GridSquare extends React.PureComponent {
  render() {
    return <styles.GridSquare {...this.props} />
  }
}

const explosionAnimationTimePerTile = 50;

export class GridRow extends React.PureComponent {


  state = {
    explodingIndexs: []
  }

  getNextExplodingIndexs() {
    const cl = this.props.cols.length;
    const ei = [].concat(this.state.explodingIndexs)
    const min = Math.min.apply(this, ei);
    const max = Math.max.apply(this, ei);

    ei.push(min-1);
    ei.push(max+1);

    return ei.map(i => {
      if (i < -1) { return -1 };
      if (i > cl) { return cl };
      return i;
    })
  }

  showExplosion({ atIndex1, atIndex2 }) {
    return new Promise((resolve) => {
      this.setState({explodingIndexs:[atIndex1, atIndex2]}, () => {
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
    this.state = {};
    this.state.sqSize = this.getSqSize();
    this.state.grid = this.generateGrid();
    this.rowRefs = makeArray(this.getRowsCols().rows).map(() => React.createRef());
  }

  componentDidUpdate(prevProps) {
    if (prevProps.shape !== this.getShape()) {
      this.promiseToDrawToGrid();
    }
  }

  componentDidMount() {
    this.setState({sqSize: this.getSqSize()}, () => {
      this.promiseToDrawToGrid();
    })
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize = (onComplete) => {
    this.setState({ ...this.state, sqSize: this.getSqSize()}, () => {
      typeof onComplete === 'function' && onComplete();
    });
  }

  generateGrid = () => {
    return makeArray(this.getRowsCols().rows).map(() => makeArray(this.getRowsCols().cols).map(() => null));
  }

  promiseToDrawToGrid = ({ shape } = {}) => {

    return new Promise((resolve) => {
      shape = (shape) ? shape : this.getShape();
      shape.position.x = 0;
      const grid = this.generateGrid();
      shape && shape.getOffsetSubShapes().forEach(subShapeCord => {
        grid[subShapeCord.y][subShapeCord.x] = shape.tileType;
      });

      if (shape && !shape.tileType) {
        shape = null;
      }

      this.setState({...this.state, sqSize: this.getSqSize(), grid, shape }, () => {
        resolve();
      });
    })

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

  getSqSize = () => {
    const rows = this.getRowsCols().rows;
    // const cols = this.getRowsCols().cols;
    const height = (this.containerRef.current) ? this.containerRef.current.getBoundingClientRect().height : window.innerHeight;
    // const width = (this.containerRef.current) ? this.containerRef.current.getBoundingClientRect().width : window.innerWidth;

    // const widthSqSize = Math.floor(width / cols);
    const heightSqSize = Math.floor(height / rows);
    // const totalWidth = widthSqSize*cols;
    // const totalHeight = heightSqSize*rows;

    let sqSize = heightSqSize;

    return sqSize;
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
    this.shapeMoverPromises = [];
  }

  componentDidMount() {
    this.handleResize(() => {
      let promiseIndex;
      const shapeMover = (nextDy) => {
        const shapeMoverPromise = this.moveShape({nextDy}).then((x) => {
          this.shapeMoverTimeout = setTimeout(() => {
            shapeMover(1);
            clearTimeout(this.shapeMoverTimeout);
          }, this.props.moveSpeed);

          this.shapeMoverPromises.splice(promiseIndex-1, 1);
          this.timeOuts.push(this.shapeMoverTimeout);
          promiseIndex = this.shapeMoverPromises.push(shapeMoverPromise);
        });
      }
      shapeMover(0);
    });

    // setTimeout(() => {
    //   Promise.all(this.shapeMoverPromises)
    //   .then(this.moveShape({toDx: 21, debug: true}))
    //   .then((collision) => {
    //     // console.log(x);
    //   });
    // }, 2000)

  }

  componentWillUpdate(nextProps) {
    super.componentWillUpdate && this.componentWillUpdate();
    if (nextProps.gameOver) {
      clearTimeout(this.shapeMoverTimeout);
    }
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
          collisionLocation: collisionsLocations.BOTTOM,
          collisionWith: 'bounds'
        });
        break;
      } else if (nextY < 0) {
        collision = new Collision({
          collisionLocation: collisionsLocations.TOP,
          collisionWith: 'bounds'
        });
        break;
      }

      if (nextX > this.getRowsCols().cols-1) {
        collision = new Collision({
          collisionLocation: collisionsLocations.RIGHT,
          collisionWith: 'bounds'
        });
        break;
      } else if (nextX < 0) {
        collision = new Collision({
          collisionLocation: collisionsLocations.LEFT,
          collisionWith: 'bounds'
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

    if (shape.getShapeSize().height > shape.position.y
    && shape.position.y === 0
    && collision
    && collision.collisionLocation === collisionsLocations.BOTTOM) {
      collision.collisionLocation = collisionsLocations.OVERFLOW
    }

    return collision;
  }

  promiseToDrawToGrid = ({ shape, staticTiles, resetTiles } = {}) => {
    return new Promise((resolve) => {

      shape = (shape) ? shape : this.getShape();
      staticTiles = (staticTiles) ? this.state.staticTiles.concat(staticTiles) : this.state.staticTiles;
      staticTiles = (resetTiles) ? resetTiles : staticTiles;

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

  moveShape = ({nextDx = 0, nextDy = 0, toDx, nextDirection, debug}) => {

    const shape = this.getShape();
    if (!shape || this.props.paused || this.props.gameOver) {
      return Promise.resolve();
    }

    let collision;

    if (toDx !== undefined) {
      const maxX = this.props.cols - shape.getShapeSize().width;
      nextDx = toDx - shape.position.x - shape.getMinX();
      if (toDx < 0) {
        nextDx = -shape.position.x - shape.getMinX();
      } else if (toDx > maxX) {
        nextDx = maxX - shape.position.x;
      }
    }

    const moveCollision = this.getShapeCollision({shape, nextDx, nextDy});

    if (moveCollision) {
      nextDx = 0;
      nextDy = 0;
    }

    shape.position.x += nextDx;
    shape.position.y += nextDy;

    const rotateCollision = this.getShapeCollision({shape, nextDirection});
    if (!rotateCollision) {
      const p = shape.getRotationalPositionByDirection(nextDirection);
      shape.rotationalPosition = p;
    }

    collision = moveCollision || rotateCollision;

    if (collision && collision.collisionLocation === collisionsLocations.OVERFLOW) {
      return this.props.promiseToEndGame();
    } else if(!collision || collision.collisionLocation !== collisionsLocations.BOTTOM) {
      return this.promiseToDrawToGrid({ shape });
    } else {
      return this.promiseToHandleCollision(collision)
      .then(this.animateLinesDestroyed)
      .then(this.promiseToDestroyStaticTilesInRows)
      .then(({ collidingShape, rowsToDestroy } = {}) => {
        if (!collidingShape) {
          return;
        }
        const promises = [
          this.props.promiseToUpdateShapeQueue(),
          this.props.promiseToUpdateLevelAndScore({ rowsToDestroy, collidingShape })
        ]
        return Promise.all(promises);
      })
      .catch(e => {
        // Uh oh
        console.log(e);
      });
    }
  }

  promiseToDestroyStaticTilesInRows = ({collidingShape, rowsToDestroy} = {}) => {

    return new Promise((resolve, reject) => {

      if (!rowsToDestroy) {
        resolve({collidingShape});
        return;
      }

      const staticTiles = [].concat(this.state.staticTiles)
      .filter(tile => {
        return rowsToDestroy.indexOf(tile.position.y) === -1;
      })
      .map(tile => {
        rowsToDestroy.forEach(row => {
          if (tile.position.y < row) {
            tile.position.y = tile.position.y + 1;
          }
        })
        return tile;
      });

      return this.promiseToDrawToGrid({ resetTiles: staticTiles }).then(() => {
        resolve({ collidingShape });
      })
    })
  }

  animateLinesDestroyed = ({ collidingShape, onTileAnimated } = {}) => {

    return new Promise((resolve, reject) => {

      if (!collidingShape) {
        resolve();
        return;
      }

      const rowsToDestroy = this.rowsToDestroy();
      const rowRefs = rowsToDestroy.map(k => this.rowRefs[k].current);
      const shapeWidth = collidingShape.getShapeSize().width;
      const collisionX1 = collidingShape.position.x + Math.floor(shapeWidth / 2) - 1;
      const collisionX2 = collisionX1 + 1;

      if (rowRefs.length > 0) {
        const promises = rowRefs.map(rowComponent => rowComponent.showExplosion({
          atIndex1: (shapeWidth % 2 === 0) ? collisionX1 : collisionX2,
          atIndex2: collisionX2
        }));

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
        this.downInterval && clearInterval(this.downInterval);
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

  handleUserInputMobile = (e, { keyLabelPressed, toDx }) => {
    const shape = this.getShape();
    if (shape.position.x !== toDx) {
      this.moveShape({ toDx });
    }
  }

  handleUserInput = (e, { keyLabelPressed, dx }) => {

    let nextDx = 0;
    let nextDy = 0;
    let nextDirection;

    // Handle movement
    switch(keyLabelPressed) {
      // case keyLabels.UP:
      // y = -1;
      // break;
      case keyLabels.DOWN:
      nextDy = 1;
      break;
      case keyLabels.LEFT:
      nextDx = (dx) ? -dx : -1;
      break;
      case keyLabels.RIGHT:
      nextDx = (dx) ? dx : 1;
      break;
      case keyLabels.PRIMARY:
      nextDirection = keyLabels.RIGHT;
      break;
      case keyLabels.PAUSE:
      this.props.promiseToPauseGame();
      break;
      default:
      break;
    }

    this.moveShape({nextDx, nextDy, nextDirection});
  }

  handleQuickDown = () => {
    this.downInterval = setInterval(() => {
      this.moveShape({nextDx: 0, nextDy: 1}).then((collision) => {
        collision && clearInterval(this.downInterval);
      });
    }, 10);
  }

  componentWillUnmount() {
    super.componentWillUnmount()
    this.timeOuts.forEach(timeOut => timeOut && clearTimeout(timeOut));
  }
}