const settings = require("@resources/settings.json");

const instapass = require("@submission/utility/instapass");
const invalidate = require("@submission/utility/invalidate");
const { hasPermission } = require("@helpers/permissions");
const DEBUG = process.env.DEBUG.toLowerCase() == "true";
/**
 * Opens reaction tray, listens for reaction, and closes tray
 * @author Evorp, Juknum
 * @param {import("discord.js").MessageReaction} openReaction reaction that opened the tray
 * @param {import("discord.js").User} user person who reacted
 */
module.exports = async function reactionMenu(openReaction, user) {
	const allReactions = [
		settings.emojis.see_less,
		settings.emojis.delete,
		settings.emojis.instapass,
		settings.emojis.invalid,
	];

	const message = await openReaction.message.fetch();

	// not a submission
	if (!message.author.bot) return;

	const member = message.guild.members.cache.get(user.id);

	// first author in the author field is always the person who submitted
	const submissionAuthorID = message.embeds[0].fields[0].value.split("\n")[0].replace(/\D+/g, "");

	// if you don't check to close tray first, the bot won't listen for reactions upon restart
	if (openReaction.emoji.id == settings.emojis.see_less) return closeTray(message, allReactions);

	if (!canOpenTray(message, openReaction, member, submissionAuthorID)) return;

	// remove the arrow emoji and generate the tray
	const trayReactions = loadReactions(message, member, allReactions);
	await openReaction.remove().catch(console.error);
	if (DEBUG) console.log(`Reaction tray opened by: ${user.username}`);
	for (const emoji of trayReactions) await message.react(emoji);

	/**
	 * @param {import("discord.js").MessageReaction} collectedReaction
	 * @param {import("discord.js").User} collectedUser
	 */
	const filter = (collectedReaction, collectedUser) =>
		trayReactions.includes(collectedReaction.emoji.id) && collectedUser.id === user.id;

	/** @type {import("discord.js").MessageReaction} await reaction from user */
	const actionReaction = (
		await message.awaitReactions({ filter, max: 1, time: 30000, errors: ["time"] }).catch((err) => {
			closeTray(message, allReactions);
			console.error(err);
		})
	)?.first(); // first person to react

	// if there's no reaction collected just reset the message and return early
	if (!actionReaction) return closeTray(message, trayReactions);

	/** @type {import("discord.js").User} used to check permissions */
	const reactor = [...actionReaction.users.cache.values()].filter((user) => !user.bot)[0];

	if (
		actionReaction.emoji.id == settings.emojis.delete &&
		(reactor.id === submissionAuthorID || hasPermission(member, "administrator")) &&
		message.deletable
	)
		return message.delete();

	// already confirmed it's the same user reacting
	if (hasPermission(member, "any")) {
		switch (actionReaction.emoji.id) {
			// flush votes and reaction menu
			case settings.emojis.instapass:
				message.reactions.removeAll();
				instapass(message, member);
				break;
			case settings.emojis.invalid:
				message.reactions.removeAll();
				invalidate(message, member);
				break;
		}
	}

	// reset after reaction chosen if possible
	return closeTray(message, trayReactions);
};

/**
 * Check whether the user can open the tray
 * @author Evorp
 * @param {import("discord.js").Message} message
 * @param {import("discord.js").MessageReaction} openReaction
 *  * @param {import("discord.js").GuildMember} member
 * @param {string} submissionAuthorID
 * @returns {boolean} whether the user can react
 */
function canOpenTray(message, openReaction, member, submissionAuthorID) {
	// only accept submissions and the see_more reaction
	if (openReaction.emoji.id !== settings.emojis.see_more || !message.embeds[0]?.fields?.length)
		return false;

	const status = message.embeds[0].fields[1].value;

	// user doesn't have permission or the submission already finished
	if (
		(!hasPermission(member, "any") && submissionAuthorID !== member.id) ||
		(!status.includes(settings.emojis.pending) && !status.includes(settings.emojis.invalid))
	) {
		openReaction.users.remove(member.id).catch((err) => {
			if (DEBUG) console.error(err);
		});

		return false;
	}

	return true;
}

/**
 * Load reaction tray with the correct emojis
 * @author Evorp
 * @param {import("discord.js").Message} message
 * @param {import("discord.js").GuildMember} member check permissions of
 * @param {string[]} allReactions
 * @returns {string[]}
 */
function loadReactions(message, member, allReactions) {
	const packs = require("@resources/packs.json");

	// if the submission is in council remove delete reaction (avoid misclick)
	if (Object.values(packs).some((pack) => pack.submission.channels.council == message.channel.id))
		allReactions = allReactions.filter((emoji) => emoji !== settings.emojis.delete);

	// remove instapass/invalid if just the author is reacting or if submission is no longer pending
	if (
		!hasPermission(member, "any") ||
		!message.embeds[0].fields[1].value.includes(settings.emojis.pending)
	)
		allReactions = allReactions.filter(
			(emoji) => emoji !== settings.emojis.instapass && emoji !== settings.emojis.invalid,
		);

	return allReactions;
}

/**
 * Reset tray completely
 * @author Evorp
 * @param {import("discord.js").Message} message
 * @param {string[]} trayReactions reactions to remove (isn't global)
 */
function closeTray(message, trayReactions) {
	if (message.deletable) {
		removeReactions(message, trayReactions);
		return message.react(settings.emojis.see_more);
	}
}

/**
 * Convenience method to remove multiple reactions at once
 * @author Juknum
 * @param {import("discord.js").Message} message where to remove reactions from
 * @param {string[]} emojis what to remove
 */
function removeReactions(message, emojis) {
	for (const emoji of emojis) message.reactions.cache.get(emoji)?.remove()?.catch(console.error);
}
