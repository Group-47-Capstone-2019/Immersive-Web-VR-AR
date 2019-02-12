import THREE from '../three';
import { controls, updatePosition } from '../enableKeyboardMouse'
import { timingSafeEqual } from 'crypto';

export class XrScene {
  scene = new THREE.Scene();
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
    //this.controls;

    this._enableKeyboardControls();
  }

  /**
   * Override this to handle animating objects in your scene.
   */
  animate() {}

  /**
   * Call this to begin animating your frame.
   */
  startAnimation() {
    this._animationCallback();
  }

    /**
     * Enables keyboard and mouse controls using WASD/arrow keys and PointerLockControls
     */
    _enableKeyboardControls() {
        console.log("ENABLING KEYBOARD CONTROLS.");
        this.scene.add(controls.getObject());
    }

  _animationCallback = () => {
    if (this.isActive) {
      this.animate();
      if(controls && controls.enabled) {
          updatePosition();
      }

      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(this._animationCallback);
    }
  };
}
