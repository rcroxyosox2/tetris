import React from 'react';
import * as styles  from './styles';
import { directions } from 'Common/keyCodes';

const tileTypes = {
  A: 'a',
  B: 'b',
  C: 'c'
};

const rotationalPositions = {
  N: 'n', // North is neutral
  E: 'e',
  S: 's',
  W: 'w'
}

class Shape {
  constructor({
    subShapes = {
      [rotationalPositions.N]: [new Shape.Cord()]
    },
    position = new Shape.Cord()} = {},
    rotationAxis = new Shape.Cord(),
    shapeType = tileTypes.A
    ) {
      this.shapeType = shapeType;
      this.subShapes = subShapes;
      this.position = position;
      this._rotationalPosition = rotationalPositions.N;
      this.rotationalPositions = null;
  }
  rotate(direction) {
    const currentRotation = this._rotationalPosition;
    const positions = Object.keys(rotationalPositions).map(k => rotationalPositions[k]);
    const index = positions.indexOf(currentRotation);
  }
  getOffsetSubShapes() {
    return this.subShapes[this._rotationalPosition].map(subShape => new Shape.Cord(subShape.x+this.position.x, subShape.y+this.position.y))
  }
}

Shape.Cord = class {
  constructor(x,y) {
    x = (typeof x === 'undefined') ? 0 : x;
    y = (typeof y === 'undefined') ? 0 : y;
    this.x = x;
    this.y = y;
  }
}

class LShape extends Shape {
  constructor(props) {
    super(props);
    this.subShapes = {
      [rotationalPositions.N]: [
        new Shape.Cord(0,0),
        new Shape.Cord(0,1),
        new Shape.Cord(0,2),
        new Shape.Cord(1,2)
      ]
    }
  }
}

const makeArray = (numItems) => {
  return Array.apply(null, Array(numItems));
}

class GridSquare extends React.PureComponent {
  render() {
    return <styles.GridSquare {...this.props} />
  }
}

class GridRow extends React.Component {
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

class GridMatrix extends React.Component {

  constructor(props) {
    super(props);
    window.addEventListener('resize', this.handleResize.bind(this));
    this.containerRef = React.createRef();
    this.cols = 10;
    this.rows = 20;
    this.state = this._getGridSettings();
    this.state.grid = this._generateGrid();
    this.state.shapes = [new LShape()];
  }

  _generateGrid = () => {
    return makeArray(this.rows).map(() => makeArray(this.cols).map(() => null));
  }

  _shapeWillCollide = (shape, dx, dy) => {
    let willCollide = false;
    const subShapes = shape.getOffsetSubShapes();
    const l = subShapes.length;
    for(let i=0; i<l; i++){
      const cord = subShapes[i];
      const nextX = cord.x + dx;
      const nextY = cord.y + dy;
      if (nextX > this.cols-1 || nextX < 0 || nextY > this.rows-1 || nextY < 0) {
        willCollide = true;
        break;
      }
    }
    return willCollide;
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

  _drawShapesToGrid(onComplete) {
    const shapes = this.state.shapes;
    const grid = this._generateGrid();
    shapes.forEach(shape => {
      shape.getOffsetSubShapes().forEach(subShapeCord => {
        grid[subShapeCord.y][subShapeCord.x] = shape.shapeType;
      });
    });
    this._saveGrid(grid, onComplete);
  }

  _moveShapes(dx, dy) {

    const shapes = this.state.shapes;

    shapes.forEach(shape => {
      if (!this._shapeWillCollide(shape, dx, dy)) {
        shape.position.x += dx;
        shape.position.y += dy;
      }
    });

    this.setState({...this.state, shapes}, () => {
      this._drawShapesToGrid();
    });

  }

  _saveGrid(grid, onComplete = () => {}) {
    this.setState({...this.state, grid}, onComplete);
  }

  handleKeyDown = (e, { directionPressed }) => {
    let x = 0;
    let y = 0;

    if(directionPressed === directions.UP) {
      y = -1;
    } else if (directionPressed === directions.DOWN){
      y = 1;
    }

    if(directionPressed === directions.LEFT) {
      x = -1;
    } else if (directionPressed === directions.RIGHT){
      x = 1;
    }

    this._moveShapes(x, y);

  }

  componentDidMount() {
    this.setState(this._getGridSettings(), () => {
      this._drawShapesToGrid();
    });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
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

export default class Tetris extends React.PureComponent {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }
  handleKeyDown = (e, props) => {
    this.ref.current && this.ref.current.handleKeyDown(e, props);
  }
  render() {
    return (
      <styles.Tetris>
        <GridMatrix ref={this.ref} />
      </styles.Tetris>
    )
  }
}