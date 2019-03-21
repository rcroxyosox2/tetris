import React from 'react';


const withMobileControls = (WrappedComponent) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      console.log('doing it...')
    }
    handleTouchStart = (e) => {
      console.log(e.touches)
    }
    render() {
      return (
        <React.Fragment>
          <WrappedComponent onTouchStart={this.handleTouchStart} />
        </React.Fragment>
      );
    }
  }
}

export default withMobileControls