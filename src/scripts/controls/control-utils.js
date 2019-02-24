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
    return document.webkitFullscreenElement;
  }
  if (hasMozFullScreen()) {
    return document.mozFullScreenElement;
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

export function onFullScreen() {
  const fsButton = document.getElementById('fs-toggle');
  const vrButton = document.getElementById('vr-toggle');
  hideStartMessage();
  fsButton.style.visibility = 'hidden';
  vrButton.style.visibility = 'hidden';
}

export function onFullScreenExit() {
  const fsButton = document.getElementById('fs-toggle');
  const vrButton = document.getElementById('vr-toggle');
  showStartMessage();
  fsButton.style.visibility = 'visible';
  vrButton.style.visibility = 'visible';
}

export function createFullScreenButton() {
  const fsButton = document.createElement('button');
  fsButton.classList.add('fullscreen-toggle');
  fsButton.id = 'fs-toggle';
  fsButton.textContent = '+';
  fsButton.addEventListener('click', () => {
    if (fullScreenAvailable() && !isFullScreenActive()) {
      window.addEventListener('resize', () => {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        if (((windowWidth/screenWidth) >= 0.95) && ((windowHeight/screenHeight) >= 0.95)) {
          onFullScreen();
        }
        else {
          onFullScreenExit();
        }
      });
      requestFullScreen();
    }
  });
  document.body.appendChild(fsButton);
}
