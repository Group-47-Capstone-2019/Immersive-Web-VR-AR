import {
  CanvasTexture,
  Sprite,
  SpriteMaterial,
  LinearFilter,
  ClampToEdgeWrapping,
  PlaneBufferGeometry,
  MeshBasicMaterial,
  Mesh,
  DoubleSide
} from 'three';

function createTextCanvas(text, textColor, backgroundColor) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  const lines = text.split('\n');

  context.font = '160px Georgia';
  const width = context.measureText(text).width + 200;
  const height = 160 * lines.length + 200;

  canvas.width = width;
  canvas.height = height;

  if (backgroundColor) {
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, width, height);
  }

  context.fillStyle = textColor;
  context.font = '160px Georgia';
  context.textBaseline = 'top';
  lines.forEach((l, i) => context.fillText(l, 100, 100 + i * 160));

  return canvas;
}

export function createTextPlane(
  text,
  textColor = 'white',
  backgroundColor = undefined
) {
  const canvas = createTextCanvas(text, textColor, backgroundColor);
  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;

  const mat = new MeshBasicMaterial({
    map: texture,
    depthTest: false,
    transparent: true,
    side: DoubleSide
  });

  const plane = new PlaneBufferGeometry(
    canvas.width / 160,
    canvas.height / 160
  );
  const mesh = new Mesh(plane, mat);

  return mesh; 
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
  sprite.scale.set(canvas.width, canvas.height, 1).divideScalar(160);
  return sprite;
}
