import strings from "@resources/strings.json";

import { Texture } from "@interfaces/database";

import axios from "axios";
import { Attachment, Message } from "discord.js";

/**
 * Turns a message and attachment into an embed result
 * - Throws detailed error string if the message is invalid
 * @author Juknum, Evorp
 * @param message message to embed
 * @param attachment image to process
 * @returns results or an error string
 */
export default async function getTextureResults(
	message: Message<true>,
	attachment: Attachment,
): Promise<{ results: Texture[]; attachment: Attachment }> {
	// remove extra metadata
	const url = attachment.url.split("?")[0];
	const name = url.split("/").slice(-1)[0].replace(".png", "");

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

	// keep attachment with results so if something gets cancelled things don't shift
	return { results, attachment };
}
