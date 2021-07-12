/*
on script load:
	set {_hex::*} to "a", "b", "c", "d", "e", "f"

function componentToHex(component: number) :: number:
	set {_component} to max(min({_component}, 255), 0)
	set {_divide} to {_component} / 16
	set {_1} to floor({_divide})
	set {_2} to ({_divide} - {_first}) * 16
	return "%{hex::%({_1} - 9)%} ? {_1}%%{hex::%({_2} - 9)%} ? {_2}%"

function rgbToHex(r: number, g: number, b: number) :: string:
	return "#%componentToHex({_r})%%componentToHex({_g})%%componentToHex({_b}%%"
*/
var Hex = {
	1: 'A',
	2: 'B',
	3: 'C',
	4: 'D',
	5: 'E',
	6: 'F'
}

function componentToHex(c = 0) {
	c = Math.max(Math.min(c, 255), 0);
	var divide = c / 16;
	var first = Math.floor(divide);
	var second = (divide - first) * 16;
	console.log(divide, first, second, c);
	return `${Hex[`${first - 9}`] || first}${Hex[`${second - 9}`] || second}`;
}

function rgbToHex(r, g, b) {
	return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

console.log(1.5 % 1);
console.log(rgbToHex(-69, -420, -1000));