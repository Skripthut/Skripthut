/**
 * Sets metadata tag of an object
 * 
 * @param object The object which metadata to set (works as long as an id property is set)
 * @param {string} tag The metadata tag to set (works recursively)
 * @param value The value to set to
 * @param {number} [lifespan] The optional lifespan of the metadata (deletes after specified lifespan in milliseconds)
 * @returns Returns the new metadata object
**/
module.exports.setMetadata = function(object, tag, value, lifespan) {
	if (object.id == null) { throw new ReferenceError(`Property 'id' of type '${object.constructor.name}' is null or undefined`); }
	if (!tag instanceof String) { throw new TypeError(`Given 'tag' parameter is not a string`); }
	tag = `${object.constructor.name}.${object.id}.${tag}`;
	if (lifespan) {
		var now = Date.now();
		var timeSetTag = `${tag}::timeSet`;
		metadata[timeSetTag] = now;
		setTimeout(function() {
			if (metadata[timeSetTag] === now) { _.unset(metadata, tag); delete metadata[timeSetTag]; }
		}, lifespan);
	}
	return _.set(metadata, tag, value);
}

/**
 * Gets metadata tag of an object
 * 
 * @param object The object which metadata to get (works as long as an id property is set)
 * @param {string} [tag] The metadata tag to get (works recursively; returns all metadata if omitted)
 * @returns Returns the metadata tag of the object
**/
module.exports.getMetadata = function(object, tag) {
	if (object.id == null) { throw new ReferenceError(`Property 'id' of type '${object.constructor.name}' is null or undefined`); }
	if (!tag instanceof String) { throw new TypeError(`Given 'tag' parameter is not a string`); }
	tag = `${object.constructor.name}.${object.id}${tag ? `.${tag}` : ``}`;
	delete metadata[tag];
	return _.get(metadata?.[object.constructor.name]?.[object.id], tag);
}

/**
 * Deletes metadata tag of an object
 * 
 * @param object The object which metadata to delete (works as long as an id property is set)
 * @param {string} tag The metadata tag to delete (works recursively)
 * @returns Returns true if the metadata tag is deleted, else false
**/
module.exports.deleteMetadata = function(object, tag) {
	if (object.id == null) { throw new ReferenceError(`Property 'id' of type '${object.constructor.name}' is null or undefined`); }
	if (!tag instanceof String) { throw new TypeError(`Given 'tag' parameter is not a string`); }
	return _.unset(database?.[object.constructor.name]?.[object.id], tag);
}