import {
  PointLight
} from 'three';
import GLTFLoader from 'three-gltf-loader';
import XrScene from './xr-scene';
import { navigate } from '../router';
import { Interactions } from '../interactions';
import pendulumSceneGlb from '../../assets/pendulum_scene.glb';

export default class PendulumScene extends XrScene {
  constructor(renderer, camera) {
    super(renderer, camera);
    this.running = this.run();
  }

  async run() {
    // Try loading our scene

    // DEBUG: Simulate loading the assets we need:
    //    await delay(3000);

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

    // Get interactive Objects:
    const exitObj = importedScene.getObjectByName('Exit');
    if (exitObj) {
      exitObj[Interactions] = {
        /**
         * NOTE: the format for the parameters to these functions are:
         * hover(closeness, { distance, point, face, faceIndex, uv });
         */
        // TODO: Switch to hover_enter and hover_exit
        hover() {
        },
        // TODO: Add select_start and select_end
        select() {
          navigate('/'); // Navigate to the home room
        }
      };
      //      this.interactiveObjects.push(exitObj);
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
