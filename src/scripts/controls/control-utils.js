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
  console.log("attempting to hide start message");
  startMessage.style.display = 'none';
  arrow.style.display = 'none';
}

export function showStartMessage() {
  console.log("attempting to show start message");
  startMessage.style.display = 'flex';
  arrow.style.display = 'flex';
}
