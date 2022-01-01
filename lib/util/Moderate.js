let millis = {};
millis.seconds = [ 's', 1000 ]; // 1000 ms
millis.minutes = [ 'm', millis.seconds[1] * 60 ]; // 60000 ms
millis.hours = [ 'h', millis.minutes[1] * 60 ]; // 3600000 ms
millis.days = [ 'd', millis.hours[1] * 24 ]; // 86400000 ms
millis.years = [ 'y', millis.days[1] * 365 ]; // 31536000000 ms

let timespanRegex = {};
for (const key of Object.keys(millis)) {
	timespanRegex[key] = RegExp(`[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)\\s*${millis[key][0]}`, 'gi');
}

module.exports = class Moderate {
    /**
     * Get millis from a formatted string: (let [x] be any number: [x]s, [x]m, [x]h, [x]d, [x]y)
     * 
     * @param {string} string The formatted string to parse
     * @returns Returns millis from formatted string
     * @example
     * let oneYearTwoDaysThreeSeconds = getMillisFromString('2d1y3s');
    **/
    static async getMillisFromString(string) {
        if (!string || !string instanceof String) { return null; }

        /** The timespan of the formatted string */
        let millisTimespan = 0;

        /** @type {string} A key of `timespanRegex` */
        let key;
        /** @type {number} The corresponding value of `key` in `timespanRegex` */
        let value;

        /**
         * 
         * @param {IterableIterator<RegExpMatchArray>} timespan The formatted string to parse (let [x] be any number: [x]s, [x]m, [x]h, [x]d, [x]y)
         */
        const addMillis = (timespan) => {
            millisTimespan += parseFloat(timespan[1]) * millis[key][1]; // get raw value of match and multiply by millis; add result to `millisTimespan`
        }
        
        for ([ key, value ] of Object.entries(timespanRegex)) {
            [ ...string.matchAll(value) ].forEach(addMillis); // call addMillis on each portion of the formatted string
        }
        return millisTimespan;
    }

    /**
     * @param {string} millisTimespan The formatted string of the punishment in milliseconds
     * @returns Returns an object containing the total milliseconds of the formatted timespan, and a readable timespan using said milliseconds
    **/
    static async getPunishmentDetails(millisTimespan) {
        if (!millisTimespan) { return null; }
        let now = Date.now();
        let timespan = await this.getMillisFromString(millisTimespan); // get the millis timespan using the formatted string
        if (timespan === Infinity || timespan === NaN) { return null; }

        let milliseconds = timespan;

        /** @type {string[]} */
        let time = [];
        for (const key of Object.keys(millis).reverse()) {
            let milliValue = Math.floor(timespan / millis[key][1]);
            if (milliValue) { time.push(`${milliValue} ${milliValue === 1 ? key.substring(0, key.length - 1) : key}`); }
            timespan -= milliValue * millis[key][1];
        }

        return {
            /** The unix starting date of the punishment */
            date: now,
            /** The length of the punishment in milliseconds */
            milliseconds: milliseconds,
            /** The readable timespan of the punishment */
            readableTimespan: time.join(", "),
            /** The Date the punishment will end */
            endDate: (milliseconds) ? new Date(now + milliseconds) : null
        };
    }
}