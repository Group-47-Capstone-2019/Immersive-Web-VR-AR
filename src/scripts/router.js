import HomeScene from './scenes/home';
import { getCurrentScene, setCurrentScene } from './currentScene';
import { renderer } from './renderer';
import { camera } from './renderer/camera';
import PlanetsScene from './scenes/planets';
import FallingScene from './scenes/falling';
import {
  showWelcome, hideWelcome, showLoading, hideLoading
} from './welcome';

/**
 * @type {XrScene}
 */
const SavedStates = {};

const Routes = {
  get '/home'() {
    return new HomeScene(renderer, camera);
  },
  get '/planets'() {
    return new PlanetsScene(renderer, camera);
  },
  get '/falling'() {
    return new FallingScene(renderer, camera);
  }
};

/**
 * update currently displayed scene based on the pathname
 * @param {string} pathname
 */
  console.log('navigating from:', oldPath, 'to:', pathname);
  let currentScene = getCurrentScene();
async function navigateToScene(pathname, oldPath) {
  if (currentScene) {
    currentScene.isActive = false;
    // Save the state from the previous scene
    SavedStates[oldPath] = currentScene.state;
    currentScene.removeEventListeners();
  }

  if (pathname === '/') {
    showWelcome();
  } else {
    hideWelcome();

    setCurrentScene((pathname in Routes) ? Routes[pathname] : Routes['/home']);
    currentScene = getCurrentScene();
    if (pathname in SavedStates) {
      // Reapply any state that was saved previously.
      currentScene.state = Object.assign(currentScene.state, SavedStates[pathname]);
    }

    // only show loading screen if there's things in the queue
    if (currentScene.loader._queue.length) {
      showLoading();
      const cache = await currentScene.loader.waitForCache();
      currentScene.onAssetsLoaded(cache);
      hideLoading();
    }

    currentScene.startAnimation();
  }
}

/**
 * add to browser history and display new scene
 * @param {string} newPath
 */
export function navigate(newPath) {
  const oldPath = window.location.pathname;
  window.history.pushState({}, newPath, window.location.origin + newPath);

  // this is an async function but we don't care when it finishes
  navigateToScene(newPath, oldPath);
}

window.onpopstate = () => {
  // this is an async function but we don't care when it finishes
  navigateToScene(window.location.pathname);
};

// update scene when page loaded
navigateToScene(window.location.pathname);
