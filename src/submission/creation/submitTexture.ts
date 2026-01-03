import settings from "@resources/settings.json";
import strings from "@resources/strings.json";

import { Texture } from "@interfaces/database";

import getTextureResults from "@submission/creation/getTextureResults";
import cancelSubmission from "@submission/creation/cancelSubmission";
import getAuthors from "@submission/creation/getAuthors";
import choiceEmbed from "@submission/creation/choiceEmbed";
import makeEmbed, { EmbedCreationParams } from "@submission/creation/makeEmbed";

import { editEmbed } from "@submission/discord/changeStatus";
import getPackByChannel from "@submission/discord/getPackByChannel";

import { instapassEmbeds, isInstapassEmbed } from "@submission/actions/instapass";

import { submissionButtons, submissionReactions } from "@helpers/interactions";

import { Message, MessageCreateOptions, TextChannel } from "discord.js";

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

	if (DEBUG)
		console.log(
			`Loaded all submission results: ${textureResults.length} found of ${message.attachments.size} total`,
		);

	// every attachment was invalid (lol)
	if (!textureResults.length) return;

	// only need to get once for all submissions (same message)
	const authors = await getAuthors(message);
	const description = message.content.replace(/\[#(.*?)\]/g, "");
	const doInstapass = isInstapassEmbed(message);

	const embedsToInstapass = (
		await Promise.all(
			textureResults.map(({ results, attachment }) =>
				submitAttachment(message, results, {
					attachment,
					description,
					authors,
					doInstapass,
				}),
			),
		)
	).filter((e) => e !== undefined);

	if (DEBUG) console.log("All submissions resolved, deleting message...");

	// only delete message after every embed has been resolved (attachment urls can expire)
	if (message.deletable) message.delete();

	if (!doInstapass || !embedsToInstapass.length) return;

	const pack = getPackByChannel(message.channel.id);
	const resultChannel = message.client.channels.cache.get(
		pack.submission.channels.results,
	) as TextChannel;

	const status = `Instapassed by <@${message.author.id}>`;
	const resultMessagesToInstapass = await Promise.all(
		embedsToInstapass.map((embed) => {
			const edited = editEmbed(embed, {
				color: settings.colors.yellow,
				status: `<:instapass:${settings.emojis.instapass}> ${status}`,
			});
			return resultChannel.send({
				embeds: [edited],
				components: [submissionButtons],
			});
		}),
	);

	await instapassEmbeds(resultMessagesToInstapass, pack);
}

/**
 * Create a submission embed from an attachment and texture data
 * @author Juknum, Evorp
 * @param message message to embed
 * @param results found texture results for the attachment
 * @param params additional options for the submission embed
 * @returns embed to instapass if one exists
 */
async function submitAttachment(
	message: Message<true>,
	results: Texture[],
	params: EmbedCreationParams,
): Promise<MessageCreateOptions["embeds"][number] | undefined> {
	// so the user doesn't think the bot is dead when it's loading a huge comparison
	if (!params.doInstapass) message.channel.sendTyping();
	const options =
		results.length === 1
			? await makeEmbed(message, results[0], params)
			: await choiceEmbed(message, results, params).catch<null>(() => null);

	// choice embed timed out
	if (!options) return;
	if (params.doInstapass) return options.embeds[0];

	// send message directly
	const embedMessage = await message.channel.send(options);
	addSubmissionReactions(embedMessage);
}

/**
 * Add voting reactions in the correct order to a finished submission embed
 * @author Evorp
 * @param message message to add reactions to
 */
export async function addSubmissionReactions(message: Message<true>) {
	// do synchronously to ensure correct order (run concurrently with other embeds anyways)
	for (const emoji of submissionReactions) await message.react(emoji).catch(() => {});
}
