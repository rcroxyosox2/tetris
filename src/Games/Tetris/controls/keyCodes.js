const directions = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right'
}

const actions = {
  PRIMARY: 'primary',
  PAUSE: 'pause'
}

const keyLabels = {...directions, ...actions};

const keyCodes = {
  // [directions.UP]: [38, 87],
  [directions.DOWN]: [40, 83],
  [directions.LEFT]: [37, 65],
  [directions.RIGHT]: [39, 68],
  [actions.PRIMARY]: [13, 38, 87], //spacebar, enter
  [actions.PAUSE]: [80, 32]
};

const getKeyLabelPressed = (keyCode) => {
  return Object.keys(keyCodes).filter(k => keyCodes[k].indexOf(keyCode) > -1).join('');
}

const whiteListedKeys = Object.keys(keyCodes).map;

const keyCodeIsWhitelisted = (keyCode) => {
  let whiteList = [];
  Object.keys(keyCodes).forEach(keyCode => {
    whiteList = whiteList.concat(keyCodes[keyCode])
  });
  return whiteList.indexOf(keyCode > -1);
}

export default keyCodes;
export { directions, keyLabels, getKeyLabelPressed, whiteListedKeys, keyCodeIsWhitelisted };
