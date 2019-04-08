// credit to NASA and JPL for initial position and velocity data
// https://ssd.jpl.nasa.gov/horizons.cgi

// credit to JHT's Planetary Pixel Emporium for planet textures
// http://planetpixelemporium.com/planets.html

export default {
  Sun: {
    texture: require('../../../assets/planets/sunmap.jpg'),
    realRadius: 695700,
    gravity: 274.0,
    mass: 1988500e24,
    orbitDistance: 0,
    orbitYears: 1
  },
  Mercury: {
    texture: require('../../../assets/planets/mercurymap.jpg'),
    realRadius: 2440,
    gravity: 3.701,
    mass: 3.302e23,
    orbitDistance: 36e6,
    orbitYears: .25
  },
  Venus: {
    texture: require('../../../assets/planets/venusmap.jpg'),
    realRadius: 6051.84,
    gravity: 8.87,
    mass: 48.685e23,
    orbitDistance: 67e6,
    orbitYears: 7/12
  },
  Earth: {
    texture: require('../../../assets/planets/earthmap.jpg'),
    realRadius: 6371.01,
    gravity: 9.81,
    mass: 5.97219e24,
    orbitDistance: 93e6,
    orbitYears: 1
  },
  Mars: {
    texture: require('../../../assets/planets/marsmap.jpg'),
    realRadius: 3389.92,
    gravity: 3.71,
    mass: 6.4171e23,
    orbitDistance: 141e6,
    orbitYears: 23/12
  },
  Jupiter: {
    texture: require('../../../assets/planets/jupitermap.jpg'),
    realRadius: 71492,
    gravity: 24.79,
    mass: 1898.13e24,
    orbitDistance: 483e6,
    orbitYears: 142/12
  },
  Saturn: {
    texture: require('../../../assets/planets/saturnmap.jpg'),
    realRadius: 60268,
    gravity: 10.44,
    mass: 5.6834e26,
    orbitDistance: 886e6,
    orbitYears: 29.5
  },
  Uranus: {
    texture: require('../../../assets/planets/uranusmap.jpg'),
    realRadius: 25559,
    gravity: 8.87,
    mass: 86.813e24,
    orbitDistance: 1783e6,
    orbitYears: 84
  },
  Neptune: {
    texture: require('../../../assets/planets/neptunemap.jpg'),
    realRadius: 24766,
    gravity: 11.15,
    mass: 102.413e24,
    orbitDistance: 2795e6,
    orbitYears: 165
  }
};
