import {
  Vector3,
  Matrix4,
  Quaternion,
  Vector4
} from 'three';
import { Direction, createFullScreenButton } from './control-utils';
import { XR } from '../xrController';

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

let velocity = new Vector3();

/* eslint-enable prefer-const */

/**
 * Computes which direction the joystick is moving in order to move the
 * user in the appropriate direction.
 * @param {*} deltaX
 * @param {*} deltaY
 */
export function computeDirection(deltaX, deltaY) {
  if (deltaX > 70) {
    velocity.x = -70;
  }
  if (deltaX < -70) {
    velocity.x = 70;
  }
  if (deltaY > 70) {
    velocity.z = -70;
  }
  if (deltaY < -70) {
    velocity.z = 70;
  }
  if ((deltaX <= 70 && deltaX >= -70) && (deltaY <= 70 && deltaY >= -70)) {
    joystick.style.transform = `translate(${deltaX}px,${deltaY}px)`;
    velocity.x = -deltaX;
    velocity.z = -deltaY;
  } else if ((deltaX <= 70 && deltaX >= -70) && (deltaY > 70)) {
    joystick.style.transform = `translate(${deltaX}px,70px)`;
  } else if ((deltaX <= 70 && deltaX >= -70) && (deltaY < -70)) {
    joystick.style.transform = `translate(${deltaX}px,-70px)`;
  } else if ((deltaY <= 70 && deltaY >= -70) && (deltaX > 70)) {
    joystick.style.transform = `translate(70px,${deltaY}px)`;
  } else if ((deltaY <= 70 && deltaY >= -70) && (deltaX < -70)) {
    joystick.style.transform = `translate(-70px,${deltaY}px)`;
  }
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
  velocity.x = 0;
  velocity.z = 0;
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
    console.log(`Error: ${err || ''}`);
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
  const rotation = new Quaternion();
  viewMatrix.decompose(new Vector3(), rotation, new Vector3());
  const time = performance.now();
  const delta = (time - touchscreen.prevTime) / 1000;

  const invRotation = rotation.inverse();
  const norm = Math.sqrt(invRotation.w * invRotation.w + invRotation.y * invRotation.y);
  const invYawRotation = new Quaternion(0, invRotation.y / norm, 0, invRotation.w / norm);

  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;

  const deltaX = velocity.x * delta * 0.2;
  const deltaZ = velocity.z * delta * 0.2;

  /* eslint-disable prefer-const */

  let deltaPosition = new Vector3(deltaX, 0, deltaZ);

  /* eslint-enable prefer-const */

  deltaPosition.applyQuaternion(invYawRotation);

  const refSpace = (XR.session.mode === 'immersive-vr')
    ? XR.immersiveRefSpace
    : XR.nonImmersiveRefSpace;
  const offsetMat = new Matrix4();
  offsetMat.elements = refSpace.originOffset.matrix;
  const userPosition = new Vector3();
  userPosition.setFromMatrixPosition(offsetMat);

  userPosition.add(deltaPosition);

  const position = new Vector4(userPosition.x, userPosition.y, userPosition.z, 1);
  refSpace.originOffset = new XRRigidTransform(position);
  //  console.log(refSpace.originOffset.position);

  touchscreen.prevTime = time;
}
