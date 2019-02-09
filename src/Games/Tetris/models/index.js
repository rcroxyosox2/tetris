import { keyLabels } from 'Games/Tetris/controls/keyCodes';


export const tileTypes = {
  A: 'a',
  B: 'b',
  C: 'c',
  D: 'd'
};

export const rotationalPositions = {
  N: 'n', // North is neutral
  E: 'e',
  S: 's',
  W: 'w'
};

export const collisionsLocations = {
  TOP: 'top',
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right'
};

export class Tile {
  constructor({
    position = new Shape.Cord(),
    tileType = tileTypes.B
  } = {}) {
    this.position = position;
    this.tileType = tileType;
  }
}

export class Shape extends Tile {

  constructor({
    subShapes = {
      [rotationalPositions.N]: [new Shape.Cord()],
      [rotationalPositions.E]: [new Shape.Cord(), new Shape.Cord(1,0)]
    },
    position = new Shape.Cord()} = {},
    tileType = tileTypes.A
    ) {
      super({position, tileType});
      this.tileType = tileType;
      this.subShapes = subShapes;
      this.position = position;
      this.rotationalPosition = rotationalPositions.N;
  }

  getRotationalPositionByDirection(direction) {

    if (!direction) {
      return this.rotationalPosition;
    }

    const currentRotation = this.rotationalPosition;
    const positions = Object.keys(this.subShapes);
    const index = positions.indexOf(currentRotation);
    const d = (direction === keyLabels.LEFT) ? -1 : 1;
    let nextPos;

    if (index + d < 0 ) {
      nextPos = positions.length - 1;
    } else if (index + d > positions.length) {
      nextPos = 0;
    } else {
      nextPos = index + d;
    }

    return positions[nextPos] || rotationalPositions.N;
  }

  getOffsetSubShapes(rotationalPosition) {
    rotationalPosition = (rotationalPosition) ? rotationalPosition : this.rotationalPosition;
    return this.subShapes[rotationalPosition].map(subShape => new Shape.Cord(subShape.x+this.position.x, subShape.y+this.position.y))
  }

  getShapeAsTilesArr(tileType) {
    const subShapes = this.getOffsetSubShapes();
    tileType = (tileType) ? tileType : this.tileType;
    return subShapes.map(position => new Tile({position, tileType}));
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

export class LShape extends Shape {
  constructor(props) {
    super(props);
    this.subShapes = {
      [rotationalPositions.N]: [
        new Shape.Cord(1,0),
        new Shape.Cord(1,1),
        new Shape.Cord(1,2),
        new Shape.Cord(2,2)
      ],
      [rotationalPositions.E]: [
        new Shape.Cord(0,1),
        new Shape.Cord(1,1),
        new Shape.Cord(2,1),
        new Shape.Cord(0,2)
      ],
      [rotationalPositions.S]: [
        new Shape.Cord(0,0),
        new Shape.Cord(1,0),
        new Shape.Cord(1,1),
        new Shape.Cord(1,2)
      ],
      [rotationalPositions.W]: [
        new Shape.Cord(0,1),
        new Shape.Cord(1,1),
        new Shape.Cord(2,1),
        new Shape.Cord(2,0)
      ]
    }
  }
}

export class Collision {
  constructor({
    collisionLocation,
    shape,
    collisionWith
  } = {}) {
    this.collisionLocation = collisionLocation;
    this.shape = shape;
    this.collisionWith = collisionWith;
  }
}
