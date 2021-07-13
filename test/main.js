const htmlEntities = require(`html-entities`);
const axios = require(`axios`);

/**
 * Catches the specified Promise and runs a callback, and returns the specified Promise if resolved.
 * 
 * @template T
 * @param {Promise<T>} promise The promise to catch.
 * @param catchCallback The callback to run on catch.
 * @returns {Promise<T>} `promise` if resolved, else `void`.
**/
async function returnCatch(promise, catchCallback = () => {}) {
	var caught;
	await promise.catch(() => { catchCallback(); caught = true; });
	if (caught) { return; }
	return promise;
}

var skriptHubAPIVersion = "v1";
var skriptHubAPIKey = "019e6835c735556d3c42492ed59493e84d197a97";
var skriptHubAPIAuthorization = {
	headers: {
		Authorization: `Token ${skriptHubAPIKey}` 
	}
};
(async function() {

	var response = await returnCatch(axios.get(`http://skripthub.net/api/${skriptHubAPIVersion}/addon/`, skriptHubAPIAuthorization));
	console.log(response.data);

})();