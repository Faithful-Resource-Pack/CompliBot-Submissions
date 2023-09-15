const { PermissionsBitField } = require("discord.js");

/**
 * Check permissions of a given member
 * @author Evorp
 * @param {import("discord.js").GuildMember} member member to check
 * @param {"administrator" | "council" | "any"} type what type of role to check for
 * @returns {Boolean} whether the member has the permissions
 */
module.exports = function hasPermission(member, type = "any") {
	const hasAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);
	const hasCouncil = member.roles.cache.some((role) => role.name.toLowerCase().includes("council"));

	switch (type) {
		case "administrator":
			return hasAdmin;
		case "council":
			return hasCouncil;
		default:
			return hasAdmin || hasCouncil;
	}
};