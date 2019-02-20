import THREE from '../three';
import { camera } from '../renderer/camera';
import { Direction, updateMovingDistance } from './control-utils';

const Key = {
  W: 87,
  A: 65,
  S: 83,
  D: 68,
  Up: 38,
  Down: 40,
  Left: 37,
  Right: 39
}

let prevTime = performance.now();
let velocity = new THREE.Vector3();
let movingDirection = Direction.Stopped;
let startMessage = document.querySelector('#start');
let arrow = document.querySelector('#arrow');
let canvas = document.querySelector('#vr-port');
export let controls;
export let keyboard = false;

  /**
   * Checks for PointerLockControls support in browser
   */
export function hasPointerLock() {
  let havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
  return havePointerLock;
}

export function addMouseKeyboardEventListeners(){
  if(!hasPointerLock()) 
    return;

  keyboard = true;
  controls = new THREE.PointerLockControls(camera);
  controls.getObject().position.y = 1;

  document.addEventListener('pointerlockchange', () => {pointerLockChanged()}, false);
  document.addEventListener('mozpointerlockchange', () => {pointerLockChanged()}, false);
  document.addEventListener('webkitpointerlockchange', () => {pointerLockChanged()}, false);
  document.addEventListener('keydown', event => {onKeyDown(event)}, false);
  document.addEventListener('keyup', event => {onKeyUp(event)}, false);
  
  canvas.addEventListener('click', () => {
    document.body.requestPointerLock = document.body.requestPointerLock ||
      document.body.mozRequestPointerLock ||
      document.body.webkitRequestPointerLock;
    document.body.requestPointerLock();
    console.log("Here");
  }, false);
}

    /**
     * Called when the pointerlockchange event is fired
     */
export function pointerLockChanged(){
  if(document.pointerLockElement === document.body ||
    document.mozPointerLockElement === document.body ||
    document.webkitPointerLockElement === document.body) {
    controls.enabled = true;
    hideStartMessage();
  }
  else {
    showStartMessage();
    controls.enabled = false;
  }
}

    /**
     * Called when the keydown event is fired after a key is pressed. Uses the event to identify which key is pressed.
     * @param {*} event 
     */
export function onKeyDown(event){
  switch(event.keyCode){
    case Key.Up:
    case Key.W:
      console.log("W or Up pressed.");
      movingDirection |= Direction.Forward;
      break;
    case Key.Left:
    case Key.A:
      console.log("A or Left pressed.");
      movingDirection |= Direction.Left;
      break;
    case Key.Down:
    case Key.S:
      console.log("S or Down pressed.");
      movingDirection |= Direction.Backward;
      break;
    case Key.Right:
    case Key.D:
      console.log("D or Right pressed.");
      movingDirection |= Direction.Right;
      break;
  }
}

    /**
     * Called when the keyup event is fired after a key is released. Uses the event to identify the released key.
     * @param {*} event 
     */
export function onKeyUp(event){
  switch(event.keyCode){
    case Key.Up:
    case Key.W:
      console.log("W or Up released.");
      movingDirection &= ~Direction.Forward;
      break;
    case Key.Left:
    case Key.A:
      console.log("A or Left released.");
      movingDirection &= ~Direction.Left;
      break;
    case Key.Down:
    case Key.S:
      console.log("S or Down released.");
      movingDirection &= ~Direction.Backward;
      break;
    case Key.Right:
    case Key.D:
      console.log("D or Right released.");
      movingDirection &= ~Direction.Right;
      break;
  }
}
    
export function hideStartMessage() {
  console.log("attempting to hide start message");
  startMessage.style.display = 'none';
  arrow.style.display = 'none';
}

export function showStartMessage() {
  console.log("attempting to show start message");
  startMessage.style.display = 'flex';
  arrow.style.display = 'flex';
}

export function updatePosition() {
  let time = performance.now();
  let delta = (time - prevTime) / 1000;

  // Decrease the velocity.
  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;

  let controls_yaw = controls.getObject();

  let movingDistance = 100.0 * delta;

  updateMovingDistance(velocity, movingDistance, movingDirection, -1);

  /*if ((movingDirection & Direction.Forward) === Direction.Forward)
    velocity.z -= movingDistance;
  if ((movingDirection & Direction.Backward) === Direction.Backward)
    velocity.z += movingDistance;
  if ((movingDirection & Direction.Left) === Direction.Left)
    velocity.x -= movingDistance;
  if ((movingDirection & Direction.Right) === Direction.Right)
    velocity.x += movingDistance;*/

  controls_yaw.translateX(velocity.x * delta);
  controls_yaw.translateZ(velocity.z * delta);

  // Temporary boundaries

  if (controls_yaw.position.z > 11)
    controls_yaw.position.z = 11;
  if (controls_yaw.position.z < -11)
    controls_yaw.position.z = -11;

  if (controls_yaw.position.x > 11)
    controls_yaw.position.x = 11;
  if (controls_yaw.position.x < -11)
    controls_yaw.position.x = -11;

  prevTime = time;
}