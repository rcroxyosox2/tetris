const directions = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right'
}

const keyCodes = {
  [directions.UP]: [38, 87],
  [directions.DOWN]: [40, 83],
  [directions.LEFT]: [37, 65],
  [directions.RIGHT]: [39, 68]
};

const getDirectionPressed = (keyCode) => {
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
export { directions, getDirectionPressed, whiteListedKeys, keyCodeIsWhitelisted };
