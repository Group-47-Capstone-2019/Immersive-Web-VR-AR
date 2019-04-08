import { bindControllers } from './interactions';

export let currentScene;
export function getCurrentScene() {
  return currentScene;
}
export function setCurrentScene(newVal) {
  currentScene = newVal;
  bindControllers(newVal.scene);
}
