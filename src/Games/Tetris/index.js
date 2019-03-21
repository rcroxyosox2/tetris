import React from 'react';
import { Swipeable } from 'react-swipeable';
import * as styles  from './styles';
import throttle from 'lodash.throttle';
import { keyLabels } from './controls/keyCodes';
import withKeyControls from './controls/keyControls';
import { scoreTypes, gameShapes } from 'Games/Tetris/models';
import GridMatrix, { GridMatrixBase } from './components/Matrix';
import PauseScreen from  './components/PauseScreen';
import EndGameScreen from './components/EndGameScreen';
const scoreMap = {
  [scoreTypes.SHAPE]: 18,
  [scoreTypes.LINE]: 25,
  [scoreTypes.TETRIS]: 125
}

// Make 2 p

class ButtonControls extends React.PureComponent {
  render() {
    return (
      <styles.ButtonControls>
        <button onClick={(e) => {
          this.props.handleControl(e, {keyLabelPressed: keyLabels.LEFT});
        }}></button>
        <button onClick={(e) => {
          this.props.handleControl(e, {keyLabelPressed: keyLabels.RIGHT});
        }}></button>
      </styles.ButtonControls>
    )
  }
}

ButtonControls.defaultProps = {
  handleControl: () => {}
}

class Tetris extends React.Component {

  collisionDelay = 100
  rows = 20
  cols = 10

  constructor(props) {
    super(props);
    this.state = {
      level: 1,
      points: 0,
      rotated: false,
      paused: false,
      gameOver: false,
      gameStarted: true,
      timeElapsed: 0,
      shapeQueue: [this.generateRandomShape(), this.generateRandomShape()]
    }
    this.matrixRef = React.createRef();
    this.throttleLeftRightControl = throttle((e, {keyLabelPressed}) => {
      this.handleLeftRightControl(e, {keyLabelPressed});
    }, 60);
  }

  componentWillUpdate(nextProps, nextState) {
    this.monitorLevelUp(nextState.points);
  }

  centerShape = (shape) => {
    const centeredX = Math.floor((this.cols - shape.getShapeSize().width) / 2);
    shape.position.x = centeredX;
    return shape;
  }

  gameRunning = () => {
    return !this.state.paused && !this.state.gameOver && this.state.gameStarted;
  }

  promiseToEndGame = () => {
    return new Promise((resolve, reject) => {
      this.setState({
        ...this.state,
        gameOver: true
      }, () => {
        resolve(this.state.paused);
      })
    })
  }

  promiseToPauseGame = () => {
    return new Promise((resolve, reject) => {
      this.setState({
        ...this.state,
        paused: !this.state.paused
      }, () => {
        resolve(this.state.paused);
      })
    })
  }

  promiseToUpdateLevelAndScore = ({ rowsToDestroy = [], collidingShape } = {}) => {
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
    const shape = new gameShapes[k]();
    return this.centerShape(shape);
  }

  promiseToUpdateShapeQueue = () => {
    return new Promise((resolve) => {
      const shapeQueue = this.state.shapeQueue.slice(1).map(shape => {
        return shape;
      })
      shapeQueue.push(this.generateRandomShape());
      this.setState({...this.state, shapeQueue}, () => {
        resolve(shapeQueue);
      });
    })
  }

  handleKeyDown = (e, { keyLabelPressed }) => {
    if (this.state.gameOver || (this.state.paused && keyLabelPressed !== keyLabels.PAUSE)) {
      return;
    }
    this.matrixRef.current.handleUserInput(e, { keyLabelPressed });
  }

  getNextShape() {
    const shape = this.state.shapeQueue[1];
    return shape;
  }

  getCurrentShape() {
    const shape = this.state.shapeQueue[0];
    return shape;
  }

  getMoveSpeed() {
    const baseSpeed = 900;
    return baseSpeed / this.state.level;
  }

  monitorLevelUp(points) {
    const mult = 40;
    const level = Math.floor(points / mult)+1;
    if (this.state.level !== level) {
      this.setState({level});
    }
  }

  handleLeftRightControl = (e, {keyLabelPressed}) => {
    e.stopPropagation && e.stopPropagation();
    e.preventDefault && e.preventDefault();
    const dx = Math.round(e.velocity);
    keyLabelPressed && this.matrixRef.current.handleUserInput(e, { keyLabelPressed, dx });
  }

  handleSwipeDown = (e) => {
    this.matrixRef.current.handleQuickDown();
  }

  handlePrimaryAction = (e) => {
    e.preventDefault();
    const keyLabelPressed = keyLabels.PRIMARY;
    this.matrixRef.current.handleUserInput(e, { keyLabelPressed });
  }

  handleSwiping = (e) => {
    const keyLabelPressed = e.dir.toLowerCase();;
    const swipeRel = (window.innerWidth * 0.5) / this.cols;
    const subFromDx = Math.floor(e.deltaX / swipeRel);
    const toDx = this.shapePosX - subFromDx;
    this.matrixRef.current.handleUserInputMobile(e, { keyLabelPressed, toDx });
  }

  render() {

    const nextShape = this.getNextShape();
    const currentShape = this.getCurrentShape();
    const moveSpeed = this.getMoveSpeed();

    return (
      <Swipeable onSwiping={this.handleSwiping}>
        <styles.Tetris
        onTouchStart={(e) => {
          this.shapePosX = this.getCurrentShape().position.x;
        }}
        onTouchEnd={() => {
          delete this.shapePosX;
        }}
        rotated={this.state.rotated}
        onClick={this.handlePrimaryAction}
        ref={this.props.keyControlRef}
        >
          <ButtonControls handleControl={this.handleLeftRightControl} />
          {this.state.gameOver && <EndGameScreen />}
          {this.state.paused && <PauseScreen pauseShape={currentShape} /> }
          <GridMatrixBase {...this.state} mini shape={nextShape} />
          <div>Points: {this.state.points}</div>
          <div>Level: {this.state.level}</div>
          <GridMatrix
            {...this.state}
            moveSpeed={moveSpeed}
            gameRunning={this.gameRunning}
            ref={this.matrixRef}
            collisionDelay={this.collisionDelay}
            rows={this.rows}
            cols={this.cols}
            promiseToEndGame={this.promiseToEndGame}
            promiseToPauseGame={this.promiseToPauseGame}
            promiseToUpdateScore={this.promiseToUpdateScore}
            promiseToUpdateShapeQueue={this.promiseToUpdateShapeQueue}
            promiseToUpdateLevelAndScore={this.promiseToUpdateLevelAndScore}
            shape={currentShape}
          />
        </styles.Tetris>
      </Swipeable>
    )
  }
}

export default withKeyControls(Tetris);