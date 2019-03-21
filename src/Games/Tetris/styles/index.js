import styled from 'styled-components';

export const Tetris = styled.div.attrs({className: 'Tetris'})`
  transition: all 1000ms ease-in-out;
  overflow: hidden;
  height: 100%;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  ${props => {
    if(props.rotated) {
      return 'transform: rotate(180deg);';
    }
  }}
`;

export const ButtonControls = styled.div.attrs({className: 'ButtonControls'})`
  width: 100%;
  height: 100%;
  position: fixed;
  display: flex;
  flex-flow: row;
  align-items: flex-end;
  > button {
    outline: none;
    appearance: none;
    background: rgba(255, 0, 0, 0.8);
    -webkit-tap-highlight-color: transparent;
    border: none;
    width: 50%;
    height: 150px;
    flex: 1;
  }
`;
