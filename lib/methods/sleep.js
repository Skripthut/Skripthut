/**
 * Sleeps for a certain amount of time (specified in milliseconds)
 * 
 * @param {number} ms The amount of milliseconds to wait before continuing
 * @returns {Promise<void>} Returns a promise which resolves after `ms` milliseconds.
**/
module.exports = (ms) => new Promise(resolve => setTimeout(resolve, ms));