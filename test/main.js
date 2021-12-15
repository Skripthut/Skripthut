const { log, decimalToBinary } = require(`../lib/structures/MoreMath.js`); 

console.log(`
${6^3} = ${5}
${6**3} != ${5}
${decimalToBinary(9007199254740991)}
`);

console.log('test keybinds ');

(function() {
    test = 'hey'; // dynamic in file scope
    const foo = 'hi'; // constant in block scope (the function)
    if (true) {
        const bar = 'yo'; // constant in block scope (the if statement), same scope as let (dynamic in block scope)
        var baz = ':D'; // dynamic in function scope
        console.log('bar in block scope:', bar);
        console.log('baz in function scope:', baz);
    }
    try {
        console.log('bar out of block scope:', bar);
    } catch(error) {
        if (error instanceof ReferenceError) { console.log('bar out of block scope:', undefined); } // if variable doesn't exist
    }
    console.log('baz out of block scope, in function scope:', baz);
}
)();
try {
    console.log('baz out of function scope:', baz);
} catch(error) {
    if (error instanceof ReferenceError) { console.log('baz out of function scope:', undefined); } // if variable doesn't exist
}
console.log('test in file scope', test);