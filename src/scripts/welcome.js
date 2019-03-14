export function showWelcome() {
  document.getElementById('main').style.display = 'block';
  document.getElementById('welcome-container').style.display = 'block';
  document.getElementById('loading').style.display = 'none';
}

export function hideWelcome() {
  document.getElementById('main').style.display = 'none';
}

export function showLoading() {
  document.getElementById('main').style.display = 'block';
  document.getElementById('welcome-container').style.display = 'none';
  document.getElementById('loading').style.display = 'block';
}

export function hideLoading() {
  document.getElementById('main').style.display = 'none';
}