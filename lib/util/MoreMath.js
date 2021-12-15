module.exports = class MoreMath {
    /**
     * Returns the logarithm of a number with a specified base, defaulting to E.
     * 
     * @param {number} argument The argument of the logarithm
     * @param base The base of the logarithm
    **/
    static log = (argument, base = Math.E) => (base === Math.E) ? Math.log(argument) : Math.log(argument) / Math.log(base);

    /**
     * Get the binary representation of a specified decimal.
     * 
     * @param {number} decimal The decimal of which to get the binary representation of
     * @returns The binary representation of `decimal`
    **/
    static decimalToBinary = (decimal) => (decimal >>> 0).toString(2);
}