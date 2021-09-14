/**
 * Catches the specified Promise and runs a callback if rejected, and returns the specified Promise if resolved.
 * 
 * @template {Promise<any>} T
 * @param {T} promise The promise to catch
 * @param {Function} onCatch The callback to run on catch
 * @returns {T} Returns `promise` if resolved, else `null`.
**/
module.exports = async function(promise, onCatch) {
	var caught;
	await promise.catch(() => { onCatch(); caught = true; });
	return (caught) ? null : promise;
}