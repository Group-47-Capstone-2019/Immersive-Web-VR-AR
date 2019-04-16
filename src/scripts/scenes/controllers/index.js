import {
  Line,
  LineBasicMaterial,
  Vector3,
  Geometry,
  Color,
  Mesh, BoxGeometry, MeshBasicMaterial
} from 'three';
import controllerGlb from '../../../assets/controller/controller.glb';
import { Loader } from '../../loader';
import { getCurrentScene } from '../../currentScene';
import { XR } from '../../xrController';

const controllerMeshLoader = new Loader();
let meshCache;
export async function loadControllerMeshes() {
  controllerMeshLoader.addGltfToQueue(controllerGlb, 'controller');
  meshCache = await controllerMeshLoader.waitForCache();
}

/**
 * The purpose of this class is to hold onto references
 * to XR controller and laser meshes for updating
 * frame by frame
 */
export default class Controller {
  controller;

  laser;

  constructor(inputSource) {
    // Used for the controller's laser and cursor material color
    this.color = new Color((Math.random()*0.5) + 0.5, (Math.random()*0.5) + 0.5, (Math.random()*0.5) + 0.5);
    this.inputSource = inputSource;
    switch (this.inputSource.targetRayMode) {
      case 'gaze':
        this.createCursor();
        // this.createLaser();
        // this.createController();
        break;
      case 'tracked-pointer':
        this.createCursor();
        this.createLaser();
        this.createController();
        break;
      case 'screen':
      default:
    }
    this.bind(getCurrentScene().scene);
  }

  bind(scene) {
    ['cursor', 'laser', 'controller'].forEach((item) => {
      if (this[item]) {
        scene.add(this[item]);
      }
    });
  }

  unbind() {
    ['cursor', 'laser', 'controller'].forEach((item) => {
      if (this[item] && this[item].parent) {
        this[item].parent.remove(this[item]);
      }
    });
  }

  createCursor() {
    this.cursor = new Mesh(new BoxGeometry(0.2, 0.2, 0.2), new MeshBasicMaterial({
      color: this.color
    }));
    this.cursor.matrixAutoUpdate = false;
    this.cursor.raycast = () => null; // Disable raycast intersection
  }

  /**
   * Creates a basic laser mesh with no length at (0,0,0)
   */
  createLaser() {
    const geometry = new Geometry();
    geometry.vertices.push(
      new Vector3(0, 0, 0),
      new Vector3(0, 0, 0)
    );

    const material = new LineBasicMaterial({ color: this.color });

    this.laser = new Line(geometry, material);
    this.laser.raycast = () => []; // Disable raycast intersections
  }

  allDescendants(obj) {
    for (let i = 0; i < obj.children.length; i++) {
      const child = obj.children[i];
      this.allDescendants(child);
      if (child.isObject3D === true) {
        child.raycast = () => [];
      }
    }
  }

  createController() {
    this.controller = meshCache.controller.scene.clone();
    this.controller.matrixAutoUpdate = false;
    this.controller.name = 'controller';
    this.allDescendants(this.controller);
    this.controller.raycast = () => []; // Disable raycast intersections
    console.log(this.controller);
  }

  /**
   * Returns controller mesh
   */
  get mesh() {
    return this.controller;
  }

  update(xrFrame, intersection) {
    if (this.controller && this.inputSource.gripSpace) {
      this.controller.matrixAutoUpdate = false;
      // Get grip space pose for controller
      const gripPose = xrFrame.getPose(this.inputSource.gripSpace, XR.refSpace);

      if (gripPose) {
        // Get the grip transform matrix
        this.controller.matrix.fromArray(gripPose.transform.matrix);
        this.controller.updateMatrixWorld(true);
      } else {
        // TODO: hide the controller while WebXR doesn't know where it is.
      }
    }


    if (this.inputSource.targetRaySpace) {
      const rayPose = xrFrame.getPose(this.inputSource.targetRaySpace, XR.refSpace);
      /* global XRRay */
      const ray = new XRRay(rayPose.transform);
      if (rayPose) {
        // If there was an intersection, get the intersection length else default laser to 100
        const rayLength = intersection ? intersection.distance : 100;
        const origin = new Vector3(
          ray.origin.x, ray.origin.y, ray.origin.z
        );
        const destination = new Vector3(
          ray.direction.x,
          ray.direction.y,
          ray.direction.z
        ).multiplyScalar(rayLength).add(origin);

        // If we have a laser then render it in
        if (this.laser) {
          this.updateLaser(origin, destination);
        }

        // If we have a cursor (which we will for most input source types) then move it to the end of the laser
        if (this.cursor) {
          this.cursor.matrix.setPosition(destination);
          this.cursor.updateMatrixWorld(true);
        }
      } else {
        // TODO: Hide the laser and cursor while WebXR doesn't know where they are.
      }
    }
  }

  /**
   * Updates the laser mesh vertices
   * @param {Vector3} origin
   * @param {Vector3} direction
   * @param {Number} length
   */
  updateLaser(origin, destination) {
    // Set origin vertex
    this.laser.geometry.vertices[0] = origin;

    // Set end vertex by multiplying the direciton vector by the length
    // Add the origin so the end vertex is translated into the correct position
    this.laser.geometry.vertices[1] = new Vector3().copy(destination);
    this.laser.geometry.computeBoundingSphere();
    this.laser.geometry.verticesNeedUpdate = true;
  }
}
