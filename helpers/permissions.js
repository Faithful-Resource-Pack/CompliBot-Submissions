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

/**
 * Warn user ephemerally if they're missing permissions to use an interaction
 * @author Evorp
 * @param {import("discord.js").Interaction} interaction interaction to reply to
 * @todo merge with warnUser probably (general ephemeral interactions)
 */
function noPermission(interaction) {
	interaction.reply({
		embeds: [
			new EmbedBuilder()
				.setTitle(strings.bot.error)
				.setDescription(strings.command.no_permission)
				.setColor(settings.colors.red)
				.setThumbnail(settings.images.warning),
		],
		ephemeral: true,
	});
}

module.exports = {
	hasPermission,
	noPermission,
};
