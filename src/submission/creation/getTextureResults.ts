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
 * @returns texture result array or an error string
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

	// prioritize id if exists, otherwise use texture name
	const id = message.content.match(/(?<=\[#)(.+?)(?=\])/)?.[0];
	const search = id ?? name;

	// if there's no search and no id the submission can't be valid
	if (!search) throw strings.submission.no_name_given;
	const formattedSearch = id === search ? `[#${id}] ${name}` : search;

	// keep attachment with results so if something gets cancelled things don't shift
	return {
		results: await searchTextures(search, formattedSearch),
		attachment,
	};
}

/**
 * Safe texture search with somewhat intelligent error messages
 * @author Evorp
 * @param search user search string
 * @param formatted formatted search to show user if something goes wrong
 * @returns texture results or error string if something goes wrong
 */
async function searchTextures(search: string, formatted?: string) {
	try {
		const results = (await axios.get<Texture[]>(`${process.env.API_URL}textures/${search}/all`))
			.data;
		const cleaned = Array.isArray(results) ? results : [results];

		// passes into error handler
		if (!cleaned.length) throw new Error("No results found");
		return cleaned;
	} catch {
		throw `${strings.submission.does_not_exist}\n\`\`\`${formatted || search}\`\`\``;
	}
}
