const Discord = require(`discord.js`);
const client = require(`../constants/Client.js`);
const database = require(`../../database/database.js`);

module.exports = class Stats {
    /**
     * Set a stat of a member in a guild.
     *
     * @param {Discord.GuildMember} member The desired member of the stat
     * @param {string} key The key of the desired stat to set
     * @param value The value to set the stat to
    **/
    static setStat(member, key, value) {
        const guild = member.guild;
        _.set(database.discord.guilds, `${guild.id}.members.${member.id}.${key}`, value);
    }

    /**
     * Delete a stat of a member in a guild.
     *
     * @param {Discord.GuildMember} member The desired member of the stat
     * @param {String} key The key of the desired stat to delete
    **/
    static deleteStat(member, key) {
        const guild = member.guild;
        _.unset(database.discord.guilds, `${guild.id}.members.${member.id}.${key}`);
    }

    /**
     * Get a stat of a member in a guild.
     *
     * @param {Discord.GuildMember} member The desired member of the stat.
     * @param {string} key The key of the desired stat.
     * @returns The value of the stat specified.
    **/
    static getStat(member, key) {
        const guild = member.guild;
        return _.get(database.discord.guilds, `${guild.id}.members.${member.id}.${key}`);
    }
}