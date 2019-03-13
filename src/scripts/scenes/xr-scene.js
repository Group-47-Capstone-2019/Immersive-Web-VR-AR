import {
  Scene, Quaternion, Matrix4, Vector3, Clock, Geometry, LineBasicMaterial, Line
} from 'three';
import { World } from 'cannon';

import { XR } from '../xrController';
import { canvas } from '../renderer/canvas';
import { userPosition, updateTouchPosition } from '../controls/touch-controls';
import {
  keyboard,
  controls,
  updatePosition
} from '../controls/keyboard-controls';

import Controller from './controllers';

export default class XrScene {
  scene = new Scene();

  world = new World();

  clock = new Clock();

  controllers = [];

  isActive = true;

  frame = null;

  state = {};

  eventListeners = [];

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
    this._addEventListener(window, 'xrAnimate', this._restartAnimation);

    this._checkForKeyboardMouse();
  }

      /**
     * Removes a controller from the scene and the controllers array
     * @param {Number} index
     */
    _removeController(index) {
      let controller = this.controllers[index];
      this.scene.remove(controller.mesh);

      // Clean up
      if (controller.mesh.geometry) controller.mesh.geometry.dispose();
      if (controller.mesh.material) controller.mesh.material.dispose();

      // Remove controller from array
      this.controllers.splice(index, 1);

      controller = undefined;
    }

    /**
     * Removes all controllers from the scene and member array
     */
    _removeAllControllers() {
      for (let i = 0; i < this.controllers.length; i++) {
        this._removeController(i);
      }
    }

  /**
   * Override this to handle animating objects in your scene.
   * @param {number} delta time since last scene update
   */
  animate(delta) {
    return delta;
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
    this._removeAllControllers();
    this._animationCallback();
  };

  _animationCallback = (timestamp, xrFrame) => {
    if (this.isActive) {
      // Update the objects in the scene that we will be rendering
      const delta = this.clock.getDelta();
      this.animate(delta);
      // Update the user position if keyboard and mouse controls are enabled.
      if (controls && controls.enabled) {
        updatePosition();
      }

      if (!XR.session) {
        this.renderer.context.viewport(0, 0, canvas.width, canvas.height);
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

      const immersive = (XR.session.mode === 'immersive-vr');

      // Get the correct reference space for the session.
      const xrRefSpace = immersive
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

        this._updateInputSources(xrFrame, xrRefSpace);

        for (let i = 0; i < pose.views.length; i++) {
          const view = pose.views[i];
          const viewport = XR.session.renderState.baseLayer.getViewport(view);
          const viewMatrix = new Matrix4().fromArray(view.viewMatrix);

          this.renderer.context.viewport(
            viewport.x,
            viewport.y,
            viewport.width,
            viewport.height
          );

          // Update user position if touch controls are in use with magic window.
          if (XR.magicWindowCanvas && !immersive) {
            updateTouchPosition(viewMatrix);
          }

          this._translateViewMatrix(viewMatrix, userPosition);

          this.camera.matrixWorldInverse.copy(viewMatrix);
          this.camera.projectionMatrix.fromArray(view.projectionMatrix);
          this.scene.matrix.copy(viewMatrix);

          this.scene.updateMatrixWorld(true);
          this.renderer.render(this.scene, this.camera);
          this.renderer.clearDepth();
        }
        this.frame = XR.session.requestAnimationFrame(this._animationCallback);
        return this.frame;
      }
    }
    this.frame = null;
    return this.frame;
  };

  _updateInputSources(xrFrame, xrRefSpace) {
    const inputSources = XR.session.getInputSources();

    for (let i = 0; i < inputSources.length; i++) {
      const inputSource = inputSources[i];
      const inputPose = xrFrame.getInputPose(inputSource, xrRefSpace);

      if (inputPose) {
        const isTrackedPointer = inputSource.targetRayMode === 'tracked-pointer';

        if (isTrackedPointer && inputPose.gripTransform.matrix) {
          if (this.controllers.length < inputSources.length) {
            const controller = new Controller();
            this.controllers.push(controller);
            this.scene.add(controller.mesh);
          }

          const gripMatrix = new Matrix4().fromArray(inputPose.gripTransform.matrix);
          this._translateObjectMatrix(gripMatrix, userPosition);
          const matrixPosition = new Vector3();
          gripMatrix.decompose(matrixPosition, new Quaternion(), new Vector3());
          this.controllers[i].updateControllerPosition(gripMatrix);
        }

        // Raycasting
        if (inputPose.targetRay) {
          if (isTrackedPointer) {
            // TODO: Render ray from controller here

          }
          // TODO: Ray selection here / Cursor here
        }
      }
    }
  }

  /**
   * The view matrix is the information for the entire world to be rendered in
   * Translations that occur here need to be inverted for them to make sense to the user
   * Moving the world northwest gives it the appearance of moving southeast ect.
   * We're translating the position of the world origin rather than the user.
   * @param {Float32Array} matrix
   * @param {Vector3} position
   */
  _translateViewMatrix(matrix, position) {
    // Invert the position since we are moving the entire world origin
    const tempPosition = new Vector3(-position.x, -position.y, -position.z);
    const tempMatrix = new Matrix4().copy(matrix);

    tempMatrix.setPosition(new Vector3());
    tempPosition.applyMatrix4(tempMatrix);

    const translation = new Matrix4();
    translation.makeTranslation(
      tempPosition.x,
      tempPosition.y,
      tempPosition.z
    );

    matrix.premultiply(translation);
  }

  /**
   * Adds position offset to object matrix passed in.
   * @param {Matrix4} matrix
   * @param {Vector3} position
   */
  _translateObjectMatrix(matrix, position) {
    const currentPosition = new Vector3(
      position.x,
      position.y,
      position.z
    );
    const matrixPosition = new Vector3();
    matrix.decompose(matrixPosition, new Quaternion(), new Vector3());
    currentPosition.add(matrixPosition);
    matrix.setPosition(currentPosition);
  }

  _checkForKeyboardMouse() {
    if (keyboard) {
      this.scene.add(controls.getObject());
    }
  }

  /**
     * Initializes all event listeners associated with this room
     */
  _initEventListeners() {}

  /**
     *
     * @param {HTMLElement} target
     * @param {String} type
     * @param {Function} listener
     */
  _addEventListener(target, type, listener) {
    target.addEventListener(type, listener);
    this.eventListeners.push({
      target,
      type,
      listener
    });
  }

  /**
     * Removes all event listeners associated with this room
     */
  removeEventListeners() {
    for (let i = 0; i < this.eventListeners.length; i++) {
      const eventListener = this.eventListeners[i];
      eventListener.target.removeEventListener(
        eventListener.type,
        eventListener.listener
      );
    }
  }
}
