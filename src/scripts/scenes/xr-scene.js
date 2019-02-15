import { Scene, Matrix4, Vector3 } from 'three';
import { XR } from '../xrController';
import { showTouchControls, userPosition, updateTouchPosition } from '../touch-controls';

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

    _animationCallback = (timestamp, xrFrame) => {
      if (this.isActive) {
        // Update the objects in the scene that we will be rendering
        this.animate();
        if (!XR.session) {
          this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
          this.renderer.autoClear = true;
          this.scene.matrixAutoUpdate = true;
          this.renderer.render(this.scene, this.camera);
          return requestAnimationFrame(this._animationCallback);
        }
        if (!xrFrame) return XR.session.requestAnimationFrame(this._animationCallback);

        const pose = xrFrame.getViewerPose(XR.refSpace);

        if (pose) {
          this.scene.matrixAutoUpdate = false;
          this.renderer.autoClear = false;
          this.renderer.clear();

          this.renderer.context.bindFramebuffer(
            this.renderer.context.FRAMEBUFFER,
            XR.session.renderState.baseLayer.framebuffer
          );

          for (let i = 0; i < pose.views.length; i++) {
            const view = pose.views[i];
            const viewport = XR.session.renderState.baseLayer.getViewport(view);
            const viewMatrix = new Matrix4().fromArray(view.viewMatrix);

            if(XR.magicWindowCanvas && XR.magicWindowCanvas.hidden === false) {
              updateTouchPosition(viewMatrix);
              this._translateViewMatrix(viewMatrix, userPosition);
            } else {
              this._translateViewMatrix(viewMatrix, new Vector3(0, 0, 0));
            }

            this.renderer.setViewport(
              viewport.x,
              viewport.y,
              XR.magicWindowCanvas.width,
              XR.magicWindowCanvas.height
            );

            this.camera.matrixWorldInverse.copy(viewMatrix);
            this.camera.projectionMatrix.fromArray(view.projectionMatrix);
            this.scene.matrix.copy(viewMatrix);

            this.scene.updateMatrixWorld(true);
            this.renderer.render(this.scene, this.camera);
            this.renderer.clearDepth();
          }
        }

        showTouchControls();

        return XR.session.requestAnimationFrame(this._animationCallback);
      }

      return null;
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
