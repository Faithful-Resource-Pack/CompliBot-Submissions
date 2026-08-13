import settings from "@resources/settings.json";
import strings from "@resources/strings.json";

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
	const status = strings.submission.status.invalidated.replace("%USER%", `<@${member.id}>`);

	// not posted to results
	await changeStatus(message, {
		status: `<:invalid:${settings.emojis.invalid}> ${status}`,
		color: settings.colors.red,
		editOriginal: true,
	});
}
