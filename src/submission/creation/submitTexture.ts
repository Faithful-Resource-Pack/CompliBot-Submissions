import strings from "@resources/strings.json";

import { Texture, User } from "@interfaces/database";
import type { SubmissionSource } from "@interfaces/discord";

import cancelSubmission from "@submission/creation/cancelSubmission";
import getTextureResults from "@submission/creation/getTextureResults";
import choiceEmbed from "@submission/creation/choiceEmbed";
import makeEmbed, { EmbedCreationParams } from "@submission/creation/makeEmbed";
import starpass, { shouldStarpass } from "@submission/actions/starpass";

import { submissionReactions } from "@helpers/interactions";
import { hasPermission, PermissionType } from "@helpers/permissions";

import {
	Attachment,
	Message,
	MessageCreateOptions,
	ModalSubmitInteraction,
	ReadonlyCollection,
} from "discord.js";
import axios from "axios";

const DEBUG = process.env.DEBUG.toLowerCase() === "true";

/**
 * Create submission embeds from a modal interaction
 * @author Evorp
 * @param interaction interaction to embed
 */
export async function submitModal(interaction: ModalSubmitInteraction<"cached">) {
	const { resource } = await interaction.reply({ content: "** **", withResponse: true });
	resource.message.delete();

	return submitTexture(
		interaction,
		interaction.fields.getTextInputValue("description"),
		interaction.fields.getUploadedFiles("attachments"),
		// short circuit since the checkbox is omitted on modals
		hasPermission(interaction.member, PermissionType.Submission) &&
			interaction.fields.getCheckbox("starpass"),
	);
}

/**
 * Create submission embeds from a message
 * @author Evorp
 * @param message message to embed
 */
export async function submitMessage(message: Message<true>) {
	if (!message.attachments.size)
		return cancelSubmission(message, strings.submission.error.image_not_attached);

	await submitTexture(message, message.content, message.attachments, shouldStarpass(message));
	if (message.deletable) return message.delete();
}

/**
 * Create submission embeds from provided information
 * @author Evorp
 * @param message message to reference
 * @param description submission description
 * @param attachments texture files
 * @param doInstapass whether to instapass the texture after creating it
 */
export async function submitTexture(
	message: SubmissionSource,
	description: string,
	attachments: ReadonlyCollection<string, Attachment>,
	doInstapass: boolean,
) {
	const textureResults = (
		await Promise.all(
			Array.from(attachments.values(), (attachment) =>
				getTextureResults(attachment, description).catch((err: string) =>
					cancelSubmission(message, err),
				),
			),
		)
	).filter((result) => result !== undefined);

	if (DEBUG)
		console.log(
			`Loaded all submission results: ${textureResults.length} found of ${attachments.size} total`,
		);

	// every attachment was invalid (lol)
	if (!textureResults.length) return;

	// only need to get once for all submissions (same message)
	const authors = await getAuthors(message.member.id, description);
	description = description.replace(/\[#(.*?)\]/g, "");

	const starpassEmbeds = (
		await Promise.all(
			textureResults.map(({ results, attachment }) =>
				submitAttachment(message, results, doInstapass, {
					attachment,
					description,
					// clone reference or authors start accumulating
					authors: new Set(authors),
				}),
			),
		)
	).filter((e) => e !== undefined);

	if (DEBUG) console.log("All submissions resolved...");
	if (doInstapass && starpassEmbeds.length) return starpass(message, description, starpassEmbeds);
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
	message: SubmissionSource,
	results: Texture[],
	doInstapass: boolean,
	params: EmbedCreationParams,
): Promise<MessageCreateOptions["embeds"][number] | undefined> {
	// so the user doesn't think the bot is dead when it's loading a huge comparison
	message.channel.sendTyping();
	const options =
		results.length === 1
			? await makeEmbed(message, results[0], params).catch((err: unknown) =>
					cancelSubmission(message, err),
				)
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
 * @param userID user submitting the texture (they always get included)
 * @param description content to take further coauthors from
 * @returns array of author's discord IDs
 */
export async function getAuthors(userID: string, description: string) {
	// submitter always goes first for permission purposes (sets maintain insertion order)
	const authors = new Set([userID]);

	// detect text between curly brackets
	const names = description.match(/(?<=\{)(.*?)(?=\})/g)?.map((name) => name.toLowerCase().trim());

	// surprisingly faster to fetch all usernames and filter them than send a specialized request
	if (names?.length) {
		const users = (await axios.get<User[]>(`${process.env.API_URL}users/names`)).data;
		const matchedUsers = users.filter(
			(u) => u.username && names.includes(u.username?.toLowerCase()),
		);
		for (const user of matchedUsers) authors.add(user.id);
	}

	// detect by ping (using regex to ensure users not in the server get included)
	const mentions = description.match(/(?<=<@|<@!)(\d+?)(?=>)/g) ?? [];
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
