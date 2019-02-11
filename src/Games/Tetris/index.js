import React from 'react';
import * as styles  from './styles';
import withKeyControls from './controls/keyControls';
import { scoreTypes, gameShapes, TestShape } from 'Games/Tetris/models';
import GridMatrix, { GridMatrixBase } from './components/Matrix';


const scoreMap = {
  [scoreTypes.SHAPE]: 18,
  [scoreTypes.LINE]: 25,
  [scoreTypes.TETRIS]: 125
}

class Tetris extends React.PureComponent {

  collisionDelay = 100

  constructor(props) {
    super(props);
    this.state = {
      level: 1,
      points: 0,
      timeElapsed: 0,
      shapeQueue: [this.generateRandomShape(), this.generateRandomShape()]
    }
  }

  promiseToUpdateScore = ({ rowsToDestroy = [], collidingShape } = {}) => {
    // Only score if there are rows being destroyed or if a shape is colliding
    return new Promise((resolve, reject) => {

      let scoreType;
      let l = rowsToDestroy.length;

      if (l > 3) {
        scoreType = scoreTypes.TETRIS
      } else if (l > 0) {
        scoreType = scoreTypes.LINE
      } else if (collidingShape && collidingShape.collision) {
        scoreType = scoreTypes.SHAPE;
      }

      const score = scoreMap[scoreType];
      if (score) {
        this.setState({...this.state, points: this.state.points + score}, resolve);
      }
    })
  }

  generateRandomShape = () => {
    const l = gameShapes.length;
    const k = Math.ceil(Math.random() * l) - 1;
    return new TestShape(); //new gameShapes[k]();
  }

  promiseToUpdateShapeQueue = () => {
    return new Promise((resolve) => {
      const shapeQueue = this.state.shapeQueue.slice(1)
      shapeQueue.push(this.generateRandomShape());
      this.setState({...this.state, shapeQueue}, () => {
        resolve(shapeQueue);
      });
    })
  }

  componenentDidMount() {
    setTimeout(() => {
      this.requestNewShapeToGame();
    }, 2000)
  }

  render() {
    return (
      <styles.Tetris>
        <GridMatrixBase {...this.state} mini shape={this.state.shapeQueue[1]} />
        <div>{this.state.points}</div>
        <GridMatrix
          ref={this.props.keyControlRef}
          collisionDelay={this.collisionDelay}
          rows={20}
          cols={10}
          promiseToUpdateScore={this.promiseToUpdateScore}
          promiseToUpdateShapeQueue={this.promiseToUpdateShapeQueue}
          shape={this.state.shapeQueue[0]}
        />
      </styles.Tetris>
    )
  }
}

export default withKeyControls(Tetris);