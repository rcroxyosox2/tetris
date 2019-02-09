import React from 'react';
import * as styles  from './styles';
import withKeyControls from './controls/keyControls';
import GridMatrix from './components/Matrix';

class Tetris extends React.Component {

  collisionDelay = 80

  state = {
    level: 1,
    points: 0,
    timeElapsed: 0
  }

  render() {
    return (
      <styles.Tetris>
        <GridMatrix ref={this.props.keyControlRef} collisionDelay={this.collisionDelay} {...this.stte} />
      </styles.Tetris>
    )
  }
}

export default withKeyControls(Tetris);