// credit to NASA and JPL for initial position and velocity data
// https://ssd.jpl.nasa.gov/horizons.cgi

// credit to JHT's Planetary Pixel Emporium for planet textures
// http://planetpixelemporium.com/planets.html

export default {
  Sun: {
    name: "Sun",
    texture: require('../../../assets/planets/sunmap.jpg'),
    realRadius: 695700,
    gravity: 274.0,
    mass: 1988500e24,
    orbitDistance: 0,
    orbitYears: 1,
    fakeRadius: 15
  },
  Mercury: {
    name: "Mercury",
    texture: require('../../../assets/planets/mercurymap.jpg'),
    realRadius: 2440,
    gravity: 3.701,
    mass: 3.302e23,
    orbitDistance: 36e6,
    orbitYears: .25,
    fakeRadius: 2
  },
  Venus: {
    name: "Venus",
    texture: require('../../../assets/planets/venusmap.jpg'),
    realRadius: 6051.84,
    gravity: 8.87,
    mass: 48.685e23,
    orbitDistance: 67e6,
    orbitYears: 7/12,
    fakeRadius: 3
  },
  Earth: {
    name: "Earth",
    texture: require('../../../assets/planets/earthmap.jpg'),
    realRadius: 6371.01,
    gravity: 9.81,
    mass: 5.97219e24,
    orbitDistance: 93e6,
    orbitYears: 1,
    fakeRadius: 3
  },
  Mars: {
    name: "Mars",
    texture: require('../../../assets/planets/marsmap.jpg'),
    realRadius: 3389.92,
    gravity: 3.71,
    mass: 6.4171e23,
    orbitDistance: 141e6,
    orbitYears: 23/12,
    fakeRadius: 2
  },
  Jupiter: {
    name: "Jupiter",
    texture: require('../../../assets/planets/jupitermap.jpg'),
    realRadius: 71492,
    gravity: 24.79,
    mass: 1898.13e24,
    orbitDistance: 483e6,
    orbitYears: 142/12,
    fakeRadius: 12
  },
  Saturn: {
    name: "Saturn",
    texture: require('../../../assets/planets/saturnmap.jpg'),
    realRadius: 60268,
    gravity: 10.44,
    mass: 5.6834e26,
    orbitDistance: 886e6,
    orbitYears: 29.5,
    fakeRadius: 10
  },
  Uranus: {
    name: "Uranus",
    texture: require('../../../assets/planets/uranusmap.jpg'),
    realRadius: 25559,
    gravity: 8.87,
    mass: 86.813e24,
    orbitDistance: 1783e6,
    orbitYears: 84,
    fakeRadius: 8
  },
  Neptune: {
    name: "Neptune",
    texture: require('../../../assets/planets/neptunemap.jpg'),
    realRadius: 24766,
    gravity: 11.15,
    mass: 102.413e24,
    orbitDistance: 2795e6,
    orbitYears: 165,
    fakeRadius: 8
  }
};
