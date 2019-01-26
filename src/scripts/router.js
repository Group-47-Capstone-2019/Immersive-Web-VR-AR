import { HomeScene } from './scenes/home';
import { renderer } from './renderer';
import { camera } from './renderer/camera';

// update scene when page loaded
navigateToScene(window.location.pathname);

/**
 * update currently displayed scene based on the pathname
 * @param {string} pathname
 */
function navigateToScene(pathname) {
  switch (pathname) {
    case '/':
      const scene = new HomeScene(renderer, camera);
      requestAnimationFrame(scene.animate);
      break;
  }
}

/**
 * add to browser history and display new scene
 * @param {string} newPath
 */
export function navigate(newPath) {
  window.history.pushState({}, newPath, window.location.origin + newPath);
  navigateToScene(newPath);
}
