import {
  Scene, Matrix4, Clock
} from 'three';
import { World } from 'cannon';

import { XR, applyOriginOffset } from '../xrController';
import { canvas } from '../renderer/canvas';
import { updateTouchPosition } from '../controls/touch-controls';
import {
  keyboard,
  controls,
  updatePosition
} from '../controls/keyboard-controls';
import { Loader } from '../loader';

import controllerGlb from '../../assets/controller/controller.glb';
import Controller from './controllers';

export default class XrScene {
  scene = new Scene();

  world = new World();

  clock = new Clock();

  loader = new Loader();
  state = {};

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

    this.loader.addGltfToQueue(controllerGlb, 'controller');

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
   * override this to handle adding adding assets to the scene
   * @param {object} assetCache cache with all assets, accessible by their `id`
   */
  onAssetsLoaded(assetCache) {
    this.controllerMesh = assetCache.controller.scene;
    return assetCache;
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
      const xrRefSpace = XR.refSpace;

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

          applyOriginOffset(viewMatrix);

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

  /**
   * For every frame this function updates the controller/laser transforms
   * and raycast intersections from the controller laser.
   * Keeps track of what input sources are currently in the scene and
   * handles meshes accordingly when sources are added and removed
   * @param {XRFrame} xrFrame
   * @param {XRReferenceSpace} xrRefSpace
   */
  _updateInputSources(xrFrame, xrRefSpace) {
    const inputSources = XR.session.getInputSources();

    // For the number of input sources in the current session
    for (let i = 0; i < inputSources.length; i++) {
      const inputSource = inputSources[i];

      // Get the XRPose for that input source in the current reference space
      const inputPose = xrFrame.getInputPose(inputSource, xrRefSpace);

      if (inputPose) {
        // Should the input source support visual laser raycasting?
        const isTrackedPointer = inputSource.targetRayMode === 'tracked-pointer';

        // If can handle visual lasers and has a grip matrix indicating that
        // the controller is a visual element in the immersive scene
        if (isTrackedPointer && inputPose.gripTransform.matrix) {
          // Is the number of controllers we know of less than the number of input sources?
          if (this.controllers.length < inputSources.length) {
            // Create a new controller and add to the scene
            const controller = new Controller(this.controllerMesh.clone());
            this.controllers.push(controller);
            this.scene.add(controller.mesh);
          } else if (this.controllers.length > inputSources.length) {
            // Remove controller from array if number of controllers
            // is less than number of input sources
            this._removeController(i);
          }

          // Get the grip transform matrix
          const gripMatrix = new Matrix4().fromArray(inputPose.gripTransform.matrix);

          // Make sure to translate the controller matrix to the user position
          this._translateObjectMatrix(gripMatrix, userPosition);

          // Apply grip transform matrix to the current controller mesh
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

    // Get matrix components and set position
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
   * Override this in child scene class
   * Initializes all event listeners associated with this room
   */
  _initEventListeners() {

  }

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
