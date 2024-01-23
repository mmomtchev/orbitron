const major = {
  sun: { id: '@sun', color: '#fdee00' },
  mercury: { id: '@199', color: '#b2beb5' },
  venus: { id: '@299', color: '#fdfd96' },
  earth: { id: '@geocenter', color: '#4997d0' },
  moon: { id: '@301', color: '#b2beb5' },
  mars: { id: '@499', color: '#a52a2a' },
  jupiter: { id: '@599', color: '#cc5500' },
  saturn: { id: '@699', color: '#536872' },
  uranus: { id: '@799', color: '#99badd' },
  neptune: { id: '@899', color: '#2a52be' },
  pluto: { id: '@999', color: '#efdecd' }
} as Record<string, {id: string, color: string}>;

export default major;
