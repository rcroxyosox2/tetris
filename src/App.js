import React, { Component } from 'react';
import GameBoard from './GameBoard';
import { ThemeProvider } from 'styled-components';
import { defaultTheme } from 'Themes/';

import './App.css';

class App extends Component {
  render() {
    return (
      <ThemeProvider className="App" theme={defaultTheme}>
        <GameBoard />
      </ThemeProvider>
    );
  }
}

export default App;
