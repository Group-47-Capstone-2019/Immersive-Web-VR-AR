import {
  Scene, Quaternion, Matrix4, Vector3, Clock, Group
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
import { Loader } from '../loader';

import controllerGlb from '../../assets/controller/controller.glb';
import Controller from './controllers';

// import { TriggerMesh } from '../trigger';
import { updateRay, getIntersection } from '../raycaster';

export default class XrScene {
  scene = new Scene();

  world = new World();

  clock = new Clock();

  loader = new Loader();

  triggers = new Group();

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
    this.scene.add(this.triggers);

    // Make sure that animation callback is called on an xrAnimate event.
    this._addEventListener(window, 'xrAnimate', this._restartAnimation);
    this._addEventListener(window, 'xrSelectStart', this._xrSelectStart);
    this._addEventListener(window, 'xrSelectEnd', this._xrSelectEnd);

    this._checkForKeyboardMouse();
  }

  /**
   * Sets button pressed to true on selectstart event
   */
  _xrSelectStart = () => {
    this.buttonPressed = true;
  }

  /**
   * Sets button pressed to false and triggers a release of a selected object
   * on selectend event
   */
  _xrSelectEnd = () => {
    if (this.selected) this.selected.onTriggerRelease();
    this.selected = null;
    this.buttonPressed = false;
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

      if (inputSource) {
        // Should the input source support visual laser raycasting?
        const isTrackedPointer = inputSource.targetRayMode === 'tracked-pointer';

        // If can handle visual lasers and has a grip matrix indicating that
        // the controller is a visual element in the immersive scene
        if (isTrackedPointer && inputSource.gripSpace) {
          // Get grip space pose for controller
          const gripPose = xrFrame.getPose(inputSource.gripSpace, xrRefSpace);

          // Is the number of controllers we know of less than the number of input sources?
          if (this.controllers.length > inputSources.length) {
            // Remove controller from array if number of controllers
            // is less than number of input sources
            this._removeController(i);
          } else {
            if (this.controllers.length < inputSources.length) {
              // Create a new controller and add to the scene
              const controller = new Controller(this.controllerMesh.clone());
              this.controllers.push(controller);
              this.scene.add(controller.mesh);
            }

            // Get the grip transform matrix
            const gripMatrix = new Matrix4().fromArray(gripPose.transform.matrix);

            // Make sure to translate the controller matrix to the user position
            this._translateObjectMatrix(gripMatrix, userPosition);

            // Apply grip transform matrix to the current controller mesh
            const matrixPosition = new Vector3();
            gripMatrix.decompose(matrixPosition, new Quaternion(), new Vector3());
            this.controllers[i].updateControllerPosition(gripMatrix);
          }
        }

        // Raycasting
        if (inputSource.targetRaySpace) {
          const rayPose = xrFrame.getPose(inputSource.targetRaySpace, xrRefSpace);

          // Create a new ray from the rayPose transform
          /* global XRRay:true */
          const ray = new XRRay(rayPose.transform);

          // Get raycaster intersection
          const intersection = this._raycastIntersection(rayPose.transform.matrix);
          if (isTrackedPointer) {
            // Get the targetRay vectors for rendering
            const rayOrigin = new Vector3(
              ray.origin.x + userPosition.x,
              ray.origin.y + userPosition.y,
              ray.origin.z + userPosition.z
            );
            const rayDirection = new Vector3(
              ray.direction.x,
              ray.direction.y,
              ray.direction.z
            );

            // If there was an intersection, get the intersection length else default laser to 100
            const rayLength = intersection ? intersection.distance : 100;
            this._renderLaser(rayOrigin, rayDirection, rayLength, this.controllers[i]);
          }
        }
      }
    }
  }

  /**
   * Calculates raycast intersections on a frame by frame basis
   * from the XR target rays. Triggers the respective events for
   * each intersection based on the current state of the input ray
   * and trigger object.
   * @param {Matrix4} targetRayMatrix Transformation matrix from the
   * XR input pose
   * @returns {Intersection} Intersection info, this can be null
   */
  _raycastIntersection(targetRayMatrix) {
    const trMatrix = new Matrix4().fromArray(targetRayMatrix);
    this._translateObjectMatrix(trMatrix, userPosition);

    // Transformed ray matrix from the current scene matrix world
    const rMatrix = new Matrix4().multiplyMatrices(this.scene.matrixWorld, trMatrix);
    // Ray origin vector derived from the ray matrix
    const rOrigin = new Vector3().setFromMatrixPosition(rMatrix);

    // Orientation for ray on -Z Axis transformed and normalized by the ray matrix
    const rDest = new Vector3(0, 0, -1).transformDirection(rMatrix)
      .normalize();

    // Update raycaster object orientation
    updateRay(rOrigin, rDest);

    // Handle intersection events
    return this._intersectionHandler();
  }

  /**
   * Gets an intersection from the raycaster and fires
   * the appropriate events in response to certain
   * user gestures and ray orientation
   */
  _intersectionHandler() {
    // Get nearest trigger object intersection from raycaster
    const intersection = getIntersection(this.triggers);

    if (intersection) {
      intersection.object.onTriggerHover(intersection);
      if (!intersection.object.isSelected) {
        if (this.buttonPressed) {
          // Previous frame was not selected but user is pressing button
          intersection.object.onTriggerSelect(intersection);
          // Keep track of selected object reference
          this.selected = intersection.object;
        }
      } else if (!this.buttonPressed) {
        // Trigger object WAS selected but button is now longer pressed
        intersection.object.onTriggerRelease(intersection);
        // Drop selected object reference on release of selection
        this.selected = null;
      }
    }
    return intersection;
  }

  /**
   * Gets raycaster point information and renders a laser from the
   * passed in controller based on the information given
   * @param {Vector3} rayOrigin Origin point of ray
   * @param {Vector3} rayDirection Direction of ray
   * @param {Number} rayLength Calculated length of ray
   * @param {Controller} controller Controller to render laser from
   */
  _renderLaser(rayOrigin, rayDirection, rayLength, controller) {
    // Create laser if it does not exist
    if (!controller.laser) {
      controller.createLaser();
      this.scene.add(controller.laser);
    }

    // Update laser mesh with current user position and target ray transformations
    controller.updateLaser(rayOrigin, rayDirection, rayLength);
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
