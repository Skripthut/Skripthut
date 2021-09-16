/**
 * Format a number of bytes to KiB, MiB, GiB, TiB, etc.
 * 
 * @param {number} bytes The number of bytes to format
 * @param precision The decimal precision of the formatted string (2 = 0.01, 3 = 0.001)
**/
module.exports = function formatBytes(bytes, precision = 2) {
	if (bytes <= 0) { return '0 Bytes'; }

	const k = 1024;
	const dm = Math.max(0, precision);
	const sizes = [ 'Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB' ];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}