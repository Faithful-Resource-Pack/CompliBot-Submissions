const settings = require("@resources/settings.json");

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

/**
 * Warn user ephemerally if they're missing permissions to use an interaction
 * @author Evorp
 * @param {import("discord.js").Interaction} interaction interaction to reply to
 */
function noPermission(interaction) {
	return interaction.reply({
		embed: [
			new EmbedBuilder()
				.setTitle("You don't have permission to run this command!")
				.setDescription("Try running another command by opening the slash command menu.")
				.setColor(settings.colors.blue),
		],
		ephemeral: true,
	});
}

module.exports = {
	hasPermission,
	noPermission,
};
