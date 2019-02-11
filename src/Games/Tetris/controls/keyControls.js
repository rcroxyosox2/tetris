import React from 'react';
import { directions, keyLabels, getKeyLabelPressed, keyCodeIsWhitelisted } from 'Games/Tetris/controls/keyCodes';


const withKeyControls = (WrappedComponent) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.keyControlRef = React.createRef();
      window.focus();
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
      window.addEventListener('blur', this.handleBlur);
      this.timers = {};
      this.repeat = 40;
    }

    componentWillUnmount() {
      window.removeEventListener('keydown', this.handleKeyDown);
      window.removeEventListener('keyup', this.handleKeyUp);
      window.removeEventListener('blur', this.handleBlur);
    }

    handleGameKeydown = (e, { keyCode }) => {
      this.keyControlRef.current.handleKeyDown(e, {
        keyLabelPressed: getKeyLabelPressed(keyCode)
      });
    }

    handleKeyDown = (e) => {

      // e.preventDefault();
      var keyCode = e.keyCode;

      if (!keyCodeIsWhitelisted(keyCode)){
          return true;
      }

      const keyPressed = getKeyLabelPressed(keyCode);

      if(Object.keys(directions).map(k => directions[k]).includes(keyPressed)) {
        e.preventDefault();
      }

      if (keyPressed !== keyLabels.UP && keyPressed !== keyLabels.DOWN) {
        this.handleGameKeydown(e, { keyCode });
        return true;
      }

      if (!(keyCode in this.timers)) {
          this.timers[keyCode] = null;
          this.handleGameKeydown(e, {keyCode});
          if (this.repeat !== 0) {
            this.timers[keyCode] = setInterval(() => {
              this.handleGameKeydown(e, {keyCode});
            }, this.repeat);
          }
      }

      return false;
    }

    handleKeyUp = (e) => {
      var keyCode = (e || window.event).keyCode;
      if (keyCode in this.timers) {
        if (this.timers[keyCode] !== null) {
          clearInterval(this.timers[keyCode]);
        }
        delete this.timers[keyCode];
      }
    }

    handleBlur = () => {
      for (let key in this.timers) {
        if (this.timers[key]!==null) {
          clearInterval(this.timers[key]);
        }
      }
      this.timers= {};
    }

    render() {
      return (
        <React.Fragment>
          <WrappedComponent keyControlRef={this.keyControlRef} />
        </React.Fragment>
      );
    }
  }
}

export default withKeyControls;