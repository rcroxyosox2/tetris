import React from 'react';
import * as styles  from './styles';
import { Tetris } from 'components/Games/';
import { getDirectionPressed, keyCodeIsWhitelisted } from 'Common/keyCodes';

export default class GameBoard extends React.PureComponent {

  constructor(props) {
    super(props);
    this.gameRef = React.createRef();
    window.addEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (e) => {
    e.preventDefault();
    const keyCode = e.keyCode;
    if (this.gameRef.current && keyCodeIsWhitelisted(keyCode)) {
      this.gameRef.current.handleKeyDown(e, {
        directionPressed: getDirectionPressed(keyCode)
      });
    }
  }

  render() {
    return (
      <styles.GameBoard>
        <styles.GameBoardGlobal />
        <Tetris ref={this.gameRef} />
        Hello there world
      </styles.GameBoard>
    );
  }
}