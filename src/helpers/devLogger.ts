import { Client, TextChannel, EmbedBuilder } from "discord.js";

export interface LogParams {
	color?: string;
	title?: string;
	codeBlocks?: string;
}

/**
 * Log dev errors and information to a dedicated channel
 * @author Evorp
 * @param client
 * @param description what to log
 * @param params optional config
 */
export default async function devLogger(
	client: Client,
	description: string,
	{ color, title, codeBlocks }: LogParams = {},
) {
	const settings: { colors: Record<string, string> } = require("@resources/settings.json");

	const channel = client.channels.cache.get(process.env.LOG_CHANNEL) as TextChannel;
	if (!channel) return; // avoid infinite loop when crash is outside of client

	// empty strings still enable codeblocks, just no highlighting
	if (codeBlocks != null) description = `\`\`\`${codeBlocks}\n${description}\`\`\``;

	const embed = new EmbedBuilder()
		.setTitle(title || "Unhandled Rejection")
		.setDescription(description)
		.setColor(color || settings.colors.red)
		.setTimestamp();

	return channel.send({ embeds: [embed] }).catch(console.error);
}
