import * as THREE from 'three';
import { Direction, updateMovingDistance } from './control-utils'

let touchscreen = {
    joystickOriginX: 0,
    joystickOriginY: 0,
    currentTouchId: null,
    currentPointerId: null,
    movingDirection: Direction.Stopped,
    prevTime: performance.now()
}

let joystick = document.querySelector('#joystick');

export let userPosition = new THREE.Vector3();

export function hideTouchControls() {
    let touchControls = document.querySelector('#joystick-controls');
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

export function showTouchControls() {
    let touchControls = document.querySelector('#joystick-controls');
    joystick.style.visibility = 'visible';
    touchControls.style.display = 'inline';
    if (window.PointerEvent) {
        joystick.addEventListener('pointerdown', (ev) => { handlePointerDown(ev) });
        joystick.addEventListener('pointermove', (ev) => { handlePointerMove(ev) });
        joystick.addEventListener('pointerup', (ev) => {handleTouchEnd(ev)});
    } else {
        joystick.addEventListener('touchstart', (ev) => { handleTouchStart(ev) });
        joystick.addEventListener('touchmove', (ev) => { handleTouchMove(ev) });
        joystick.addEventListener('touchend', (ev) => {handleTouchEnd(ev)});
    }
    
}

export function handlePointerDown(ev) {
    ev.preventDefault();
    ev.stopImmediatePropagation();
    console.log("Pointer point touched");
    touchscreen.joystickOriginX = ev.x;
    touchscreen.joystickOriginY = ev.y;
    touchscreen.currentPointerId = ev.pointerId;
}

export function handleTouchStart(ev) {
    let touch	= ev.changedTouches[0];
    touchscreen.currentTouchId	= touch.identifier;
    touchscreen.joystickOriginX = touch.pageX;
    touchscreen.joystickOriginY = touch.pageY;
    console.log("Touch point touched");
    ev.preventDefault();
}

export function handlePointerMove(ev) {
    ev.preventDefault();
    ev.stopImmediatePropagation();
    console.log("Moving pointer point");
    if(touchscreen.currentPointerId === null)
        return;
    let deltaX = ev.x - touchscreen.joystickOriginX;
    let deltaY = ev.y - touchscreen.joystickOriginY;
    computeDirection(deltaX, deltaY);
}

export function handleTouchMove(ev) {
    console.log("Moving touch point");
    if( touchscreen.currentTouchId === null){
    //    console.log("Oops, null");
        return;
    }
    let touchList	= ev.changedTouches;
    for(let i = 0; i < touchList.length; i++) {
      //  console.log("Checking");
        if(touchList[i].identifier == touchscreen.currentTouchId) {
       //     console.log("Moving");
            var touch	= touchList[i];
            let deltaX = touch.pageX - touchscreen.joystickOriginX;
            let deltaY = touch.pageY - touchscreen.joystickOriginY;
            computeDirection(deltaX, deltaY);
            ev.preventDefault();
        }
    }
}

export function computeDirection(deltaX, deltaY) {
    if ((deltaX <= 70 && deltaX >= -70) && (deltaY <= 70 && deltaY >= -70))
        joystick.style.transform = 'translate(' + deltaX + 'px,' + deltaY + 'px)';
    let rotation = Math.atan2(deltaY, deltaX);
    let angle45Degree = Math.PI / 4;
    if (rotation > angle45Degree && rotation < angle45Degree * 3)
        touchscreen.movingDirection = Direction.Backward;
    else if (rotation < -angle45Degree && rotation > -angle45Degree * 3)
        touchscreen.movingDirection = Direction.Forward;
    else if (rotation >= 0 && rotation <= angle45Degree)
        touchscreen.movingDirection = Direction.Right;
    else if (rotation <= -angle45Degree * 3 || rotation >= angle45Degree * 3)
        touchscreen.movingDirection = Direction.Left;
}

export function handleTouchEnd(e) {
    console.log("end");
    e.preventDefault();
    e.stopImmediatePropagation();
    touchscreen.joystickOriginX = 0;
    touchscreen.joystickOriginY = 0;
    touchscreen.currentTouchId	= null;
    touchscreen.currentPointerId = null;
    touchscreen.movingDirection = Direction.Stopped;
    joystick.style.transform = 'translate(0px, 0px)';
}

export function updateTouchPosition(viewMatrix) {
    let rotation = new THREE.Quaternion();
    viewMatrix.decompose(new THREE.Vector3(), rotation, new THREE.Vector3());
    let time = performance.now();
    let delta = (time - touchscreen.prevTime) / 1000;

    let invertedRotation = rotation.inverse();
    let norm = Math.sqrt(invertedRotation.w * invertedRotation.w + invertedRotation.y * invertedRotation.y);
    let invertedYawRotation = new THREE.Quaternion(0, invertedRotation.y / norm, 0, invertedRotation.w / norm);

    let deltaXZ = {
        x: 0,
        z: 0
    }

    let movingDistance = 250.0 * delta * delta;

    updateMovingDistance(deltaXZ, movingDistance, touchscreen.movingDirection, 1);
    /*if ((touchscreen.movingDirection & Direction.Forward) === Direction.Forward)
        deltaXZ.z = movingDistance;
    if ((touchscreen.movingDirection & Direction.Backward) === Direction.Backward)
        deltaXZ.z = -movingDistance;
    if ((touchscreen.movingDirection & Direction.Left) === Direction.Left)
        deltaXZ.x = movingDistance;
    if ((touchscreen.movingDirection & Direction.Right) === Direction.Right)
        deltaXZ.x = -movingDistance;*/

    let deltaPosition = new THREE.Vector3(deltaXZ.x, 0, deltaXZ.z);
    deltaPosition.applyQuaternion(invertedYawRotation);

    userPosition.add(deltaPosition);

    // Temporary boundaries

    if (userPosition.z > 11)
        userPosition.z = 11;
    if (userPosition.z < -11)
        userPosition.z = -11;
    if (userPosition.x > 11)
        userPosition.x = 11;
    if (userPosition.x < -11)
        userPosition.x = -11;

    touchscreen.prevTime = time;
}