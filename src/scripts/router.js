import HomeScene from './scenes/home';
import { renderer } from './renderer';
import { camera } from './renderer/camera';
import PlanetsScene from './scenes/planets';

/**
 * @type {XrScene}
 */
let currentScene;

/**
 * update currently displayed scene based on the pathname
 * @param {string} pathname
 */
function navigateToScene(pathname) {
  if (currentScene) {
    currentScene.isActive = false;
  }

  switch (pathname) {
    case '/':
      currentScene = new HomeScene(renderer, camera);
      break;
    case '/planets':
      currentScene = new PlanetsScene(renderer, camera);
      break;
    default:
  }

  currentScene.startAnimation();
}

/**
 * add to browser history and display new scene
 * @param {string} newPath
 */
export function navigate(newPath) {
  window.history.pushState({}, newPath, window.location.origin + newPath);
  navigateToScene(newPath);
}

window.onpopstate = () => {
  navigateToScene(window.location.pathname);
};

// update scene when page loaded
navigateToScene(window.location.pathname);
