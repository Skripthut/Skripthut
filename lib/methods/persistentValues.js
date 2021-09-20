const database = require(`../../database/database.js`);

/**
 * Sets persistent value of an object
 * 
 * @param object The object which persistent value to set (works as long as an id property is set)
 * @param {string} tag The persistent value to set (works recursively)
 * @param value The value to set to
 * @returns Returns the new persistent value object
**/
module.exports.setPersistent = function(object, tag, value) {
	if (object.id == null) { throw new ReferenceError(`Property 'id' of type '${object.constructor.name}' is null or undefined`); }
	if (!tag instanceof String) { throw new TypeError(`Given 'tag' parameter is not a string`); }
	return _.set(database, `persistentValues.${object.constructor.name}.${object.id}.${tag}`, value);
}

/**
 * Gets persistent value of an object
 * 
 * @param object The object which persistent value to get (works as long as an id property is set)
 * @param {string} tag The persistent value to get (works recursively)
 * @returns Returns the persistent value of the object
**/
module.exports.getPersistent = function(object, tag) {
	if (object.id == null) { throw new ReferenceError(`Property 'id' of type '${object.constructor.name}' is null or undefined`); }
	if (!tag instanceof String) { throw new TypeError(`Given 'tag' parameter is not a string`); }
	return _.get(database?.persistentValues?.[object.constructor.name]?.[object.id], tag);
}

/**
 * Deletes persistent value of an object
 * 
 * @param object The object which persistent value to delete (works as long as an id property is set)
 * @param {string} tag The persistent value to delete (works recursively)
 * @returns Returns true if the persistent value is deleted, else false
**/
module.exports.deletePersistent = function(object, tag) {
	if (object.id == null) { throw new ReferenceError(`Property 'id' of type '${object.constructor.name}' is null or undefined`); }
	if (!tag instanceof String) { throw new TypeError(`Given 'tag' parameter is not a string`); }
	return _.unset(database?.persistentValues?.[object.constructor.name]?.[object.id], tag);
}