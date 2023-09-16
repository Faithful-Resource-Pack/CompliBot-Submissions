const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

/**
 * Check permissions of a given member
 * @author Evorp
 * @param {import("discord.js").GuildMember} member member to check
 * @param {"administrator" | "council" | "any"} type what type of role to check for
 * @returns {Boolean} whether the member has the permissions
 */
function hasPermission(member, type = "any") {
	const hasAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
	const hasCouncil = member.roles.cache.some((role) => role.name.toLowerCase().includes("council"));

	switch (type) {
		case "administrator":
			return hasAdmin;
		case "council":
			return hasCouncil;
		default:
			return hasAdmin || hasCouncil;
	}
}

module.exports = {
	hasPermission,
};
