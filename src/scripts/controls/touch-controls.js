import * as THREE from 'three';
import { Direction, createFullScreenButton } from './control-utils';
import { XR } from '../xrController';

/* eslint-disable prefer-const */

export let touchscreen = {
  joystickOriginX: 0,
  joystickOriginY: 0,
  rotstickOriginX: 0,
  rotstickOriginY: 0,
  currentTouchId: null,
  currentPointerId: null,
  movingDirection: Direction.Stopped,
  prevTime: performance.now(),
  enabled: false
};

const joystick = document.querySelector('#joystick');
const touchControls = document.querySelector('#joystick-controls');
const rotstick = document.querySelector('#rotstick');
const rotControls = document.querySelector('#rotstick-controls');

let velocity = new THREE.Vector3();
let spin = new THREE.Vector2();

function updateStick(deltaX, deltaY, stick) {
  if ((deltaX <= 70 && deltaX >= -70) && (deltaY <= 70 && deltaY >= -70)) {
    stick.style.transform = `translate(${deltaX}px,${deltaY}px)`;
  } else if ((deltaX <= 70 && deltaX >= -70) && (deltaY > 70)) {
    stick.style.transform = `translate(${deltaX}px,70px)`;
  } else if ((deltaX <= 70 && deltaX >= -70) && (deltaY < -70)) {
    stick.style.transform = `translate(${deltaX}px,-70px)`;
  } else if ((deltaY <= 70 && deltaY >= -70) && (deltaX > 70)) {
    stick.style.transform = `translate(70px,${deltaY}px)`;
  } else if ((deltaY <= 70 && deltaY >= -70) && (deltaX < -70)) {
    stick.style.transform = `translate(-70px,${deltaY}px)`;
  }
}

function computeVelocity(deltaX, deltaY) {
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
    velocity.x = -deltaX;
    velocity.z = -deltaY;
  }
}

function computeRotation(deltaX, deltaY) {
  if (deltaX > 70) {
    spin.y = -70;
  }
  if (deltaX < -70) {
    spin.y = 70;
  }
  if (deltaY > 70) {
    spin.x = -70;
  }
  if (deltaY < -70) {
    spin.x = 70;
  }
  if ((deltaX <= 70 && deltaX >= -70) && (deltaY <= 70 && deltaY >= -70)) {
    spin.y = -deltaX;
    spin.x = -deltaY;
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
  switch(ev.target.id) {
    case 'joystick':
      touchscreen.joystickOriginX = ev.x;
      touchscreen.joystickOriginY = ev.y;
      break;
    case 'rotstick':
      touchscreen.rotstickOriginX = ev.x;
      touchscreen.rotstickOriginY = ev.y;
      break;
  }
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
  switch(ev.target.id) {
    case 'joystick':
      touchscreen.joystickOriginX = touch.pageX;
      touchscreen.joystickOriginY = touch.pageY;
      break;
    case 'rotstick':
      touchscreen.rotstickOriginX = touch.pageX;
      touchscreen.rotstickOriginY = touch.pageY;
      break;
  }
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

  let stick;
  let deltaX, deltaY;
  switch(ev.target.id) {
    case 'joystick':
      stick = joystick;
      deltaX = ev.x - touchscreen.joystickOriginX;
      deltaY = ev.y - touchscreen.joystickOriginY;
      computeVelocity(deltaX, deltaY);
      break;
    case 'rotstick':
      stick = rotstick;
      deltaX = ev.x - touchscreen.rotstickOriginX;
      deltaY = ev.y - touchscreen.rotstickOriginY;
      computeRotation(deltaX, deltaY);
      break;
  }

  if(stick && deltaX && deltaY) updateStick(deltaX, deltaY, stick);
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
      let stick;
      let deltaX, deltaY;
      switch(ev.target.id) {
        case 'joystick':
          stick = joystick;
          deltaX = touch.pageX - touchscreen.joystickOriginX;
          deltaY = touch.pageY - touchscreen.joystickOriginY;
          computeVelocity(deltaX, deltaY);
          break;
        case 'rotstick':
          stick = rotstick;
          deltaX = touch.pageX - touchscreen.rotstickOriginX;
          deltaY = touch.pageY - touchscreen.rotstickOriginY;
          computeRotation(deltaX, deltaY);
          break;
      }
      if(stick && deltaX && deltaY) updateStick(deltaX, deltaY, stick);
      ev.preventDefault();
    }
  }
}

/**
 * Called when the touchend event is fired.
 * Resets the joystick back to default.
 * @param {*} e
 */
export function handleTouchEnd(ev) {
  ev.preventDefault();
  ev.stopImmediatePropagation();
  let stick;
  switch(ev.target.id) {
    case 'joystick':
      stick = joystick;
      velocity.x = 0;
      velocity.z = 0;
      touchscreen.joystickOriginX = 0;
      touchscreen.joystickOriginY = 0;
      touchscreen.movingDirection = Direction.Stopped;
      break;
    case 'rotstick':
      stick = rotstick;
      velocity.x = 0;
      velocity.z = 0;
      touchscreen.rotstickOriginX = 0;
      touchscreen.rotstickOriginY = 0;
      touchscreen.movingDirection = Direction.Stopped;
      break;
  }

  touchscreen.currentTouchId = null;
  touchscreen.currentPointerId = null;

  if(stick) stick.style.transform = 'translate(0px, 0px)';
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
  touchControls.style.display = 'inline';
  rotControls.style.display = 'inline';
  [joystick, rotstick].forEach((stick) => {
    stick.style.visibility = 'visible';
    if (window.PointerEvent) {
      stick.addEventListener('pointerdown', (ev) => { handlePointerDown(ev); });
      stick.addEventListener('pointermove', (ev) => { handlePointerMove(ev); });
      stick.addEventListener('pointerup', (ev) => { handleTouchEnd(ev); });
    } else {
      stick.addEventListener('touchstart', (ev) => { handleTouchStart(ev); });
      stick.addEventListener('touchmove', (ev) => { handleTouchMove(ev); });
      stick.addEventListener('touchend', (ev) => { handleTouchEnd(ev); });
    }
  });
  touchscreen.enabled = true;
}

/**
 * Hides the joystick and removes the event listeners.
 */
export function hideTouchControls() {
  touchControls.style.display = 'none';
  rotControls.style.display = 'none';
  [joystick, rotstick].forEach((stick) => {
    stick.style.visibility = 'hidden';
    if (window.PointerEvent) {
      stick.removeEventListener('pointerdown', handlePointerDown());
      stick.removeEventListener('pointermove', handlePointerMove());
      stick.removeEventListener('pointerup', handleTouchEnd());
    } else {
      stick.removeEventListener('touchstart', handleTouchStart());
      stick.removeEventListener('touchmove', handleTouchMove());
      stick.removeEventListener('touchend', handleTouchEnd());
    }
  });
  touchscreen.enabled = false;
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

  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;

  const deltaX = velocity.x * delta * 0.2;
  const deltaZ = velocity.z * delta * 0.2;

  /* eslint-disable prefer-const */

  let deltaPosition = new THREE.Vector3(deltaX, 0, deltaZ);

  /* eslint-enable prefer-const */

  deltaPosition.applyQuaternion(invYawRotation);

  const offsetMat = XR.getOffsetMatrix();
  const userPosition = new THREE.Vector3().setFromMatrixPosition(offsetMat);
  userPosition.add(deltaPosition);

  const rotMatrix = new THREE.Matrix4().makeRotationY(spin.y * 0.1 * delta);
  rotMatrix.getInverse(rotMatrix);
  offsetMat.multiply(rotMatrix);
  offsetMat.setPosition(new THREE.Vector3(0, 0, 0));
  offsetMat.setPosition(userPosition);
  XR.setOffsetMatrix(offsetMat);

  touchscreen.prevTime = time;

  return userPosition;
}
