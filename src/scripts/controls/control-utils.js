export const Direction = {
  Stopped: 0,
  Left: 1,
  Right: 2,
  Forward: 4,
  Backward: 8
};

export function updateMovingDistance(obj, movingDistance, movingDirection, sign) {
  if ((movingDirection & Direction.Forward) === Direction.Forward)
    obj.z += movingDistance * sign;
  if ((movingDirection & Direction.Backward) === Direction.Backward)
    obj.z -= movingDistance * sign;
  if ((movingDirection & Direction.Left) === Direction.Left)
    obj.x += movingDistance * sign;
  if ((movingDirection & Direction.Right) === Direction.Right)
    obj.x -= movingDistance * sign;
}