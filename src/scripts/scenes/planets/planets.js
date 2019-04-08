// credit to NASA and JPL for initial position and velocity data
// https://ssd.jpl.nasa.gov/horizons.cgi

// credit to JHT's Planetary Pixel Emporium for planet textures
// http://planetpixelemporium.com/planets.html

export default {
  Sun: {
    texture: require('../../../assets/planets/sunmap.jpg'),
    initialPosition: [0, 0, 0],
    initialVelocity: [0, 0, 0],
    realRadius: 695700,
    gravity: 274.0,
    mass: 1988500e24
  },
  Mercury: {
    texture: require('../../../assets/planets/mercurymap.jpg'),
    initialPosition: [
      -1.72731646280253e-1,
      -4.314702462593894e-1,
      -1.941100085284513e-2
    ],
    initialVelocity: [
      2.046206920487239e-2,
      -9.071721313161101e-3,
      -2.618420058794389e-3
    ],
    realRadius: 2440,
    gravity: 3.701,
    mass: 3.302e23
  },
  Venus: {
    texture: require('../../../assets/planets/venusmap.jpg'),
    initialPosition: [
      2.953556507050916e-1,
      -6.648468086507016e-1,
      -2.61667841164913e-2
    ],
    initialVelocity: [
      1.834849440998515e-2,
      8.143520449596597e-3,
      -9.471077190794345e-4
    ],
    realRadius: 6051.84,
    gravity: 8.87,
    mass: 48.685e23
  },
  Earth: {
    texture: require('../../../assets/planets/earthmap.jpg'),
    initialPosition: [
      -9.589302634310595e-1,
      -2.864887338721931e-1,
      1.843209805199964e-5
    ],
    initialVelocity: [
      4.648782084964305e-3,
      -1.655487294629152e-2,
      5.754260214716359e-7
    ],
    realRadius: 6371.01,
    gravity: 9.81,
    mass: 5.97219e24
  },
  Mars: {
    texture: require('../../../assets/planets/marsmap.jpg'),
    initialPosition: [
      -5.978674061916873e-2,
      1.573382198950696,
      3.443482462411238e-2
    ],
    initialVelocity: [
      -1.345485102489857e-2,
      6.575277020029141e-4,
      3.439163775364144e-4
    ],
    realRadius: 3389.92,
    gravity: 3.71,
    mass: 6.4171e23
  },
  Jupiter: {
    texture: require('../../../assets/planets/jupitermap.jpg'),
    initialPosition: [
      -1.461001949752665,
      -5.115753612980954,
      5.393826254064127e-2
    ],
    initialVelocity: [
      7.171029703371329e-3,
      -1.718943096738491e-3,
      -1.533837849894276e-4
    ],
    realRadius: 71492,
    gravity: 24.79,
    mass: 1898.13e24
  },
  Saturn: {
    texture: require('../../../assets/planets/saturnmap.jpg'),
    initialPosition: [
      2.453282654498686,
      -9.751402953212576,
      7.186147207272259e-2
    ],
    initialVelocity: [
      5.110302775197988e-3,
      1.343493708095405e-3,
      -2.269416441226051e-4
    ],
    realRadius: 60268,
    gravity: 10.44,
    mass: 5.6834e26
  },
  Uranus: {
    texture: require('../../../assets/planets/uranusmap.jpg'),
    initialPosition: [
      1.681627936620483e1,
      1.054697550997238e1,
      -1.786000044862404e-1
    ],
    initialVelocity: [
      -2.111534193780941e-3,
      3.146900141146184e-3,
      3.891718255936912e-5
    ],
    realRadius: 25559,
    gravity: 8.87,
    mass: 86.813e24
  },
  Neptune: {
    texture: require('../../../assets/planets/neptunemap.jpg'),
    initialPosition: [
      2.905501237309773e1,
      -7.194824252146801,
      -5.215219083368386e-1
    ],
    initialVelocity: [
      7.408420529338659e-4,
      3.064872819764646e-3,
      -7.995890507901546e-5
    ],
    realRadius: 24766,
    gravity: 11.15,
    mass: 102.413e24
  }
};
