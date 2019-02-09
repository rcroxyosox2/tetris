import React from 'react';
import * as styles from './styles';
import { Shape, LShape, Tile, Collision, collisionsLocations, tileTypes } from 'Games/Tetris/models';
import { makeArray } from 'utils/';
import { keyLabels } from 'Games/Tetris/controls/keyCodes'

export class GridSquare extends React.PureComponent {
  render() {
    return <styles.GridSquare {...this.props} />
  }
}

export class GridRow extends React.Component {
  render() {
    return (
      <styles.GridRow>
        { this.props.cols.map((v,i) => {
          return <GridSquare key={i} sqSize={this.props.sqSize} tileType={v} />;
        }) }
      </styles.GridRow>
    );
  }
}

export default class GridMatrix extends React.Component {

  constructor(props) {
    super(props);
    window.addEventListener('resize', this.handleResize.bind(this));
    this.containerRef = React.createRef();
    this.cols = 10;
    this.rows = 20;
    this.state = this._getGridSettings();
    this.state.grid = this._generateGrid();
    this.state.shape = new LShape();;
    this.state.staticTiles = [
      new Tile({position: new Shape.Cord(5,6)}),
      new Tile({position: new Shape.Cord(3,3)})
    ];

    this.timeOuts = [];
  }

  _generateGrid = () => {
    return makeArray(this.rows).map(() => makeArray(this.cols).map(() => null));
  }

  _getTileCollisionType(shapeTileCord, tileCord, nextDirection){
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

  _getShapeCollision({shape, nextDx = 0, nextDy = 0, nextDirection}) {
    let collision = false;
    if (!shape) {
      return collision;
    }
    let p = (typeof nextDirection !== 'undefined') ? shape.getRotationalPositionByDirection(nextDirection) : null;
    let subShapes = shape.getOffsetSubShapes(p);
    let tileCollision = null;
    const l = subShapes.length;
    const tiles = this.state.staticTiles;

    for(let i=0; i<l; i++){
      const cord = subShapes[i];
      const nextX = cord.x + nextDx;
      const nextY = cord.y + nextDy;

      // Check colisions with the edges
      if (nextY > this.rows-1) {
        collision = new Collision({
          collisionLocation: collisionsLocations.BOTTOM,
          shape
        });
        break;
      } else if (nextY < 0) {
        collision = new Collision({
          collisionLocation: collisionsLocations.TOP,
          shape
        });
        break;
      }

      if (nextX > this.cols-1) {
        collision = new Collision({
          collisionLocation: collisionsLocations.RIGHT,
          shape
        });
        break;
      } else if (nextX < 0) {
        collision = new Collision({
          collisionLocation: collisionsLocations.LEFT,
          shape
        });
        break;
      }


      // Check colisions with the tiles (TODO: this is probably not performant)
      tileCollision = tiles.filter(tile => tile.position.x === nextX && tile.position.y === nextY)[0];
      if (tileCollision) {
        collision = new Collision({
          collisionLocation: this._getTileCollisionType(cord, tileCollision.position, nextDirection),
          shape,
          collisionWith: tileCollision
        });
        break;
      }
    }

    return collision;
  }

  _getGridSettings = () => {
    const rows = this.rows;
    const cols = this.cols;
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


  _drawToGrid({shape, staticTiles, onComplete} = {}) {

    shape = (shape) ? shape : this.state.shape;
    staticTiles = (staticTiles) ? this.state.staticTiles.concat(staticTiles) : this.state.staticTiles;

    const grid = this._generateGrid();

    shape && shape.getOffsetSubShapes().forEach(subShapeCord => {
      grid[subShapeCord.y][subShapeCord.x] = shape.tileType;
    });

    staticTiles.forEach(tile => {
      grid[tile.position.y][tile.position.x] = tile.tileType;
    });

    if (shape && !shape.tileType) {
      shape = null;
    }

    this.setState({...this.state, grid, staticTiles, shape}, () => {
      onComplete && onComplete();
    });
  }

  _moveShape(nextDx, nextDy, nextDirection) {

    const shape = this.state.shape;
    if (!shape) {
      return;
    }

    let collision;

    const moveCollision = this._getShapeCollision({shape, nextDx, nextDy});
    if (!moveCollision) {
      shape.position.x += nextDx;
      shape.position.y += nextDy;
    }

    const rotateCollision = this._getShapeCollision({shape, nextDirection});
    if (!rotateCollision) {
      const p = shape.getRotationalPositionByDirection(nextDirection);
      shape.rotationalPosition = p;
    }

    collision = moveCollision || rotateCollision;

    if (!collision) {
      this._drawToGrid({shape});
    } else {
      if (!this.collisionTimeout) {
        this.collisionTimeout = setTimeout(() => {
          this.handleCollision(collision);
          this.collisionTimeout = null;
        }, this.props.collisionDelay);
        this.timeOuts.push(this.collisionTimeout);
      }
    }
  }

  handleCollision = (collision) => {
    let shape = collision.shape;
    if (collision.collisionLocation === collisionsLocations.BOTTOM) {
      const staticTiles = shape.getShapeAsTilesArr(tileTypes.B);
      shape.tileType = null;
      this._drawToGrid({ staticTiles, shape, onComplete: () => {
        this.setNewShape();
      } });
    }
  }

  setNewShape = (noDelay) => {
    const shape = new LShape();
    this._drawToGrid({shape});
    // if (this.newShapeTimeout) {
    //   return;
    // }

    // this.newShapeTimeout = this.setTimeout(() => {
    //   this._drawToGrid({shape});
    //   this.newShapeTimeout = null;
    // }, 1000);

    // this.timeOuts.push(this.newShapeTimeout);

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

    this._moveShape(x, y, rotation);
  }

  componentDidMount() {
    this.setState(this._getGridSettings(), () => {
      this._drawToGrid();
    });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    this.timeOuts.forEach(timeOut => clearTimeout(timeOut));
  }

  handleResize() {
    this.setState(this._getGridSettings);
  }

  render() {
    return (
      <styles.GridMatrixContainer ref={this.containerRef}>
        <styles.GridMatrix>
        { this.state.grid.map((cols,i) => {
            return  <GridRow key={i} {...this.state} cols={cols} />}
          )
        }
        </styles.GridMatrix>
      </styles.GridMatrixContainer>
    );
  }
}