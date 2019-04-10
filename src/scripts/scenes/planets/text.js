import { CanvasTexture, Sprite, SpriteMaterial } from 'three';

function createTextCanvas(text, textColor, backgroundColor) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  context.font = '160px Georgia';
  const width = context.measureText(text).width + 200;
  const height = 160 + 200;

  canvas.width = width;
  canvas.height = height;

  if (backgroundColor) {
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, width, height);
  }

  context.fillStyle = textColor;
  context.font = '160px Georgia';
  context.textBaseline = "top";
  context.fillText(text, 100, 100);

  return canvas;
}

export function createTextSprite(
  text,
  textColor = 'white',
  backgroundColor = undefined
) {
  const canvas = createTextCanvas(text, textColor, backgroundColor);
  const texture = new CanvasTexture(canvas);

  const mat = new SpriteMaterial({ map: texture, depthTest: false });
  const sprite = new Sprite(mat);
  sprite.scale.set(4, 2, 1);
  return sprite;
}
