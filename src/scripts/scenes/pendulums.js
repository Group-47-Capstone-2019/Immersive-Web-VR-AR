import {
  PointLight,
  Vector3, Matrix4, Quaternion,
  MeshBasicMaterial
} from 'three';
import GLTFLoader from 'three-gltf-loader';
import XrScene from './xr-scene';
import { navigate } from '../router';
import { Interactions } from '../interactions';
import pendulumSceneGlb from '../../assets/pendulum_scene.glb';
import { XR } from '../xrController';

const selectedMaterial = new MeshBasicMaterial({
  color: '#f5b700'
});
const savedMaterials = new Map();
function yellowOnHover(object) {
  return {
    hover_start() {
      // console.log(object.material == selectedMaterial);
      savedMaterials.set(object, object.material);
      object.material = selectedMaterial;
    },
    hover_end() {
      //      console.log(savedMaterials.get(object) == selectedMaterial);
      object.material = savedMaterials.get(object);
      savedMaterials.delete(object);
    }
  };
}

export default class PendulumScene extends XrScene {
  constructor(renderer, camera) {
    super(renderer, camera);
    this.running = this.run();

    // TODO: Need to seperate this out when we have multiple pendulums
    this.clearPendulumState();

    this.paused = true;
  }

  calculatePendulumState() {
    const position = new Vector3().setFromMatrixPosition(this.pendulum.matrix);
    // Check if we should snap to any of our snapping points.
    let gravity = false;
    for (const point of this.snappingPoints) {
      const pointPos = new Vector3().setFromMatrixPosition(point.matrix);
      if (position.distanceTo(pointPos) < 0.3) {
        gravity = point.gravity;
        break;
      }
    }
    if (gravity) {
      const quat = new Quaternion();
      this.pendulum_swing.matrix.decompose(new Vector3(), quat, new Vector3());
      const theta = Math.atan(-quat.x / quat.y);

      this.state.amplitude = theta;
      this.state.t = Math.asin(1) / Math.sqrt(gravity / this.state.length);
      this.state.val = Math.sqrt(gravity / this.state.length);
    } else {
      this.clearPendulumState();
    }
  }

  clearPendulumState() {
    this.state.amplitude = 0;
    this.state.length = 1;
    this.state.val = 0;
    this.state.t = 0;
  }

  async run() {
    const importedScene = await new Promise((resolve, reject) => {
      const loader = new GLTFLoader();

      loader.load(pendulumSceneGlb, (gltf) => {
        resolve(gltf.scene);
      }, undefined, (error) => {
        reject(error);
      });
    });

    // Upgrade light placeholders into full fledged lights
    for (let i = 1, placeholder = importedScene.getObjectByName(`Light_${i}`); placeholder; placeholder = importedScene.getObjectByName(`Light_${++i}`)) {
      console.log(placeholder);
      const pointLight = new PointLight(0xffffff, 0.2);
      pointLight.position.copy(placeholder.position);
      placeholder.parent.add(pointLight);
      placeholder.parent.remove(placeholder);
    }

    // Snapping points for the pendulum
    const snappingPoints = [1, 2, 3, 4, 5]
      .map(num => `Snap_Point_${num}`)
      .map(name => importedScene.getObjectByName(name));
    const gravities = [
      9.8, // Earth
      1.62, // Moon's Local G
      3.711, // Mars' local G
      9.8,
      9.8
    ];
    snappingPoints.forEach((obj, i) => {
      obj.gravity = gravities[i];
    });
    this.snappingPoints = snappingPoints;
    // Add the interactions for the pendulum
    const pendulum = importedScene.getObjectByName('Pendulum');
    pendulum[Interactions] = Object.assign(yellowOnHover(pendulum), {
      // For an object to be dragable at least one of drag, drag_start, or
      // drag_end must exist in the interactions
      // drag_start() {},
      // Drag isn't completely necessary - Only if you want to customize in what
      // ways the object can be manipulated,
      drag_start: (intersection, pointerMatrix) => {
        this.paused = true;
        this.clearPendulumState();
        const pointerInverse = new Matrix4().getInverse(pointerMatrix, true);
        const target = new Matrix4().copy(intersection.object.matrixWorld);
        const transformMatrix = new Matrix4().multiplyMatrices(pointerInverse, target);
        return {
          object: intersection.object,
          transformMatrix,
          matrixAutoUpdate: intersection.object.matrixAutoUpdate
        };
      },
      drag(matrix) {
        const position = new Vector3().setFromMatrixPosition(matrix);
        // Check if we should snap to any of our snapping points.
        for (const obj of snappingPoints) {
          const pointPos = new Vector3().setFromMatrixPosition(obj.matrix);
          if (position.distanceTo(pointPos) < 0.5) {
            pendulum.matrix.copy(obj.matrix);
            pendulum.updateMatrixWorld(true);
            return;
          }
        }
        // Didn't find anything to snap to
        pendulum.matrix.copy(matrix);
        pendulum.updateMatrixWorld(true);
      },
      drag_end: () => {
        this.calculatePendulumState();
        this.paused = false;
      }
    });
    this.pendulum = pendulum;
    // Things that can be dragged shouldn't have matrix auto update on because
    // the dragging sets the object's matrix which would then be overwritten by
    // the unaffected position, rotation, and scale properties.
    pendulum.matrixAutoUpdate = false;
    // But we need to update the matrix and matrixWorld with the imported pos / rot / scale
    pendulum.updateMatrix();
    pendulum.updateMatrixWorld();

    // Interactions for the pendulum swing

    const pendulum_swing = importedScene.getObjectByName('Pendulum_Swing');
    pendulum_swing[Interactions] = Object.assign(yellowOnHover(pendulum_swing), {
      drag_start(intersection, pointerMatrix) {
        this.paused = true;
        // this.clearPendulumState();
        const pointerInverse = new Matrix4().getInverse(pointerMatrix, true);
        const target = new Matrix4().copy(intersection.object.matrixWorld);
        const transformMatrix = new Matrix4().multiplyMatrices(pointerInverse, target);
        return {
          object: intersection.object,
          transformMatrix,
          matrixAutoUpdate: intersection.object.matrixAutoUpdate
        };
      },
      drag(matrix) {
        const target = new Vector3().setFromMatrixPosition(matrix);
        const origin = new Vector3().setFromMatrixPosition(pendulum_swing.matrixWorld);
        const transform = new Matrix4().lookAt(origin, target, new Vector3(0, 0, 1));

        const quat = new Quaternion().setFromRotationMatrix(transform);
        quat.z = 0;
        quat.w = 0;
        quat.x *= -1;
        quat.normalize();
        transform.makeRotationFromQuaternion(quat);

        transform.copyPosition(pendulum_swing.matrix);
        pendulum_swing.matrix.copy(transform);
        pendulum_swing.updateMatrixWorld(true);
      },
      drag_end: () => {
        this.calculatePendulumState();
        this.paused = false;
      }
    });
    this.pendulum_swing = pendulum_swing;
    // Things that can be dragged shouldn't have matrix auto update on
    pendulum_swing.matrixAutoUpdate = false;
    pendulum.updateMatrix();
    pendulum.updateMatrixWorld();

    // Interactions for the exit door
    const exitObj = importedScene.getObjectByName('Exit');
    exitObj[Interactions] = Object.assign(yellowOnHover(exitObj), {
      /**
       * NOTE: the format for the parameters to these functions are:
       * hover({ distance, point, face, faceIndex, uv });
       */
      select() {
        navigate('/home'); // Navigate to the home room
      }
    });

    // Interactions for the floor (Teleport);
    const floor = importedScene.getObjectByName('Floor');
    floor[Interactions] = Object.assign(yellowOnHover(floor), {
      select({ point }) {
        console.log('Teleporting to:', point);
        const offsetMatrix = XR.getOffsetMatrix();
        point.y = 0;
        point.multiplyScalar(-1);
        offsetMatrix.setPosition(point);
        XR.setOffsetMatrix(offsetMatrix);
      }
    });

    this.scene.add(importedScene);
    console.log(importedScene);

    this.paused = false;
  }

  animate(delta) {
    if (!this.paused) {
      this.state.t += delta;
      const i = this.state.amplitude * Math.sin(this.state.val * this.state.t);
      const x = -this.state.length * Math.sin(i);
      const y = this.state.length * Math.cos(i);

      const quat = new Quaternion(x, y, 0, 0);
      const position = new Vector3();
      const scale = new Vector3();
      this.pendulum_swing.matrix.decompose(position, new Quaternion(), scale);
      this.pendulum_swing.matrix.compose(position, quat, scale);
      this.pendulum_swing.updateMatrixWorld(true);
    }
  }
}
