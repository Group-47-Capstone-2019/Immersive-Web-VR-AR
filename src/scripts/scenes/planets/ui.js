import { createTextPlane } from './text';

export function createPlanetText(info) {
  const earthGravities = Number(info.gravity / 9.8).toPrecision(2)
  const text = `
---${info.name}---

Radius: ${Number(info.realRadius).toString()} km
Mass: ${Number(info.mass).toPrecision(4)} kg
Distance from sun: ${Number(info.orbitDistance * 1.60934).toPrecision(3)} km
Year length: ${Number(info.orbitYears).toPrecision(3)} Earth years
Gravity: ${info.gravity} m/s^2 (${earthGravities}x Earth gravity)`;

  return createTextPlane(text, 'white', 'steelblue');
}
