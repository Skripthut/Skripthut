var now = Date.now();

var array = [];
array.length = 1000000;
array.fill({ hello: "icol" });

console.log(Date.now() - now);