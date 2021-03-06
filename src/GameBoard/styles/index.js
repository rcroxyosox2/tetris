import styled, { createGlobalStyle } from 'styled-components';

export const GameBoardGlobal = createGlobalStyle`
  html, body {
    position: fixed;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }
  * {
    margin: 0 auto;
    box-sizing: border-box;
    padding: 0;
  }
  body {
    color: white;
    background: ${props => props.theme.gameBoard.backgroundColor };
  }
`

export const GameBoard = styled.div.attrs({className: 'GameBoard'})`
 width: 100%;
 text-align: center;
`
