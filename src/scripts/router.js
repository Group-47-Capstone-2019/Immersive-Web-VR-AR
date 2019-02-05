import { HomeScene } from './scenes/home';
import { renderer } from './renderer';
import { camera } from './renderer/camera';
import { PlanetsScene } from './scenes/planets';

// update scene when page loaded
navigateToScene(window.location.pathname);

//Current room (Scene class) that application is rendering
export var room;

/**
 * update currently displayed scene based on the pathname
 * @param {string} pathname
 */
function navigateToScene(pathname) {
  switch (pathname) {
    case '/':
      room = new HomeScene(renderer, camera);
      break;
    case '/planets':
      room = new PlanetsScene(renderer, camera);
      break;
  }

  requestAnimationFrame(currentScene.animate);
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
