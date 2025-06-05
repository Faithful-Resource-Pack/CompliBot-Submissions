import settings from "@resources/settings.json";
import { Client, AttachmentBuilder, TextChannel, Attachment } from "discord.js";

/**
 * Convert AttachmentBuilder objects into sendable URLs
 * @author RobertR11, Evorp
 * @param client
 * @param files files to get urls from
 * @returns array of image urls
 */
export default async function getImages(
	client: Client,
	...files: (AttachmentBuilder | Attachment)[]
): Promise<string[]> {
	const channel = client.channels.cache.get(settings.discord.channels.images) as TextChannel;
	const imgMessage = await channel.send({ files });

	return imgMessage.attachments.map((attachment) => attachment.url);
}
