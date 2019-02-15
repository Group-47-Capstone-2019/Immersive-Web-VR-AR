touchscreen = {
    joystickOriginX,
    joystickOriginY,
    currentTouchId,
    currentPointerId
}

const Direction = {
    Stopped: 0,
    Left: 1,
    Right: 2,
    Forward: 4,
    Backward: 8
}

function hideTouchControls() {
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

function showTouchControls() {
    let touchControls = document.querySelector('#joystick-controls');
    let joystick = document.querySelector('#joystick');
    touchControls.style.display = 'inline';
    if (window.PointerEvent) {
        joystick.addEventListener('pointerdown', handlePointerDown());
        joystick.addEventListener('pointermove', handlePointerMove());
        joystick.addEventListener('pointerup', handleTouchEnd());
    } else {
        joystick.addEventListener('touchstart', handleTouchStart());
        joystick.addEventListener('touchmove', handleTouchMove());
        joystick.addEventListener('touchend', handleTouchEnd());
    }
}

function handlePointerDown(ev) {
    touchscreen.joystickOriginX = ev.x;
    touchscreen.joystickOriginY = ev.y;
    touchscreen.currentPointerId = ev.pointerId;
}

function handleTouchStart(ev) {
    let touch	= event.changedTouches[0];
    touchscreen.currentTouchId	= touch.identifier;
    touchscreen.joystickOriginX = touch.pageX;
    touchscreen.joystickOriginY = touch.pageY;
    ev.preventDefault();
}

function handlePointerMove(ev) {
    if(touchscreen.currentPointerId === null)
        return;
    let deltaX = ev.x - touchscreen.joystickOriginX;
    let deltaY = ev.y - touchscreen.joystickOriginY;
    computeDirection(deltaX, deltaY);
}

function handleTouchMove(ev) {
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

function computeDirection(deltaX, deltaY) {
    let joystick = document.querySelector("#joystick");
    if ((deltaX <= 70 && deltaX >= -70) && (deltaY <= 70 && deltaY >= -70))
        joystick.style.transform = 'translate(' + deltaX + 'px,' + deltaY + 'px)';
    let rotation = Math.atan2(deltaY, deltaX);
    let angle45Degree = Math.PI / 4;
    if (rotation > angle45Degree && rotation < angle45Degree * 3)
        movingDirection = Direction.Backward;
    else if (rotation < -angle45Degree && rotation > -angle45Degree * 3)
        movingDirection = Direction.Forward;
    else if (rotation >= 0 && rotation <= angle45Degree)
        movingDirection = Direction.Right;
    else if (rotation <= -angle45Degree * 3 || rotation >= angle45Degree * 3)
        movingDirection = Direction.Left;
}

function handleTouchEnd() {
    touchscreen.joystickOriginX = 0;
    touchscreen.joystickOriginY = 0;
    touchscreen.currentTouchId	= null;
    touchscreen.currentPointerId = null;
    movingDirection = Direction.Stopped;
    joystick.style.transform = 'translate(0px, 0px)';
}