import { keyLabels } from 'Games/Tetris/controls/keyCodes';

export const scoreTypes = {
  SHAPE: 'shape', // setting a shape on the board,
  LINE: 'line', // Getting between 1-3 lines
  TETRIS: 'tetris' // getting 4 lines
}


// Notes:

// Associate with fragility
// ie. glass shapes can be broken by heavier shapes like cement

// Different shapes can be chosen for fight mode.
// Their rotational abilitys are translated into fight abilities


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
  RIGHT: 'right',
  OVERFLOW: 'overflow'
};

export class Collision {
  constructor({
    collisionLocation,
    collisionWith
  } = {}) {
    this.collisionLocation = collisionLocation;
    this.collisionWith = collisionWith;
  }
}

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
    tileType = tileTypes.A,
    collision = null
    ) {
      super({position, tileType});
      this.tileType = tileType;
      this.subShapes = subShapes;
      this.position = position;
      this.collision = collision;
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

  getMinX(rotationalPosition) {
    rotationalPosition = (rotationalPosition) ? rotationalPosition : this.rotationalPosition;
    const subShapes = this.subShapes[rotationalPosition];
    return Math.min.apply(this, subShapes.map(ss => ss.x));
  }

  getMinY(rotationalPosition) {
    rotationalPosition = (rotationalPosition) ? rotationalPosition : this.rotationalPosition;
    const subShapes = this.subShapes[rotationalPosition];
    return Math.min.apply(this, subShapes.map(ss => ss.y));
  }

  setMinBoundingGridFromSubShape(rotationalPosition) {
    rotationalPosition = (rotationalPosition) ? rotationalPosition : this.rotationalPosition;
    const subShapes = this.subShapes[rotationalPosition];
    const minX = this.getMinX(rotationalPosition);
    const minY = this.getMinY(rotationalPosition);
    return subShapes.map(ss => {
      ss.x -= (minX > 0) ? minX : 0;
      ss.y -= (minX > 0) ? minY : 0;
      return ss;
    });
  }

  getShapeSize(rotationalPosition) {
    rotationalPosition = (rotationalPosition) ? rotationalPosition : this.rotationalPosition;
    const subShapes = this.subShapes[rotationalPosition];
    const width = Math.max.apply(this, subShapes.map(ss => ss.x)) + 1;
    const height = Math.max.apply(this, subShapes.map(ss => ss.y)) + 1;
    return { width, height };
  }
}

Shape.Cord = class {
  constructor(x,y) {
    x = (typeof x === 'undefined') ? 0 : x;
    y = (typeof y === 'undefined') ? 0 : y;
    this.x = x;
    this.y = y;
  }
  eq(cord) {
    return cord.x === this.x && cord.y === this.y;
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

export class BoomerangShape extends Shape {
  constructor(props) {
    super(props);
    this.subShapes = {
      [rotationalPositions.N]: [
        new Shape.Cord(0,0),
        new Shape.Cord(0,1),
        new Shape.Cord(0,2),
        new Shape.Cord(1,0),
        new Shape.Cord(2,0)
      ]
    }
  }
}

export class WTFShape extends Shape {
  constructor(props) {
    super(props);
    this.subShapes = {
      [rotationalPositions.N]: [
        new Shape.Cord(1,0),
        new Shape.Cord(0,1),
        new Shape.Cord(1,1),
        new Shape.Cord(2,1),
        new Shape.Cord(1,2)
      ]
    }
  }
}

export class IShape extends Shape {
  constructor(props) {
    super(props);
    this.subShapes = {
      [rotationalPositions.N]: [
        new Shape.Cord(1,0),
        new Shape.Cord(1,1),
        new Shape.Cord(1,2),
        new Shape.Cord(1,3)
      ],
      [rotationalPositions.E]: [
        new Shape.Cord(0,1),
        new Shape.Cord(1,1),
        new Shape.Cord(2,1),
        new Shape.Cord(3,1)
      ]
    }
  }
}

export class OShape extends Shape {
  constructor(props) {
    super(props);
    this.subShapes = {
      [rotationalPositions.N]: [
        new Shape.Cord(0,0),
        new Shape.Cord(0,1),
        new Shape.Cord(1,0),
        new Shape.Cord(1,1)
      ]
    }
  }
}

export class TestShape extends Shape {
  constructor(props) {
    super(props);
    this.subShapes = {
      [rotationalPositions.N]: [
        new Shape.Cord(0,0),
        new Shape.Cord(1,0),
        new Shape.Cord(2,0),
        new Shape.Cord(3,0),
        new Shape.Cord(4,0),
        new Shape.Cord(5,0),
        new Shape.Cord(6,0),
        new Shape.Cord(7,0),
        new Shape.Cord(8,0),
        new Shape.Cord(9,0)
      ]
    }
  }
}

export class YShape extends Shape {
  constructor(props) {
    super(props);
    this.subShapes = {
      [rotationalPositions.N]: [
        new Shape.Cord(0,1),
        new Shape.Cord(1,1),
        new Shape.Cord(2,1),
        new Shape.Cord(1,2)
      ],
      [rotationalPositions.E]: [
        new Shape.Cord(1,0),
        new Shape.Cord(0,1),
        new Shape.Cord(1,1),
        new Shape.Cord(1,2)
      ],
      [rotationalPositions.S]: [
        new Shape.Cord(0,1),
        new Shape.Cord(1,1),
        new Shape.Cord(2,1),
        new Shape.Cord(1,0)
      ],
      [rotationalPositions.W]: [
        new Shape.Cord(1,0),
        new Shape.Cord(2,1),
        new Shape.Cord(1,1),
        new Shape.Cord(1,2)
      ]
    }
  }
}

export const gameShapes = [
  LShape, IShape, OShape, YShape
]
