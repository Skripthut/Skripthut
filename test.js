var path = 'hi[4].hello[1].test.beep';

function getPath(path) {
	var objects = Array.from(path.matchAll(/((?:(?![\.[\]\d]).)+)\.?/gi));

	objects.push(...Array.from(path.matchAll(/\[(\d+)\]/g)));
	return objects.sort((a, b) => a.index - b.index);
}

/**
 * Dynamically sets a nested value in an object.
 * 
 * @param {{}} obj The object which contains the value you want to change/set.
 * @param {string} path The path to the value you want to set.
 * @param value The value you want to set it to.
**/
function Set(obj, path, value) {
	var schema = obj;
	var pList = getPath(path);
	var len = pList.length;
	for(var i = 0; i < len - 1; i++) {
		var elem = pList[i];
		var index = elem[0].includes('[') ? parseInt(elem[1]) : elem[1];
		if(!schema[index]) { schema[index] = {}; }
		schema = schema[index];
	}

	var elem = pList[i];
	schema[elem[0].includes('[') ? parseInt(elem[1]) : elem[1]] = value;
	return obj;
}

/**
 * Dynamically gets a nested value in an object.
 * 
 * @param {{}} obj The object which contains the value you want to get.
 * @param {string} path The path to the value you want to get.
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
 * @param {{}} obj The object which contains the value you want to delete.
 * @param {string} path The path to the value you want to delete.
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

console.log(
Get({
	hello: [
		6,
		true,
		{
			beep: 'boop'
		}
	]
}, 'hello[2].beep'));
var object = { foo: { bar: [ 1, 2, 3, 4, 5 ] } };
Set(object, 'foo.bar[3]', 10);
console.log(JSON.stringify(object) === JSON.stringify({ foo: { bar: [ 1, 2, 3, 10, 5 ] } })); // Logs true