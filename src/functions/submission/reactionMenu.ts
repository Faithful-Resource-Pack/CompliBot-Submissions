import settings from "@resources/settings.json";

import instapass from "@submission/utility/instapass";
import invalidate from "@submission/utility/invalidate";
import { hasPermission } from "@helpers/permissions";
import type { PackFile } from "@interfaces/database";
import { GuildMember, Message, MessageReaction, User } from "discord.js";

const DEBUG = process.env.DEBUG.toLowerCase() === "true";

/**
 * Opens reaction tray, listens for reaction, and closes tray
 * @author Evorp, Juknum
 * @param openReaction reaction that opened the tray
 * @param user person who reacted
 */
export default async function reactionMenu(openReaction: MessageReaction, user: User) {
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
	if (openReaction.emoji.id === settings.emojis.see_less) return closeTray(message, allReactions);

	if (!canOpenTray(message, openReaction, member, submissionAuthorID)) return;

	// remove the arrow emoji and generate the tray
	const trayReactions = filterReactions(message, member, allReactions);
	await openReaction.remove().catch(console.error);
	if (DEBUG) console.log(`Reaction tray opened by: ${user.username}`);

	// need to preserve emoji order so each one is awaited individually
	for (const emoji of trayReactions) await message.react(emoji);

	// await reaction from user
	const actionReaction = await message
		.awaitReactions({
			filter: (collectedReaction, collectedUser) =>
				trayReactions.includes(collectedReaction.emoji.id) && collectedUser.id === user.id,
			max: 1,
			time: 30000,
			errors: ["time"],
		})
		// grab first person to react
		.then((res) => res?.first())
		.catch((err) => {
			// ran out of time, close tray and return early
			closeTray(message, allReactions);
			console.error(err);
		});

	// if there's no reaction collected just reset the message and return early
	if (!actionReaction) return closeTray(message, trayReactions);

	// used to check permissions
	const reactor = Array.from(actionReaction.users.cache.values()).find((user) => !user.bot);

	if (
		actionReaction.emoji.id === settings.emojis.delete &&
		// only admins can delete messages (prevent abuse)
		(reactor.id === submissionAuthorID || hasPermission(member, "administrator")) &&
		message.deletable
	)
		return message.delete();

	// already confirmed it's the same user reacting
	if (hasPermission(member, "submission")) {
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
}

/**
 * Check whether the user can open the tray
 * @author Evorp
 * @param message
 * @param openReaction
 * @param member
 * @param submissionAuthorID
 * @returns whether the user can react
 */
function canOpenTray(
	message: Message,
	openReaction: MessageReaction,
	member: GuildMember,
	submissionAuthorID: string,
): boolean {
	// only accept submissions and the see_more reaction
	if (openReaction.emoji.id !== settings.emojis.see_more || !message.embeds[0]?.fields?.length)
		return false;

	// user doesn't have permission
	if (!hasPermission(member, "submission") && submissionAuthorID !== member.id) {
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
 * @param message
 * @param member who to check permissions of
 * @param allReactions reactions to filter
 * @returns loaded reactions
 */
function filterReactions(message: Message, member: GuildMember, allReactions: string[]): string[] {
	const packs: PackFile = require("@resources/packs.json");

	// remove instapass/invalid if just the author is reacting or if submission is no longer pending
	if (
		!hasPermission(member, "submission") ||
		!message.embeds[0].fields[1].value.includes(settings.emojis.pending)
	)
		allReactions = allReactions.filter(
			(emoji) => ![settings.emojis.instapass, settings.emojis.invalid].includes(emoji),
		);

	return allReactions;
}

/**
 * Reset tray completely
 * @author Evorp, Juknum
 * @param  message
 * @param emojis reactions to remove
 */
async function closeTray(message: Message, emojis: string[]) {
	if (message.deletable) {
		await Promise.all(
			emojis.map((emoji) => message.reactions.cache.get(emoji)?.remove()?.catch(console.error)),
		);
		return message.react(settings.emojis.see_more);
	}
}
