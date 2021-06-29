/**
 * @param {string} path The string path of the desired value of the object
 * @returns {[string, string, {index: number}, {input: string}, {groups: undefined}][]} The Array versions of RegExp String Iterators
**/
function getPath(path) {
	var objects = Array.from(path.matchAll(/((?:(?![\.[\]\d]).)+)\.?/gi));

	objects.push(...Array.from(path.matchAll(/\[(\d+)\]/g)));
	return objects.sort((a, b) => a.index - b.index);
}

/**
 * Dynamically sets a nested value in an object.
 * 
 * @param obj The object which contains the value you want to change/set.
 * @param {string} path The path to the value you want to set.
 * @param value The value you want to set it to.
 * 
 * @example
 * var object = { foo: { bar: [ 1, 2, 3, 4, 5 ] } };
 * Set(object, 'foo.bar[3]', 10);
 * 	console.log(
 * JSON.stringify(object) === JSON.stringify({ foo: { bar: [ 1, 2, 3, 10, 5 ] } })
 * ); // Logs true
**/
function Set(obj, path, value) {
	var schema = obj;
	var pList = getPath(path);
	var len = pList.length;

	console.log('hello');
	console.log('pList', pList);

	var elem = pList[0];
	var index = elem[0].includes('[') ? parseInt(elem[1]) : elem[1];
	console.log('index', index);
	if (!schema[index]) { schema[index] = (typeof index === 'string') ? {} : []; }

	for(var i = 0; i < len - 1; i++) {
		var elem = pList[i + 1];
		var index = elem[0].includes('[') ? parseInt(elem[1]) : elem[1];
		console.log('index', index);
		if (!schema[index]) { schema[index] = (typeof index === 'string') ? {} : []; }
		elem = pList[i];
		index = elem[0].includes('[') ? parseInt(elem[1]) : elem[1];
		console.log('schema', schema, index);
		schema = schema[index];
		console.log('schema[index]', schema, index);
	}

	var elem = pList[i];
	schema[elem[0].includes('[') ? parseInt(elem[1]) : elem[1]] = value;
}

/**
 * Dynamically gets a nested value in an object.
 * 
 * @param obj The object which contains the value you want to get.
 * @param {string} path The path to the value you want to get.
 * 
 * @example
 * console.log(Get({ foo: { bar: [ 1, 2, 3, 4, 5 ] } }, 'foo.bar[3]') === 4); // Logs true
**/
function Get(obj, path) {
	var schema = obj;
	var pList = getPath(path);
	var len = pList.length;
	for(var i = 0; i < len - 1; i++) {
		var elem = pList[i];
		var index = elem[0].includes('[') ? parseInt(elem[1]) : elem[1];
		if(!schema[index]) { return undefined; }
		schema = schema[index];
	}

	var elem = pList[i];
	return schema[elem[0].includes('[') ? parseInt(elem[1]) : elem[1]];
}

/**
 * Dynamically deletes a nested value in an object.
 * 
 * @param obj The object which contains the value you want to delete.
 * @param {string} path The path to the value you want to delete.
 * 
 * @example
 * var object = { foo: { bar: [ 1, 2, 3, 4, 5 ] } };
 * Delete(object, 'foo.bar[3]');
 * console.log(
 * 	JSON.stringify(object) === JSON.stringify({ foo: { bar: [ 1, 2, 10, 5 ] } })
 * ); // Logs true
**/
function Delete(obj, path) {
	var schema = obj;
	var pList = getPath(path);
	var len = pList.length;
	for(var i = 0; i < len - 1; i++) {
		var elem = pList[i];
		var index = elem[0].includes('[') ? parseInt(elem[1]) : elem[1];
		if(!schema[index]) { return; }
		schema = schema[index];
	}

	var elem = pList[i];
	delete schema[elem[0].includes('[') ? parseInt(elem[1]) : elem[1]];
}

var foo = {};

Set(foo, "bar[5].test", true);

console.log(foo);