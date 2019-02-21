import { Scene, Matrix4, Vector3 } from 'three';
import { World } from 'cannon';
import { XR } from '../xrController';

export default class XrScene {
  scene = new Scene();

  world = new World();

  isActive = true;

  frame = null;

  /**
   * Initialize the scene. Sets this.scene, this.renderer, and this.camera for you.
   *
   * @param {THREE.Renderer} renderer
   * @param {THREE.Camera} camera
   */
  constructor(renderer, camera) {
    this.renderer = renderer;
    this.camera = camera;

    // Make sure that animation callback is called on an xrAnimate event.
    window.addEventListener('xrAnimate', this._restartAnimation);
  }

  /**
   * Override this to handle animating objects in your scene.
   */
  animate() {
    this.updatePhysics();
  }

  /**
   * Step the physics world.
   */
  updatePhysics() {
    const timeStep = 1 / 60;
    this.world.step(timeStep);
  }

  /**
   * Call this to begin animating your frame.
   */
  startAnimation() {
    this._animationCallback();
  }

  _restartAnimation = () => {
    if (this.frame) window.cancelAnimationFrame(this.frame);
    this._animationCallback();
  }

  _animationCallback = (timestamp, xrFrame) => {
    if (this.isActive) {
      // Update the objects in the scene that we will be rendering.
      this.animate();
      if (!XR.session) {
        this.renderer.context.viewport(0, 0, window.innerWidth, window.innerHeight);
        this.renderer.autoClear = true;
        this.scene.matrixAutoUpdate = true;
        this.renderer.render(this.scene, this.camera);
        this.frame = requestAnimationFrame(this._animationCallback);
        return this.frame;
      }
      if (!xrFrame) {
        this.frame = XR.session.requestAnimationFrame(this._animationCallback);
        return this.frame;
      }

      // Get the correct reference space for the session.
      const xrRefSpace = XR.session.mode === 'immersive-vr'
        ? XR.immersiveRefSpace
        : XR.nonImmersiveRefSpace;

      const pose = xrFrame.getViewerPose(xrRefSpace);

      if (pose) {
        this.scene.matrixAutoUpdate = false;
        this.renderer.autoClear = false;
        this.renderer.clear();

        this.renderer.setSize(
          XR.session.renderState.baseLayer.framebufferWidth,
          XR.session.renderState.baseLayer.framebufferHeight,
          false
        );

        this.renderer.context.bindFramebuffer(
          this.renderer.context.FRAMEBUFFER,
          XR.session.renderState.baseLayer.framebuffer
        );

        for (let i = 0; i < pose.views.length; i++) {
          const view = pose.views[i];
          const viewport = XR.session.renderState.baseLayer.getViewport(view);
          const viewMatrix = new Matrix4().fromArray(view.viewMatrix);

          this._translateViewMatrix(viewMatrix, new Vector3(0, 0, 0));

          this.renderer.context.viewport(
            viewport.x,
            viewport.y,
            viewport.width,
            viewport.height
          );

          this.camera.matrixWorldInverse.copy(viewMatrix);
          this.camera.projectionMatrix.fromArray(view.projectionMatrix);
          this.scene.matrix.copy(viewMatrix);

          this.scene.updateMatrixWorld(true);
          this.renderer.render(this.scene, this.camera);
          this.renderer.clearDepth();
        }
      }
      this.frame = XR.session.requestAnimationFrame(this._animationCallback);
      return this.frame;
    }
    this.frame = null;
    return this.frame;
  };

  _translateViewMatrix(viewMatrix, position) {
    // Save initial position for later
    const tempPosition = new Vector3(
      position.x,
      position.y,
      position.z
    );

    const tempViewMatrix = new Matrix4().copy(viewMatrix);

    tempViewMatrix.setPosition(new Vector3());
    tempPosition.applyMatrix4(tempViewMatrix);

    const translationInView = new Matrix4();
    translationInView.makeTranslation(tempPosition.x, tempPosition.y, tempPosition.z);

    viewMatrix.premultiply(translationInView);
  }
}
