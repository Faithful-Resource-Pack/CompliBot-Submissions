import strings from "@resources/strings.json";

import { Texture } from "@interfaces/database";

import { EmbedCreationParams } from "@submission/creation/makeEmbed";
import getAuthors from "@submission/creation/getAuthors";

import axios from "axios";
import { Attachment, Message } from "discord.js";

export interface SubmissionCreationData extends EmbedCreationParams {
	name: string; // for debugging
	results: Texture[];
	index: number; // for disambiguating what attachment a choice embed points to
}

const DEBUG = process.env.DEBUG.toLowerCase() === "true";

/**
 * Turns a message and attachment into an embed result
 * - Throws detailed error string if the message is invalid
 * @author Juknum, Evorp
 * @param message message to embed
 * @param attachment image to process
 * @param index which texture it is
 * @returns results or an error string
 */
export default async function getSubmissionData(
	message: Message<true>,
	attachment: Attachment,
	index: number,
): Promise<SubmissionCreationData> {
	// remove extra metadata
	const url = attachment.url.split("?")[0];
	const name = url.split("/").slice(-1)[0].replace(".png", "");

	if (DEBUG)
		console.log(`Texture "${name}" submitted: ${index + 1} of ${message.attachments.size}`);

	// throw the error string as copium for no result types
	if (!url.endsWith(".png")) throw strings.submission.invalid_format;

	// try and get the texture id from the message contents
	const id = message.content.match(/(?<=\[#)(.+?)(?=\])/)?.[0];

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

	return {
		name: formattedSearch,
		description: message.content.replace(`[#${id}]`, ""),
		authors: await getAuthors(message),
		results,
		attachment,
		index,
	};
}
