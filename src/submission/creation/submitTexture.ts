import strings from "@resources/strings.json";

import { Texture } from "@interfaces/database";

import getTextureResults from "@submission/creation/getTextureResults";
import cancelSubmission from "@submission/creation/cancelSubmission";
import makeEmbed, { EmbedCreationParams } from "@submission/creation/makeEmbed";
import getAuthors from "@submission/creation/getAuthors";
import choiceEmbed from "@submission/creation/choiceEmbed";

import { Message } from "discord.js";

const DEBUG = process.env.DEBUG.toLowerCase() === "true";

/**
 * Create submission embeds from a message
 * @author Evorp
 * @param message message to embed
 */
export default async function submitTexture(message: Message<true>) {
	if (!message.attachments.size)
		return cancelSubmission(message, strings.submission.image_not_attached);

	const textureResults = (
		await Promise.all(
			Array.from(message.attachments.values(), (attachment) =>
				getTextureResults(message, attachment).catch((err: string) =>
					cancelSubmission(message, err),
				),
			),
		)
	).filter((result) => result !== undefined);

	// every attachment was invalid (lol)
	if (!textureResults.length) return;

	// only need to get once for all submissions (same message)
	const authors = await getAuthors(message);
	const description = message.content.replace(/\[#(.*?)\]/g, "");

	await Promise.all(
		textureResults.map(({ results, attachment }) =>
			submitAttachment(message, results, {
				attachment,
				description,
				authors,
			}),
		),
	);

	// can only delete message if there are no choice menus anywhere
	if (message.deletable && textureResults.every((data) => data.results.length === 1))
		await message.delete();
}

/**
 * Create a submission embed from an attachment and texture data
 * @author Juknum, Evorp
 * @param message message to embed
 * @param results found texture results for the attachment
 * @param params additional options for the submission embed
 */
export async function submitAttachment(
	message: Message<true>,
	results: Texture[],
	params: EmbedCreationParams,
) {
	if (results.length === 1) return makeEmbed(message, results[0], params);
	if (DEBUG) {
		const candidates = results.map((r, i) => `${i + 1}: [#${r.id}] ${r.name}`).join("\n");
		console.log(`Generating choice embed for potential results:\n${candidates}`);
	}
	return choiceEmbed(message, results, params);
}
