import { Scene } from 'three';

export default class XrScene {
  scene = new Scene();

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

  _animationCallback = () => {
    if (this.isActive) {
      this.animate();

      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(this._animationCallback);
    }
  };
}
