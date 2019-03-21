import React from 'react';
import * as styles from './styles';


// Different surrent shapes show different paused states

export default class PauseScreen extends React.PureComponent {
  render() {
    const shapeName = this.props.pauseShape.constructor.name;
    return (
      <styles.PauseScreen>
        {`🌮 El pauso loco (on pause shape: ${shapeName}) 🌮`}
      </styles.PauseScreen>
    );
  }
}
