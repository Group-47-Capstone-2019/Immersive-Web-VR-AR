import THREE from '../scripts/three';
import controller from './controller/controller.glb';

const gltfLoader = new THREE.GLTFLoader();

let controllerMesh;
export async function loadController() {
  if(!controllerMesh) {
    await gltfLoader.load(controller, (object) => {
      controllerMesh = object.scene;
    });
  }
}

export function getController() {
  return controllerMesh;
}