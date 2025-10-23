import strings from "@resources/strings.json";

import type { Texture } from "@interfaces/database";

import makeEmbed, { EmbedParams } from "@submission/creation/makeEmbed";
import cancelSubmission from "@submission/creation/cancelSubmission";
import choiceEmbed from "@submission/creation/choiceEmbed";
import getAuthors from "@submission/creation/getAuthors";

import versionRange from "@helpers/versionRange";

import axios from "axios";
import { Attachment, Message, SelectMenuComponentOptionData } from "discord.js";

const DEBUG = process.env.DEBUG.toLowerCase() === "true";

/**
 * Create submission embeds from a message
 * @author Evorp
 * @param message message to embed
 */
export default async function submitTexture(message: Message<true>) {
	if (!message.attachments.size)
		return cancelSubmission(message, strings.submission.image_not_attached);

	// process order doesn't matter as long as the index is passed in
	const hasMenus = await Promise.all(
		Array.from(message.attachments.values(), (attachment, i) =>
			submitAttachment(message, attachment, i).catch((err: string) =>
				cancelSubmission(message, err),
			),
		),
	);

	// can only delete message if there are no choice menus anywhere
	if (hasMenus.every((m) => !m) && message.deletable) await message.delete();
}

/**
 * Tries to create a submission embed from an attachment
 * @author Juknum, Evorp
 * @param message message to embed
 * @param attachment image to process
 * @param index which texture it is
 * @returns whether the embed required a choice menu
 */
export async function submitAttachment(
	message: Message<true>,
	attachment: Attachment,
	index: number,
): Promise<boolean> {
	// remove extra metadata
	const url = attachment.url.split("?")[0];
	const name = url.split("/").slice(-1)[0].replace(".png", "");

	if (DEBUG)
		console.log(`Texture "${name}" submitted: ${index + 1} of ${message.attachments.size}`);

	// throw the error string so the caller can handle it as they want (easier than sending a result type)
	if (!url.endsWith(".png")) throw strings.submission.invalid_format;

	// try and get the texture id from the message contents
	const id = message.content.match(/(?<=\[#)(.*?)(?=\])/)?.[0];

	// get authors and description for embed
	const params: EmbedParams = {
		description: message.content.replace(`[#${id}]`, ""),
		authors: await getAuthors(message),
	};

	// if there's no id, take image url to get name of texture
	const search = id ?? name;

	// if there's no search and no id the submission can't be valid
	if (!search) throw strings.submission.no_name_given;
	const formattedSearch = id === search ? `[#${id}] ${name}` : search;

	let results: Texture[] = [];
	try {
		results = (await axios.get<Texture[]>(`${process.env.API_URL}textures/${search}/all`)).data;
	} catch {
		throw `${strings.submission.does_not_exist}\`\`\`${formattedSearch}\`\`\``;
	}

	// if using texture id
	if (!Array.isArray(results)) results = [results];

	if (!results.length) throw `${strings.submission.does_not_exist}\`\`\`${formattedSearch}\`\`\``;

	if (results.length === 1) {
		await makeEmbed(message, results[0], attachment, params);
		return false;
	}

	if (DEBUG) console.log(`Generating choice embed for texture search: ${formattedSearch}`);

	const mappedResults = results.map<SelectMenuComponentOptionData>(({ id, name, paths }) => ({
		// usually the first path is the most important
		label: `[#${id}] (${versionRange(paths[0].versions)}) ${name}`,
		description: paths[0].name,
		value: `${id}__${index}`,
	}));

	await choiceEmbed(message, mappedResults);
	return true;
}
