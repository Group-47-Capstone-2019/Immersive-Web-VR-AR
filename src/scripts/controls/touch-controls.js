import * as THREE from 'three';
import { Direction } from './control-utils';

const touchscreen = {
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

export function computeDirection(deltaX, deltaY) {
  if ((deltaX <= 70 && deltaX >= -70) && (deltaY <= 70 && deltaY >= -70))
    joystick.style.transform = 'translate(' + deltaX + 'px,' + deltaY + 'px)';
  let rotation = Math.atan2(deltaY, deltaX);
  let angle45Degree = Math.PI / 4;
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
}

export function handlePointerDown(ev) {
  ev.preventDefault();
  ev.stopImmediatePropagation();
  touchscreen.joystickOriginX = ev.x;
  touchscreen.joystickOriginY = ev.y;
  touchscreen.currentPointerId = ev.pointerId;
}

export function handleTouchStart(ev) {
  let touch	= ev.changedTouches[0];
  touchscreen.currentTouchId	= touch.identifier;
  touchscreen.joystickOriginX = touch.pageX;
  touchscreen.joystickOriginY = touch.pageY;
  ev.preventDefault();
}

export function handlePointerMove(ev) {
  ev.preventDefault();
  ev.stopImmediatePropagation();
  if (touchscreen.currentPointerId === null) {
    return;
  }
  let deltaX = ev.x - touchscreen.joystickOriginX;
  let deltaY = ev.y - touchscreen.joystickOriginY;
  computeDirection(deltaX, deltaY);
}

export function handleTouchMove(ev) {
  if ( touchscreen.currentTouchId === null) {
    return;
  }
  let touchList	= ev.changedTouches;
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

export function handleTouchEnd(e) {
  e.preventDefault();
  e.stopImmediatePropagation();
  touchscreen.joystickOriginX = 0;
  touchscreen.joystickOriginY = 0;
  touchscreen.currentTouchId	= null;
  touchscreen.currentPointerId = null;
  touchscreen.movingDirection = Direction.Stopped;
  joystick.style.transform = 'translate(0px, 0px)';
}

export function showTouchControls() {
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

export function updateTouchPosition(viewMatrix) {
  const rotation = new THREE.Quaternion();
  viewMatrix.decompose(new THREE.Vector3(), rotation, new THREE.Vector3());
  const time = performance.now();
  const delta = (time - touchscreen.prevTime) / 1000;

  const invertedRotation = rotation.inverse();
  const norm = Math.sqrt(invertedRotation.w * invertedRotation.w + invertedRotation.y * invertedRotation.y);
  const invertedYawRotation = new THREE.Quaternion(0, invertedRotation.y / norm, 0, invertedRotation.w / norm);

  let delta_x = 0;
  let delta_z = 0;

  const movingDistance = 10.0 * delta;

  if ((touchscreen.movingDirection & Direction.Forward) === Direction.Forward)
      delta_z = movingDistance;
  if ((touchscreen.movingDirection & Direction.Backward) === Direction.Backward)
      delta_z = -movingDistance;
  if ((touchscreen.movingDirection & Direction.Left) === Direction.Left)
      delta_x = movingDistance;
  if ((touchscreen.movingDirection & Direction.Right) === Direction.Right)
      delta_x = -movingDistance;

  let deltaPosition = new THREE.Vector3(delta_x, 0, delta_z);
  deltaPosition.applyQuaternion(invertedYawRotation);

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
