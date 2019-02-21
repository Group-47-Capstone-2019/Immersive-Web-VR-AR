import * as THREE from 'three';
import { Direction, hideStartMessage, showStartMessage, createFullScreenButton } from './control-utils';

/* eslint-disable prefer-const */

let touchscreen = {
  joystickOriginX: 0,
  joystickOriginY: 0,
  currentTouchId: null,
  currentPointerId: null,
  movingDirection: Direction.Stopped,
  prevTime: performance.now()
};

const joystick = document.querySelector('#joystick');
const touchControls = document.querySelector('#joystick-controls');

export let userPosition = new THREE.Vector3();

/* eslint-enable prefer-const */

/**
 * Computes which direction the joystick is moving in order to move the
 * user in the appropriate direction.
 * @param {*} deltaX
 * @param {*} deltaY
 */
export function computeDirection(deltaX, deltaY) {
  if ((deltaX <= 70 && deltaX >= -70) && (deltaY <= 70 && deltaY >= -70)) {
    joystick.style.transform = `translate(${deltaX}px,${deltaY}px)`;
  }
  const rotation = Math.atan2(deltaY, deltaX);
  const angle45Degree = Math.PI / 4;

  /* eslint-disable brace-style */

  if (rotation > angle45Degree && rotation < angle45Degree * 3) {
    touchscreen.movingDirection = Direction.Backward;
  }
  else if (rotation < -angle45Degree && rotation > -angle45Degree * 3) {
    touchscreen.movingDirection = Direction.Forward;
  }
  else if (rotation >= 0 && rotation <= angle45Degree) {
    touchscreen.movingDirection = Direction.Right;
  }
  else if (rotation <= -angle45Degree * 3 || rotation >= angle45Degree * 3) {
    touchscreen.movingDirection = Direction.Left;
  }

  /* eslint-enable brace-style */
}

/**
 * Called after the pointerdown event is fired.
 * Stores where on the screen is touched.
 * @param {*} ev
 */
export function handlePointerDown(ev) {
  ev.preventDefault();
  ev.stopImmediatePropagation();
  touchscreen.joystickOriginX = ev.x;
  touchscreen.joystickOriginY = ev.y;
  touchscreen.currentPointerId = ev.pointerId;
}

/**
 * Called after the touchstart event is fired.
 * Stores where on the screen is touched.
 * @param {*} ev
 */
export function handleTouchStart(ev) {
  const touch = ev.changedTouches[0];
  touchscreen.currentTouchId = touch.identifier;
  touchscreen.joystickOriginX = touch.pageX;
  touchscreen.joystickOriginY = touch.pageY;
  ev.preventDefault();
}

/**
 * Called after the pointermove event is fired.
 * Computes the difference/delta of the positioning of the touch
 * point. Calls computeDirection in order to compute the direction
 * to move.
 * @param {*} ev
 */
export function handlePointerMove(ev) {
  console.log("Move");
  ev.preventDefault();
  ev.stopImmediatePropagation();
  if (touchscreen.currentPointerId === null) {
    return;
  }
  const deltaX = ev.x - touchscreen.joystickOriginX;
  const deltaY = ev.y - touchscreen.joystickOriginY;
  computeDirection(deltaX, deltaY);
}

/**
 * Called after the touchmove event is fired.
 * Computes the difference/delta of the positioning of the touch
 * point. Calls computeDirection in order to compute the direction
 * to move.
 * @param {*} ev
 */
export function handleTouchMove(ev) {
  if (touchscreen.currentTouchId === null) {
    return;
  }
  const touchList = ev.changedTouches;
  for (let i = 0; i < touchList.length; i++) {
    if (touchList[i].identifier === touchscreen.currentTouchId) {
      const touch = touchList[i];
      const deltaX = touch.pageX - touchscreen.joystickOriginX;
      const deltaY = touch.pageY - touchscreen.joystickOriginY;
      computeDirection(deltaX, deltaY);
      ev.preventDefault();
    }
  }
}

/**
 * Called when the touchend event is fired.
 * Resets the joystick back to default.
 * @param {*} e
 */
export function handleTouchEnd(e) {
  e.preventDefault();
  e.stopImmediatePropagation();
  touchscreen.joystickOriginX = 0;
  touchscreen.joystickOriginY = 0;
  touchscreen.currentTouchId = null;
  touchscreen.currentPointerId = null;
  touchscreen.movingDirection = Direction.Stopped;
  joystick.style.transform = 'translate(0px, 0px)';
}

/**
 * Displays the joystick and adds the necessary event listeners.
 * We opt to use the pointer event listeners if supported, otherwise
 * the touch event listeners are used.
 */
export function showTouchControls() {
  try {
    createFullScreenButton();
  } catch (err) {
    console.log("Error: " + err);
  }
  joystick.style.visibility = 'visible';
  touchControls.style.display = 'inline';
  if (window.PointerEvent) {
    joystick.addEventListener('pointerdown', (ev) => { handlePointerDown(ev); });
    joystick.addEventListener('pointermove', (ev) => { handlePointerMove(ev); });
    joystick.addEventListener('pointerup', (ev) => { handleTouchEnd(ev); });
  } else {
    joystick.addEventListener('touchstart', (ev) => { handleTouchStart(ev); });
    joystick.addEventListener('touchmove', (ev) => { handleTouchMove(ev); });
    joystick.addEventListener('touchend', (ev) => { handleTouchEnd(ev); });
  }
}

/**
 * Hides the joystick and removes the event listeners.
 */
export function hideTouchControls() {
  joystick.style.visibility = 'hidden';
  touchControls.style.display = 'none';
  if (window.PointerEvent) {
    joystick.removeEventListener('pointerdown', handlePointerDown());
    joystick.removeEventListener('pointermove', handlePointerMove());
    joystick.removeEventListener('pointerup', handleTouchEnd());
  } else {
    joystick.removeEventListener('touchstart', handleTouchStart());
    joystick.removeEventListener('touchmove', handleTouchMove());
    joystick.removeEventListener('touchend', handleTouchEnd());
  }
}

/**
 * Called from within the animationCallback function of the scene.
 * Updates the user position based on the movingDirection.
 * @param {*} viewMatrix
 */
export function updateTouchPosition(viewMatrix) {
  const rotation = new THREE.Quaternion();
  viewMatrix.decompose(new THREE.Vector3(), rotation, new THREE.Vector3());
  const time = performance.now();
  const delta = (time - touchscreen.prevTime) / 1000;

  const invRotation = rotation.inverse();
  const norm = Math.sqrt(invRotation.w * invRotation.w + invRotation.y * invRotation.y);
  const invYawRotation = new THREE.Quaternion(0, invRotation.y / norm, 0, invRotation.w / norm);

  let deltaX = 0;
  let deltaZ = 0;

  const movingDistance = 10.0 * delta;

  if ((touchscreen.movingDirection & Direction.Forward) === Direction.Forward) {
    deltaZ = movingDistance;
  }
  if ((touchscreen.movingDirection & Direction.Backward) === Direction.Backward) {
    deltaZ = -movingDistance;
  }
  if ((touchscreen.movingDirection & Direction.Left) === Direction.Left) {
    deltaX = movingDistance;
  }
  if ((touchscreen.movingDirection & Direction.Right) === Direction.Right) {
    deltaX = -movingDistance;
  }

  /* eslint-disable prefer-const */

  let deltaPosition = new THREE.Vector3(deltaX, 0, deltaZ);

  /* eslint-enable prefer-const */

  deltaPosition.applyQuaternion(invYawRotation);

  userPosition.add(deltaPosition);

  // Temporary boundaries

  if (userPosition.z > 11) {
    userPosition.z = 11;
  }
  if (userPosition.z < -11) {
    userPosition.z = -11;
  }
  if (userPosition.x > 11) {
    userPosition.x = 11;
  }
  if (userPosition.x < -11) {
    userPosition.x = -11;
  }

  touchscreen.prevTime = time;
}
