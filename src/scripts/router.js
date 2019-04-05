import HomeScene from './scenes/home';
import { renderer } from './renderer';
import { camera } from './renderer/camera';
import PlanetsScene from './scenes/planets';
import FallingScene from './scenes/falling';
import {
  showWelcome, hideWelcome, showLoading, hideLoading
} from './welcome';
import LaserScene from './scenes/laser';

/**
 * @type {XrScene}
 */
let currentScene;
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
  },
  get '/lasers'() {
    return new LaserScene(renderer, camera);
  }
};

/**
 * update currently displayed scene based on the pathname
 * @param {string} pathname
 */
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
    currentScene = (pathname in Routes) ? Routes[pathname] : Routes['/home'];
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

function onChangeRoom(event) {
  navigate(event.detail.newPath);
}


window.addEventListener('changeRoom', onChangeRoom, true);

window.onpopstate = () => {
  // this is an async function but we don't care when it finishes
  navigateToScene(window.location.pathname);
};

// update scene when page loaded
navigateToScene(window.location.pathname);
