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
function teleportOnSelect() {
  return {
    select({ point }) {
      console.log('Teleporting to:', point);
      const offsetMatrix = XR.getOffsetMatrix();
      point.y = 0;
      point.multiplyScalar(-1);
      offsetMatrix.setPosition(point);
      XR.setOffsetMatrix(offsetMatrix);
    }
  };
}

function calculateMotion(pendulum_swing, length, gravity) {
  // Assumption: pendulum_swing's matrix is always a rotation matrix
  if (gravity) {
    const orientation = new Quaternion().setFromRotationMatrix(pendulum_swing.matrix);
    const amplitude = Math.atan(-orientation.x / ondeviceorientation);
    const val = Math.sqrt(gravity / length);
    let timer = Math.asin(1) / val;
    return (timeDifference) => {
      timer += timeDifference;
      const i = amplitude * Math.sin(val * timer);
      const x = -length * Math.sin(i);
      const y = length * Math.cos(i);

      const quat = new Quaternion(x, y, 0, 0);
      const position = new Vector3();
      const scale = new Vector3();
      pendulum_swing.matrix.decompose(position, new Quaternion(), scale);
      pendulum_swing.matrix.compose(position, quat, scale);
      pendulum_swing.updateMatrixWorld(true);
    };
  } else {
    // TODO: Reset the pendulum's orientation to a zeroed Quaternion
    return () => undefined;
  }
}

const pendulumMotion = Symbol('Symbol storing the data for the pendulums');
export default class PendulumScene extends XrScene {
  constructor(renderer, camera) {
    super(renderer, camera);
    this.running = this.run();
    this.animateFunctions = new Map();

    this.paused = true;
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

    // Snapping points for the pendulum swing
    const gravities = [
      9.8, // Earth
      1.62, // Moon's Local G
      3.711, // Mars' local G
      5, // Mystery planet's local G
      9.8 // Earth - second pendulum snap point in the main room.
    ]; // Should only be 5 snapping points
    const snappingPoints = [];
    for (let i = 1, snappingPoint = importedScene.getObjectByName(`Snap_Point_${i}`);
      snappingPoint;
      snappingPoint = importedScene.getObjectByName(`Snap_Point_${++i}`)
    ) {
      snappingPoint.gravity = gravities[i - 1];
      snappingPoints.push(snappingPoint);
    }
    function getSnappingObj(objPos) {
      const THRESHHOLD = .7;
      for (const snappingPoint of snappingPoints) {
        const snappingPointPos = new Vector3().setFromMatrixPosition(snappingPoint.matrixWorld);
        const distance = snappingPointPos.distanceTo(objPos);
        if (distance < THRESHHOLD) {
          return snappingPoint;
        }
      }
    }
    function getGravity(obj) {
      const snap = getSnappingObj(new Vector3().setFromMatrixPosition(obj.matrixWorld));
      if (snap) {
        return snap.gravity;
      } else {
        return 0;
      }
    }
    function dragWithSnapping(object, snappingPoints) {
      return {
        // For an object to be dragable at least one of drag, drag_start, or
        // drag_end must exist in the interactions
        // drag_start() {},
        // Drag isn't completely necessary - Only if you want to customize in what
        // ways the object can be manipulated,
        drag_start: (intersection, pointerMatrix) => {
          // this.paused = true;
          // TODO: Stop associated pendulum swing's motion
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
          // Check if we should snap to any of our snapping points.
          const snap = getSnappingObj(new Vector3().setFromMatrixPosition(matrix));
          if (snap) {
            object.matrix.copy(snap.matrix);
          } else {
            // Didn't find anything to snap to
            object.matrix.copy(matrix);
          }
          object.updateMatrixWorld(true);
        },
        drag_end: () => {
          // TODO: ReCalculate pendulum swing motion
          // this.calculatePendulumState();
          // this.paused = false;
        }
      };
    }

    // Add the interactions for the pendulums
    for (const pendulum of ['Pendulum', 'Pendulum_Tall'].map(name => importedScene.getObjectByName(name))) {
      pendulum[Interactions] = Object.assign(yellowOnHover(pendulum), dragWithSnapping(pendulum, snappingPoints));
      // Things that can be dragged shouldn't have matrix auto update on because
      // the dragging sets the object's matrix which would then be overwritten by
      // the unaffected position, rotation, and scale properties.
      pendulum.matrixAutoUpdate = false;
      // But we need to update the matrix and matrixWorld with the imported pos / rot / scale
      pendulum.updateMatrix();
      pendulum.updateMatrixWorld();
    }

    // Interactions for the pendulum swings
    const pendulumLengths = [.5, 0.801];
    const pendulumNames = ['Pendulum_Swing', 'Pendulum_Swing_Tall'];
    for (let i = 0; i < pendulumNames.length; ++i) {
      const pendulum_swing = importedScene.getObjectByName(pendulumNames[i]);
      // Calculate the starting animation functions
      pendulum_swing.length = pendulumLengths[i];
      this.animateFunctions.set(pendulum_swing, calculateMotion(pendulum_swing, pendulum_swing.length, 0));

      pendulum_swing[Interactions] = Object.assign(yellowOnHover(pendulum_swing), {
        drag_start(intersection, pointerMatrix) {
          // this.paused = true;
          // TODO: Stop the swing connected to this pendulum
          const transformMatrix = new Matrix4().makeTranslation(intersection.point.x, intersection.point.y, intersection.point.z);
          transformMatrix.multiply(new Matrix4().getInverse(pointerMatrix, true));
          // const movement = new Vector3().copy(intersection.point);
          // movement.sub(new Vector3().setFromMatrixPosition(pointerMatrix));
          // const transformMatrix = new Matrix4().makeTranslation(movement.x, movement.y, movement.z);
          return {
            object: intersection.object,
            transformMatrix,
            matrixAutoUpdate: intersection.object.matrixAutoUpdate
          };
        },
        drag(matrix) {
          const target = new Vector3().setFromMatrixPosition(matrix);
          // Transform the world coordinates of the point into local coordinates so that we know what to use fot he up direction in lookAt.
          pendulum_swing.updateMatrixWorld();
          target.applyMatrix4(new Matrix4().getInverse(pendulum_swing.matrixWorld, true));
          const origin = new Vector3().setFromMatrixPosition(pendulum_swing.matrix); // Should be <0, 0, 0> I think, but probably doesn't hurt.
          const transform = new Matrix4().lookAt(origin, target, new Vector3(0, 0, 1));

          const quat = new Quaternion().setFromRotationMatrix(transform);
          quat.z = 0;
          quat.w = 0;
          quat.x *= -1; // Might need to adjust this.
          quat.normalize();
          transform.makeRotationFromQuaternion(quat);

          transform.copyPosition(pendulum_swing.matrix);
          pendulum_swing.matrix.copy(transform);
          pendulum_swing.updateMatrixWorld(true);
        },
        drag_end: () => {
          const gravity = getGravity(pendulum_swing);
          this.animateFunctions.set(pendulum_swing, calculateMotion(pendulum_swing, pendulum_swing.length, gravity));
          // this.paused = false;
        }
      });
      // See above about drag / import
      pendulum_swing.matrixAutoUpdate = false;
      pendulum_swing.updateMatrix();
      pendulum_swing.updateMatrixWorld();
    }

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

    // Interactions for the floor + surfaces (Teleport);
    const floor = importedScene.getObjectByName('Floor');
    floor[Interactions] = Object.assign(yellowOnHover(floor), teleportOnSelect());
    const surfaces = ['Lunar', 'Martian', 'Mystery'].map(room => importedScene.getObjectByName(room + '_Surface'));
    for (const surface of surfaces) {
      surface[Interactions] = teleportOnSelect();
    }

    this.scene.add(importedScene);
    console.log(importedScene);

    this.paused = false;
  }

  animate(delta) {
    if (!this.paused) {
      for (const func of this.animateFunctions.values()) {
        func(delta);
      }
    }
  }
}
