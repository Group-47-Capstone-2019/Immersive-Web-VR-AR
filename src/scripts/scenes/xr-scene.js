import {
  Scene, Vector3, Matrix4, Clock, Group
} from 'three';
import { World } from 'cannon';

import { XR } from '../xrController';
import { canvas } from '../renderer/canvas';
import { updateTouchPosition } from '../controls/touch-controls';
import {
  keyboard,
  controls,
  updatePosition
} from '../controls/keyboard-controls';
import { Loader } from '../loader';

import { loadControllerMeshes } from './controllers';

import { handleInteractions } from '../interactions';

export default class XrScene {
  scene = new Scene();

  world = new World();

  clock = new Clock();

  loader = new Loader();

  triggers = new Group();

  position = new Vector3(0, 0, 0);

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
    this.controls = controls;

    // reset camera
    if (this.controls != null) {
      this.controls.getObject().position.set(0, 0, 0);
      this.controls.getObject().rotation.y = 0;
      this.controls.getObject().children[0].rotation.x = 0;
    } else {
      const matrix = XR.getOffsetMatrix();
      matrix.setPosition(new Vector3(0, 0, 0));
      XR.setOffsetMatrix(matrix);
    }

    this.pause = false;

    this.loader.depend(loadControllerMeshes());
    this.scene.add(this.triggers);

    this._checkForKeyboardMouse();

    this.bounds = [];

    // Make sure that animation callback is called on an xrAnimate event.
    this._addEventListener(window, 'xrAnimate', this._restartAnimation);
  }

  _onMouseDown = () => {
    if (controls && controls.enabled) {
      this.buttonPressed = true;
    }
  }

  _onMouseUp = () => {
    if (controls && controls.enabled) {
      if (this.selected) this.selected.onTriggerRelease();
      this.selected = null;
      this.buttonPressed = false;
    }
  }

  _onKeyUp = (event) => {
    switch (event.keyCode) {
      // F
      case 70:
        this.toggleAnimation();
        break;
      default:
        break;
    }
  }

  /**
   * Removes a controller from the scene and the controllers array
   * @param {Number} index
   */
  _removeController(index) {
    let controller = this.controllers[index];
    if (controller.mesh) this.scene.remove(controller.mesh);

    if (controller.laser) this.scene.remove(controller.laser);

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
  updatePhysics(delta) {
    this.world.step(delta);
  }

  /**
   * Call this to begin animating your frame.
   */
  startAnimation() {
    this._animationCallback();
  }

  /**
   * Called when the F key is pressed, toggles the pause value to pause/play animation.
   */
  toggleAnimation() {
    if (this.pause) {
      this.pause = false;
    } else {
      this.pause = true;
    }
  }

  /**
   * Cancels the current animation frame to prevent
   * artifacts from carrying over to the next render loop
   * and compounding of render loops
   */
  _restartAnimation = () => {
    if (this.frame) window.cancelAnimationFrame(this.frame);

    // An XR session has ended so all the controllers need to be removed if there are any
    this._removeAllControllers();

    // Restart the animation callback loop
    this._animationCallback();
  };

  /**
   * Called every frame.
   * Updates user input affected components such as viewMatrix
   * user positions and controller positions.
   * @param {number} timestamp total elapsed time
   * @param {XRFrame} xrFrame contains all information (poses) about current xr frame
   */
  _animationCallback = (timestamp, xrFrame) => {
    if (this.isActive) {
      // Update the objects in the scene that we will be rendering
      const delta = this.clock.getDelta();
      if (!this.pause) {
        this.animate(delta);
      }
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
      let pose;
      try {
        pose = xrFrame.getViewerPose(XR.refSpace);
      } catch (e) {
        if (e instanceof DOMException) {
          // Sometimes a frame is called after the session has changed but the reference space hasn't been updated which results in a DOMException.
          console.warn('TODO: Fix this error', e);
        } else { throw e; }
      }

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

        handleInteractions(timestamp, xrFrame);

        for (let i = 0; i < pose.views.length; i++) {
          const view = pose.views[i];
          const viewport = XR.session.renderState.baseLayer.getViewport(view);
          const viewMatrix = new Matrix4().fromArray(view.transform.inverse.matrix);

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

          // Bound position
          this._clampInBounds();

          this.camera.matrixAutoUpdate = false;
          this.camera.matrix.fromArray(view.transform.matrix);
          this.camera.matrixWorldNeedsUpdate = true;
          this.camera.projectionMatrix.fromArray(view.projectionMatrix);
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
   * Uses a set of THREE Box3's to clamp the user's position within them.
   * If user is out of bounds, checks for the closest bounding box and clamps
   * their position to it. Updates the OffsetMatrix.
   */
  _clampInBounds() {
    const offsetMatrix = XR.getOffsetMatrix();
    const position = new Vector3().setFromMatrixPosition(offsetMatrix);

    let inBounds = false;

    const boundData = {
      distance: Number.MAX_SAFE_INTEGER,
      bound: null
    };

    for (let i = 0; i < this.bounds.length; i++) {
      const bound = this.bounds[i];
      const distance = bound.distanceToPoint(position);

      // If within a boundary, cease bounds checking
      if (distance === 0) {
        inBounds = true;
        break;
      }

      // Get closest boundary if out of bounds
      if (distance < boundData.distance) {
        boundData.distance = distance;
        boundData.bound = bound;
      }
    }

    // If user is out of bounds, clamp position to closest boundary
    if (!inBounds && boundData.bound) {
      const clampedPos = new Vector3();
      boundData.bound.clampPoint(position, clampedPos);
      offsetMatrix.setPosition(clampedPos);
      XR.setOffsetMatrix(offsetMatrix);
    }
  }

  _checkForKeyboardMouse() {
    if (keyboard) {
      this.scene.add(controls.getObject());
      this._addEventListener(window, 'mousedown', this._onMouseDown);
      this._addEventListener(window, 'mouseup', this._onMouseUp);
      this._addEventListener(window, 'keyup', this._onKeyUp);
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
   * Fires event to change room scene provided a path to it.
   * @param {String} newPath 
   */
  changeRoom(newPath) {
    const event = new CustomEvent('changeRoom', { detail: { newPath } });
    window.dispatchEvent(event);
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
