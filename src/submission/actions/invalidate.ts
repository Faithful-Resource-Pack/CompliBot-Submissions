import settings from "@resources/settings.json";

import changeStatus from "@submission/discord/changeStatus";
import { Message, User, GuildMember } from "discord.js";

const DEBUG = process.env.DEBUG.toLowerCase() === "true";

/**
 * Invalidate a given texture embed
 * @author Evorp
 * @param message embed to invalidate
 * @param member who invalidated it
 */
export default async function invalidate(message: Message, member: User | GuildMember) {
	if (DEBUG) console.log(`Texture invalidated: ${message.embeds[0].title}`);
	const status = `<:invalid:${settings.emojis.invalid}> Invalidated by <@${member.id}>`;

	// not posted to results
	await changeStatus(message, { status, color: settings.colors.red, editOriginal: true });
}
