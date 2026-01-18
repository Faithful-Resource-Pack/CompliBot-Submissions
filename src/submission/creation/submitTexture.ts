import strings from "@resources/strings.json";

import { Texture, User } from "@interfaces/database";

import cancelSubmission from "@submission/creation/cancelSubmission";
import getTextureResults from "@submission/creation/getTextureResults";
import choiceEmbed from "@submission/creation/choiceEmbed";
import makeEmbed, { EmbedCreationParams } from "@submission/creation/makeEmbed";
import starpass, { canStarpass } from "@submission/actions/starpass";

import { submissionReactions } from "@helpers/interactions";

import { Message, MessageCreateOptions } from "discord.js";
import axios from "axios";

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
	const doInstapass = canStarpass(message);

	const starpassEmbeds = (
		await Promise.all(
			textureResults.map(({ results, attachment }) =>
				submitAttachment(message, results, doInstapass, {
					attachment,
					description,
					authors,
				}),
			),
		)
	).filter((e) => e !== undefined);

	if (DEBUG) console.log("All submissions resolved, deleting message...");

	// only delete message after every embed has been resolved (attachment urls can expire)
	if (message.deletable) message.delete();
	if (doInstapass && starpassEmbeds.length) return starpass(message, starpassEmbeds);
}

/**
 * Sends a finished submission embed from an attachment and texture data
 * @author Juknum, Evorp
 * @param message message to embed
 * @param results found texture results for the attachment
 * @param params additional options for the submission embed
 * @returns embed to instapass if one exists
 */
export async function submitAttachment(
	message: Message<true>,
	results: Texture[],
	doInstapass: boolean,
	params: EmbedCreationParams,
): Promise<MessageCreateOptions["embeds"][number] | undefined> {
	// so the user doesn't think the bot is dead when it's loading a huge comparison
	message.channel.sendTyping();
	const options =
		results.length === 1
			? await makeEmbed(message, results[0], params)
			: await choiceEmbed(message, results, params).catch<null>(() => null);

	// choice embed timed out
	if (!options) return;
	if (doInstapass) return options.embeds[0];

	// don't bother awaiting reactions since it's not necessary to happen immediately
	const embedMessage = await message.channel.send(options);
	addSubmissionReactions(embedMessage);
}

/**
 * Detects co-authors from pings and curly bracket syntax in a given message
 * @author Evorp
 * @param message message to detect co-authors from
 * @returns array of author's discord IDs
 */
export async function getAuthors(message: Message) {
	// submitter always goes first (sets maintain insertion order)
	const authors = new Set([message.author.id]);

	// detect text between curly brackets
	const names = message.content
		.match(/(?<=\{)(.*?)(?=\})/g)
		?.map((name) => name.toLowerCase().trim());

	if (names?.length) {
		const users = (await axios.get<User[]>(`${process.env.API_URL}users/names`)).data;
		// cleaner to use a set since we don't have to filter duplicates
		for (const user of users)
			if (names.includes(user.username?.toLowerCase() || "")) authors.add(user.id);
	}

	// detect by ping (using regex to ensure users not in the server get included)
	const mentions = message.content.match(/(?<=<@|<@!)(\d+?)(?=>)/g) ?? [];
	for (const mention of mentions) authors.add(mention);

	return authors;
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
