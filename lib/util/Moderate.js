module.exports = class Moderate {
    /**
     * @param {number} millisTimespan The length of the punishment in milliseconds
     * @returns Returns an object containing the total milliseconds of the formatted timespan, and a readable timespan using said milliseconds
    **/
    static async getPunishmentDetails(millisTimespan) {
        if (!millisTimespan) { return null; }
        let now = Date.now();
        let timespan = await getMillisFromString(millisTimespan);
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
            now: now,
            milliseconds: milliseconds,
            readableTimespan: time.join(", "),
            endDate: (milliseconds) ? new Date(now + milliseconds) : null
        };
    }
}