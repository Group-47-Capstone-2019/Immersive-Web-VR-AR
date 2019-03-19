import {
  PointLight, Vector3, Matrix4, Quaternion
} from 'three';
import GLTFLoader from 'three-gltf-loader';
import XrScene from './xr-scene';
import { navigate } from '../router';
import { Interactions } from '../interactions';
import { XR } from '../xrController';
import pendulumSceneGlb from '../../assets/pendulum_scene.glb';

export default class PendulumScene extends XrScene {
  constructor(renderer, camera) {
    super(renderer, camera);
    this.running = this.run();
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
    }

    // Snapping points for the pendulum
    const snappingPoints = [1,2,3,4,5]
      .map(num => `Snap_Point_${ num }`)
      .map(name => importedScene.getObjectByName(name));
    // Add the interactions for the pendulum
    const pendulum = importedScene.getObjectByName('Pendulum');
    pendulum[Interactions] = {
      // For an object to be dragable at least one of drag, drag_start, or
      // drag_end must exist in the interactions
      // drag_start() {},
      // Drag isn't completely necessary - Only if you want to customize in what
      // ways the object can be manipulated
      drag(matrix) {
        const position = new Vector3().setFromMatrixPosition(matrix);
        // Check if we should snap to any of our snapping points.
        for (const obj of snappingPoints) {
          const pointPos = new Vector3().setFromMatrixPosition(obj.matrix);
          if (position.distanceTo(pointPos) < .5) {
            pendulum.matrix.copy(obj.matrix);
            pendulum.updateMatrixWorld(true);
            return;
          }
        }
        // Didn't find anything to snap to
        pendulum.matrix.copy(matrix);
        pendulum.updateMatrixWorld(true);
      },
      // drag_end() {}
    }

    // Interactions for the pendulum swing
    const pendulum_swing = importedScene.getObjectByName('Pendulum_Swing');
    pendulum_swing[Interactions] = {
      drag(matrix) {
        const target = new Vector3().setFromMatrixPosition(matrix);
        const origin = new Vector3().setFromMatrixPosition(pendulum_swing.matrixWorld);
        const transform = new Matrix4().lookAt(origin, target, new Vector3(0, 0, 1));

        const quat = new Quaternion().setFromRotationMatrix(transform);
        quat.z = 0;
        quat.x = -1 * quat.x
        quat.normalize();
        transform.makeRotationFromQuaternion(quat);

        transform.copyPosition(pendulum_swing.matrix);
        pendulum_swing.matrix.copy(transform);
        pendulum_swing.updateMatrixWorld(true);
      }
    };

    // Interactions for the exit door
    const exitObj = importedScene.getObjectByName('Exit');
    exitObj[Interactions] = {
      /**
       * NOTE: the format for the parameters to these functions are:
       * hover(closeness, { distance, point, face, faceIndex, uv });
       */
      // TODO: Add select_start and select_end
      select() {
        navigate('/home'); // Navigate to the home room
      }
    };

    // Interactions for the floor (Teleport);
    const floor = importedScene.getObjectByName('Floor');
    const scene = this.scene;
    floor[Interactions] = {
      select(depth, { point }) {
        console.log('Teleporting to:', point);
        const inverset = new Matrix4().copy(scene.matrixWorld);
        point.applyMatrix4(inverset);
        const transform = new Matrix4().makeTranslation(point.x, point.y, point.z);
        XR.offsetMat = transform;
      }
    }

    this.scene.add(importedScene);
    console.log(importedScene);

    while (this.isActive) {
      // Main loop
      break;
    }
  }

  animate() {}
}
