import styled from 'styled-components';

const tileProps = {
  a: {
    background: 'white'
  },
  b: {
    background: 'red'
  },
  c: {
    background: 'orange'
  },
  d: {
    background: 'green'
  },
  null: {
    background: 'transparent'
  }
}

export const GridSquare = styled.div.attrs({className: 'GridSquare'})`
  width: ${props => props.sqSize}px;
  height: ${props => props.sqSize}px;
  display: inline-block;
  border: ${props => props.theme.matrix.border.inner};
  border-left: none;
  background: ${props => tileProps[props.tileType].background}
  border-bottom: none;
`;

export const GridRow = styled.div.attrs({className: 'GridRow'})`
  display: flex;
  ${GridSquare} {
    &:first-child {
      border-left: ${props => props.theme.matrix.border.inner};
    }
  }
`;

export const GridMatrix = styled.div.attrs({className: 'GridMatrix'})`
  display: flex;
  flex-flow: column;
  ${GridRow} {
    &:last-child {
      ${GridSquare} {
        border-bottom: ${props => props.theme.matrix.border.inner};
      }
    }
  }
`;

export const GridMatrixContainer = styled.div.attrs({className: 'GridMatrixContainer'})`
  border: 1px solid red;
  height: 100vh;
`