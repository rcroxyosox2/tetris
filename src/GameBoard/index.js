import React from 'react';
import * as styles  from './styles';
import { Tetris } from 'Games/';

export default class GameBoard extends React.PureComponent {
  render() {
    return (
      <styles.GameBoard>
        <styles.GameBoardGlobal />
        <Tetris />
      </styles.GameBoard>
    );
  }
}