/**
 * Returns a shuffled copy of the specified array using the Fisher-Yates Shuffle. Please advise from using this with massive arrays, since this can produce lag.
 * 
 * @template {Array} T
 * @param {T} array The array to shuffle
 * @returns {T} Returns a shuffled copy of `array`
**/
module.exports = function(array) {
	if (!array instanceof Array) { return null; }
	var length = array.length;
	var copy = [ ...array ];
	for (let i = length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[ copy[i], copy[j] ] = [ copy[j], copy[i] ];
	}
	return copy;
}