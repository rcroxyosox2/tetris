import styled from 'styled-components'

export const PauseScreen = styled.div.attrs({className: 'PauseScreenStyle'})`
  position: fixed;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(68,68,68,0.8);
  font-size: 10vmin;
  z-index: 100;
`;