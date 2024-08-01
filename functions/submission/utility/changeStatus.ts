import {
	ActionRowBuilder,
	EmbedBuilder,
	ActionRow,
	Message,
	MessageActionRowComponent,
	TextChannel,
} from "discord.js";

const DEBUG = process.env.DEBUG.toLowerCase() == "true";

export interface StatusParams {
	status: string;
	color?: string;
	components?: (ActionRowBuilder<any> | ActionRow<MessageActionRowComponent>)[];
	editOriginal?: boolean;
}

/**
 * Edit submission status
 * @author Evorp
 * @param message message to edit
 * @param params other options to edit
 * @returns new submission embed
 */
export default async function changeStatus(
	message: Message,
	{ status, color, components, editOriginal = false }: StatusParams,
): Promise<EmbedBuilder> {
	if (DEBUG)
		console.log(
			`Changing status "${
				message.embeds?.[0]?.fields?.[1]?.value.split("> ")[1]
			}" to "${status.split("> ")[1]}" for texture: ${message.embeds?.[0]?.title}`,
		);
	const embed = EmbedBuilder.from(message.embeds[0]);
	// fields[1] is always the status field in submissions
	embed.data.fields[1].value = status;

	if (color) embed.setColor(color);
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
