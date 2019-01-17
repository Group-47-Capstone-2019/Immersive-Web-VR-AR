import Home from './home';

export const routes = {
  '/': Home,
  '/sim': new HTMLCanvasElement()
};

/**
 * update the currenty displayed element
 * @param {HTMLElement} element
 */
function updateBody(element) {
  const body = document.getElementById('body');
  if (body.firstChild) {
    body.replaceChild(element, body.firstChild);
  } else {
    body.appendChild(element);
  }
}

//initial state
updateBody(routes[window.location.pathname]);

window.onpopstate