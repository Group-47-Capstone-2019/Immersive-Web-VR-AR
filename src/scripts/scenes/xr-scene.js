import THREE from '../three';
import { timingSafeEqual } from 'crypto';

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

export default class XrScene {
  scene = new THREE.Scene();
  clock = new THREE.Clock();
  isActive = true;

  /**
   * Initialize the scene. Sets this.scene, this.renderer, and this.camera for you.
   *
   * @param {THREE.Renderer} renderer
   * @param {THREE.Camera} camera
   */
  constructor(renderer, camera) {
    this.renderer = renderer;
    this.camera = camera;
    this.controls;
    this.startMessage = document.querySelector('#start');
    this.arrow = document.querySelector('#arrow');

    this._enableKeyboardControls();
  }

  /**
   * Override this to handle animating objects in your scene.
   * @param {number} delta time since last scene update
   */
  animate(delta) {}

  /**
   * Call this to begin animating your frame.
   */
  startAnimation() {
    this._animationCallback();
  }

  _hasPointerLock() {
    let havePointerLock =
      'pointerLockElement' in document ||
      'mozPointerLockElement' in document ||
      'webkitPointerLockElement' in document;
    return havePointerLock;
  }

  _enableKeyboardControls() {
    if (!this._hasPointerLock()) return;
    console.log('ENABLING KEYBOARD CONTROLS.');
    this.controls = new THREE.PointerLockControls(this.camera);
    this.scene.add(this.controls.getObject());
    this.controls.getObject().position.y = 1;

    document.addEventListener(
      'pointerlockchange',
      () => {
        this._pointerLockChanged();
      },
      false
    );
    document.addEventListener(
      'mozpointerlockchange',
      () => {
        this._pointerLockChanged();
      },
      false
    );
    document.addEventListener(
      'webkitpointerlockchange',
      () => {
        this._pointerLockChanged();
      },
      false
    );
    document.addEventListener(
      'pointerlockerror',
      () => {
        console.log('Error.');
      },
      false
    );
    document.addEventListener(
      'mozpointerlockerror',
      () => {
        console.log('Error.');
      },
      false
    );
    document.addEventListener(
      'webkitpointerlockerror',
      () => {
        console.log('Error.');
      },
      false
    );
    document.addEventListener(
      'keydown',
      event => {
        this._onKeyDown(event);
      },
      false
    );
    document.addEventListener(
      'keyup',
      event => {
        this._onKeyUp(event);
      },
      false
    );

    document.body.addEventListener(
      'click',
      () => {
        document.body.requestPointerLock =
          document.body.requestPointerLock ||
          document.body.mozRequestPointerLock ||
          document.body.webkitRequestPointerLock;
        document.body.requestPointerLock();
        console.log('Here');
      },
      false
    );
  }

  _pointerLockChanged() {
    if (
      document.pointerLockElement === document.body ||
      document.mozPointerLockElement === document.body ||
      document.webkitPointerLockElement === document.body
    ) {
      this.controls.enabled = true;
      this._hideStartMessage();
    } else {
      this._showStartMessage();
      this.controls.enabled = false;
    }
  }

  _onKeyDown(event) {
    switch (event.keyCode) {
      case Key.Up:
      case Key.W:
        console.log('W or Up pressed.');
        break;
      case Key.Left:
      case Key.A:
        console.log('A or Left pressed.');
        break;
      case Key.Down:
      case Key.S:
        console.log('S or Down pressed.');
        break;
      case Key.Right:
      case Key.D:
        console.log('D or Right pressed.');
        break;
    }
  }

  _onKeyUp(event) {
    switch (event.keyCode) {
      case Key.Up:
      case Key.W:
        console.log('W or Up released.');
        break;
      case Key.Left:
      case Key.A:
        console.log('A or Left released.');
        break;
      case Key.Down:
      case Key.S:
        console.log('S or Down released.');
        break;
      case Key.Right:
      case Key.D:
        console.log('D or Right released.');
        break;
    }
  }

  _hideStartMessage() {
    console.log('attempting to hide start message');
    this.startMessage.style.display = 'none';
    this.arrow.style.display = 'none';
  }

  _showStartMessage() {
    console.log('attempting to show start message');
    this.startMessage.style.display = 'flex';
    this.arrow.style.display = 'flex';
  }

  _animationCallback = () => {
    if (this.isActive) {
      const delta = this.clock.getDelta();
      this.animate(delta);

      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(this._animationCallback);
    }
  };
}
