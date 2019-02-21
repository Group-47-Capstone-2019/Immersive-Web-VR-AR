export const Direction = {
  Stopped: 0,
  Left: 1,
  Right: 2,
  Forward: 4,
  Backward: 8
};

const startMessage = document.querySelector('#start');
const arrow = document.querySelector('#arrow');

export function hideStartMessage() {
  startMessage.style.display = 'none';
  arrow.style.display = 'none';
}

export function showStartMessage() {
  startMessage.style.display = 'flex';
  arrow.style.display = 'flex';
}

export function hasWebkitFullScreen() {
  return 'webkitCancelFullScreen' in document;
}

export function hasMozFullScreen() {
  return 'mozCancelFullScreen' in document;
}

export function requestFullScreen() {
  if (hasWebkitFullScreen()) {
    document.body.webkitRequestFullScreen();
  } else if (hasMozFullScreen()) {
    document.body.mozRequestFullScreen();
  } else {
    console.assert(false);
  }
}

export function fullScreenAvailable() {
  return hasWebkitFullScreen() || hasMozFullScreen();
}

export function isFullScreenActive() {
  if (hasWebkitFullScreen()) {
    return document.webkitIsFullScreen;
  }
  if (hasMozFullScreen()) {
    return document.mozFullScreen;
  }
  console.assert(false);
  return false;
}

export function cancelFullScreen() {
  if (hasWebkitFullScreen()) {
    document.webkitCancelFullScreen();
  } else if (hasMozFullScreen()) {
    document.mozCancelFullScreen();
  } else {
    console.assert(false);
  }
}

export function tryFullScreen() {
  if (fullScreenAvailable() && !isFullScreenActive()) {
    requestFullScreen();
  }
}

export function onFullScreenChange() {
  const fsButton = document.getElementById('fs-toggle');

  if (!isFullScreenActive()) {
    hideStartMessage();
    fsButton.style.visibility = 'hidden';
  } else {
    showStartMessage();
    fsButton.style.visibility = 'visible';
  }
}

export function createFullScreenButton() {
  const fsButton = document.createElement('button');
  fsButton.classList.add('fullscreen-toggle');
  fsButton.id = 'fs-toggle';
  fsButton.textContent = '+';
  fsButton.addEventListener('click', () => {
    if (fullScreenAvailable() && !isFullScreenActive()) {
      if (hasWebkitFullScreen()) {
        document.addEventListener('webkitfullscreenchange', onFullScreenChange());
      } else if (hasMozFullScreen()) {
        document.addEventListener('mozfullscreenchange', onFullScreenChange());
      }
      requestFullScreen();
    }
  });
  document.body.appendChild(fsButton);
}
