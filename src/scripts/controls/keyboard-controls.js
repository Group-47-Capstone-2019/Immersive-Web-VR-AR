import THREE from '../three';
import { camera } from '../renderer/camera';
import { Direction, showStartMessage, hideStartMessage, tryFullScreen } from './control-utils';

const Key = {
  W: 87,
  A: 65,
  S: 83,
  D: 68,
  Up: 38,
  Down: 40,
  Left: 37,
  Right: 39
};

/* eslint-disable prefer-const */

let prevTime = performance.now();
let velocity = new THREE.Vector3();
let movingDirection = Direction.Stopped;
const canvas = document.querySelector('#vr-port');

/* eslint-enable prefer-const */

export let controls;
export let keyboard = false;

/**
 * Checks for PointerLockControls support in browser.
 */
export function hasPointerLock() {
  const havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
  return havePointerLock;
}

/**
 * Called when the pointerlockchange event is fired.
 * Either hides or shows the start message and enables or
 * disables the PointerLockControls.
 */
export function pointerLockChanged() {
  /* eslint-disable brace-style */

  if (document.pointerLockElement === document.body
    || document.mozPointerLockElement === document.body
    || document.webkitPointerLockElement === document.body) {
    controls.enabled = true;
    hideStartMessage();
  }
  else {
    showStartMessage();
    controls.enabled = false;
  }

  /* eslint-enable brace-style */
}

/**
 * Called when the keydown event is fired after a key is pressed.
 * Uses the event to identify which key is pressed.
 * The OR operation (|) is used to keep track of which keys
 * are currently being pressed. With the numbers chosen to indicate directions,
 * this is essentially the same as adding them together.
 * @param {*} event
 */
export function onKeyDown(event) {
  switch (event.keyCode) {
    case Key.Up:
    case Key.W:
      movingDirection |= Direction.Forward;
      break;
    case Key.Left:
    case Key.A:
      movingDirection |= Direction.Left;
      break;
    case Key.Down:
    case Key.S:
      movingDirection |= Direction.Backward;
      break;
    case Key.Right:
    case Key.D:
      movingDirection |= Direction.Right;
      break;
    default:
      break;
  }
}

/**
 * Called when the keyup event is fired after a key is released.
 * Uses the event to identify the released key.
 * The AND operation (&) is used to keep track of which keys
 * are currently being pressed. Paired with the NOT (~), or bit-inverse
 * of the directions, this essentially acts as subtracting the direction
 * of the key from the total movingDirection variable.
 * @param {*} event
 */
export function onKeyUp(event) {
  switch (event.keyCode) {
    case Key.Up:
    case Key.W:
      movingDirection &= ~Direction.Forward;
      break;
    case Key.Left:
    case Key.A:
      movingDirection &= ~Direction.Left;
      break;
    case Key.Down:
    case Key.S:
      movingDirection &= ~Direction.Backward;
      break;
    case Key.Right:
    case Key.D:
      movingDirection &= ~Direction.Right;
      break;
    default:
      break;
  }
}

/**
 * Enables the necessary event listeners for the keyboard and mouse
 * controls. The multiple different pointerlockchange event listeners
 * are to support several browsers. The keydown and keyup events are
 * for movement with WASD/arrow keys.
 */
export function addMouseKeyboardEventListeners() {
  if (!hasPointerLock()) {
    return;
  }

  keyboard = true;
  controls = new THREE.PointerLockControls(camera);
  controls.getObject().position.y = 1;

  document.addEventListener('pointerlockchange', () => { pointerLockChanged(); }, false);
  document.addEventListener('mozpointerlockchange', () => { pointerLockChanged(); }, false);
  document.addEventListener('webkitpointerlockchange', () => { pointerLockChanged(); }, false);
  document.addEventListener('keydown', (event) => { onKeyDown(event); }, false);
  document.addEventListener('keyup', (event) => { onKeyUp(event); }, false);

  canvas.addEventListener('click', () => {
    document.body.requestPointerLock = document.body.requestPointerLock
      || document.body.mozRequestPointerLock
      || document.body.webkitRequestPointerLock;
    document.body.requestPointerLock();
    tryFullScreen();
  }, false);
}

/**
 * This is called inside of the animationCallback function of the scene and is what updates
 * the position of the camera to simulate movement. The AND operation (&) is used,
 * except in a different way. Here, the AND operation is makes it easy for us know
 * which keys are currently being pressed due to the numbers we chose. As long as
 * the button is pressed and the direction value has been OR'd into the movingDirection,
 * then ANDing it with the direction value will result in the direction value, otherwise
 * it wont. This allows us to create 45 degree movement when 2 keys, such as the W and A key,
 * are pressed down at the same time.
 */
export function updatePosition() {
  const time = performance.now();
  const delta = (time - prevTime) / 1000;

  // Decrease the velocity to avoid a rigid stop, creating more realistic movement.
  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;

  /* eslint-disable prefer-const */

  let controlsYaw = controls.getObject();

  /* eslint-enable prefer-const */

  const movingDistance = 100.0 * delta;

  if ((movingDirection & Direction.Forward) === Direction.Forward) {
    velocity.z -= movingDistance;
  }
  if ((movingDirection & Direction.Backward) === Direction.Backward) {
    velocity.z += movingDistance;
  }
  if ((movingDirection & Direction.Left) === Direction.Left) {
    velocity.x -= movingDistance;
  }
  if ((movingDirection & Direction.Right) === Direction.Right) {
    velocity.x += movingDistance;
  }

  controlsYaw.translateX(velocity.x * delta);
  controlsYaw.translateZ(velocity.z * delta);

  // Temporary boundaries

  if (controlsYaw.position.z > 11) {
    controlsYaw.position.z = 11;
  }
  if (controlsYaw.position.z < -11) {
    controlsYaw.position.z = -11;
  }

  if (controlsYaw.position.x > 11) {
    controlsYaw.position.x = 11;
  }
  if (controlsYaw.position.x < -11) {
    controlsYaw.position.x = -11;
  }

  prevTime = time;
}
