import strings from "@resources/strings.json";

import {
	EmbedBuilder,
	Message,
	TextChannel,
	BaseMessageOptions,
	APIEmbed,
	JSONEncodable,
} from "discord.js";

const DEBUG = process.env.DEBUG.toLowerCase() === "true";

export interface StatusParams {
	status: string;
	color?: string;
	components?: BaseMessageOptions["components"];
	editOriginal?: boolean;
}

/**
 * Update an embed's status recursively
 * @author Evorp
 * @param message message to edit
 * @param params other options to edit
 * @returns new submission embed
 */
export default async function changeStatus(
	message: Message,
	{ status, color, components, editOriginal = false }: StatusParams,
): Promise<EmbedBuilder> {
	const embed = editEmbed(message.embeds[0], { status, color });
	components ||= Array.from(message.components);
	await message.edit({ embeds: [embed], components });

	// no need to check for original post, return early
	if (
		!editOriginal ||
		!embed.data.description?.startsWith(`[${strings.submission.field.original_post}](`)
	)
		return embed;

	// get original message id from submission description (pain)
	const [channelID, messageID] = getOriginalMessage(embed.data.description);

	try {
		const channel = message.client.channels.cache.get(channelID) as TextChannel;
		const originalMessage = await channel.messages.fetch(messageID);

		// recursive, but editOriginal disabled this time
		await changeStatus(originalMessage, { status, color, components });
	} catch {
		// message deleted or something
	}
	return embed;
}

/**
 * Create a new embed with the specified status and color
 * @author Evorp
 * @param original Original embed to edit
 * @param params options to edit
 * @returns new EmbedBuilder to use
 */
export function editEmbed(
	original: APIEmbed | JSONEncodable<APIEmbed>,
	{ status, color }: StatusParams,
) {
	const embed = EmbedBuilder.from(original);
	if (DEBUG)
		console.log(
			`Changing status "${
				embed.data.fields[1]?.value.split("> ")[1]
			}" to "${status.split("> ")[1]}" for texture: ${embed.data.title}`,
		);
	// fields[1] is always the status field in submissions
	embed.data.fields[1].value = status;
	if (color) embed.setColor(color);
	return embed;
}

/**
 * Get the original message from a submission description using the "Original Post" field
 * @author Evorp
 * @param description Description to read
 * @returns Tuple of found channel and message ID if exists
 */
export const getOriginalMessage = (description: string) =>
	description
		// get just the first line
		.split(/\s+/g)[0]
		// remove link, this should really be done with one big regex
		.replace(`[${strings.submission.field.original_post}](`, "")
		.replace(")", "")
		// split url into ids
		.split("/")
		// only take the last two ids (channel and message)
		.slice(-2) as [channel: string, message: string];
