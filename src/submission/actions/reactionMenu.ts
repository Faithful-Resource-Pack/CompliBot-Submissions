import settings from "@resources/settings.json";

import instapass from "@submission/actions/instapass";
import invalidate from "@submission/actions/invalidate";

import { hasPermission, PermissionType } from "@helpers/permissions";

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

	// we know it's in a guild because that's how the submission system works (lol)
	const message = (await openReaction.message.fetch()) as Message<true>;

	// not a submission
	if (!message.author.bot) return;

	const member = message.guild.members.cache.get(user.id);

	// something has gone wrong, member can't be found
	if (!member) return;

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

	const isPrivileged = hasPermission(member, PermissionType.Submission);
	// used to check permissions
	const reactor = Array.from(actionReaction.users.cache.values()).find((user) => !user.bot);
	const canDelete = isPrivileged || reactor?.id === submissionAuthorID;

	switch (actionReaction.emoji.id) {
		// flush votes and reaction menu
		case settings.emojis.instapass:
			if (!isPrivileged) break;
			message.reactions.removeAll();
			instapass(message, member);
			break;
		case settings.emojis.invalid:
			if (!isPrivileged) break;
			message.reactions.removeAll();
			invalidate(message, member);
			break;
		case settings.emojis.delete:
			if (!canDelete || !message.deletable) break;
			// can't close tray when there's no message
			return message.delete();
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
	if (!hasPermission(member, PermissionType.Submission) && submissionAuthorID !== member.id) {
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
	// remove instapass/invalid if just the author is reacting or if submission is no longer pending
	if (
		!hasPermission(member, PermissionType.Submission) ||
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
