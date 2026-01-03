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
	if (!components) components = Array.from(message.components);
	await message.edit({ embeds: [embed], components });

	// no need to check for original post, return early
	if (!editOriginal || !embed.data.description?.startsWith("[Original Post](")) return embed;

	// get original message id from submission description (pain)
	const [channelID, messageID] = embed.data.description
		.replace("[Original Post](", "") // remove markdown links
		.replace(")", "") // should probably be done with match() and regex
		.split(/\s+/g)[0] // get just the url
		.split("/") // split url into ids
		.slice(-2); // only take the last two ids (channel and message)

	try {
		const channel = (await message.client.channels.fetch(channelID)) as TextChannel;
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
				embed.data.fields?.[1]?.value.split("> ")[1]
			}" to "${status.split("> ")[1]}" for texture: ${embed.data.title}`,
		);
	// fields[1] is always the status field in submissions
	embed.data.fields[1].value = status;
	if (color) embed.setColor(color);
	return embed;
}
