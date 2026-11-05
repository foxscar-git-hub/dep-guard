const topPackages = require('./top-packages.json');
const { levenshtein } = require('./levenshtein');

const MAX_DISTANCE = 2;

// Flags a package name that is suspiciously close (edit distance 1-2) to a
// popular package it is not. Distance 0 (exact match) is never flagged.
function checkTyposquat(name) {
  let closest = null;
  let closestDistance = Infinity;

  for (const popular of topPackages) {
    if (popular === name) return null; // it IS the popular package
    if (Math.abs(popular.length - name.length) > MAX_DISTANCE) continue;
    const distance = levenshtein(name, popular);
    if (distance > 0 && distance <= MAX_DISTANCE && distance < closestDistance) {
      closest = popular;
      closestDistance = distance;
    }
  }

  if (closest) {
    return {
      type: 'typosquat-risk',
      package: name,
      similarTo: closest,
      distance: closestDistance,
    };
  }
  return null;
}

module.exports = { checkTyposquat };
