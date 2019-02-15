import * as THREE from 'three';

const Direction = {
    Stopped: 0,
    Left: 1,
    Right: 2,
    Forward: 4,
    Backward: 8
}

let touchscreen = {
    joystickOriginX: 0,
    joystickOriginY: 0,
    currentTouchId: null,
    currentPointerId: null,
    movingDirection: Direction.Stopped,
    prevTime: performance.now(),
    velocity: new THREE.Vector3(),
}

export let userPosition = new THREE.Vector3();

export function hideTouchControls() {
    let touchControls = document.querySelector('#joystick-controls');
    let joystick = document.querySelector('#joystick');
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
    let joystick = document.querySelector('#joystick');
    touchControls.style.display = 'inline';
    if (window.PointerEvent) {
        joystick.addEventListener('pointerdown', (ev) => { handlePointerDown(ev) });
        joystick.addEventListener('pointermove', (ev) => { handlePointerMove(ev) });
        joystick.addEventListener('pointerup', handleTouchEnd());
    } else {
        joystick.addEventListener('touchstart', (ev) => { handleTouchStart(ev) });
        joystick.addEventListener('touchmove', (ev) => { handleTouchMove(ev) });
        joystick.addEventListener('touchend', handleTouchEnd());
    }
}

export function handlePointerDown(ev) {
    touchscreen.joystickOriginX = ev.x;
    touchscreen.joystickOriginY = ev.y;
    touchscreen.currentPointerId = ev.pointerId;
}

export function handleTouchStart(ev) {
    let touch	= event.changedTouches[0];
    touchscreen.currentTouchId	= touch.identifier;
    touchscreen.joystickOriginX = touch.pageX;
    touchscreen.joystickOriginY = touch.pageY;
    ev.preventDefault();
}

export function handlePointerMove(ev) {
    if(touchscreen.currentPointerId === null)
        return;
    let deltaX = ev.x - touchscreen.joystickOriginX;
    let deltaY = ev.y - touchscreen.joystickOriginY;
    computeDirection(deltaX, deltaY);
}

export function handleTouchMove(ev) {
    if( touchscreen.currentTouchId === null)
        return;
    let touchList	= ev.changedTouches;
    for(let i = 0; i < touchList.length; i++) {
        if(touchList[i].identifier == touchscreen.currentTouchId) {
            var touch	= touchList[i];
            let deltaX = touch.pageX - touchscreen.joystickOriginX;
            let deltaY = touch.pageY - touchscreen.joystickOriginY;
            computeDirection(deltaX, deltaY);
            ev.preventDefault();
        }
    }
}

export function computeDirection(deltaX, deltaY) {
    let joystick = document.querySelector("#joystick");
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

export function handleTouchEnd() {
    let joystick = document.querySelector("#joystick");
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

    // Decrease the velocity.
    touchscreen.velocity.x -= touchscreen.velocity.x * 10.0 * delta;
    touchscreen.velocity.z -= touchscreen.velocity.z * 10.0 * delta;

    let invertedRotation = rotation.inverse();
    // Extract the yaw rotation only because x and z axis rotations are
    // not needed to translate the user position. The following code
    // renormalize on the Y axis.
    let norm = Math.sqrt(invertedRotation.w * invertedRotation.w + invertedRotation.y * invertedRotation.y);
    let invertedYawRotation = new THREE.Quaternion(0, invertedRotation.y / norm, 0, invertedRotation.w / norm);

    let delta_z = 0;
    let delta_x = 0;
    let movingDistance = 70.0 * delta * delta;
    if ((touchscreen.movingDirection & Direction.Forward) === Direction.Forward)
        delta_z = movingDistance;
    if ((touchscreen.movingDirection & Direction.Backward) === Direction.Backward)
        delta_z = -movingDistance;
    if ((touchscreen.movingDirection & Direction.Left) === Direction.Left)
        delta_x = movingDistance;
    if ((touchscreen.movingDirection & Direction.Right) === Direction.Right)
        delta_x = -movingDistance;

    // Move back to view coordinates.
    let deltaPosition = new THREE.Vector3(delta_x, 0, delta_z);
    // This will make sure that the translation from the keypad is always
    // done in the right direction regardless the rotation.
    deltaPosition.applyQuaternion(invertedYawRotation);

    userPosition.add(deltaPosition);

    touchscreen.prevTime = time;
}