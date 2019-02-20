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
