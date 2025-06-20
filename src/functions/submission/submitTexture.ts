import strings from "@resources/strings.json";

const DEBUG = process.env.DEBUG.toLowerCase() === "true";

import choiceEmbed from "@submission/utility/choiceEmbed";
import makeEmbed, { EmbedParams } from "@submission/makeEmbed";
import cancelSubmission from "@submission/utility/cancelSubmission";

import getAuthors from "@submission/utility/getAuthors";
import versionSorter from "@helpers/versionSorter";

import axios from "axios";
import { Message } from "discord.js";
import type { Texture } from "@interfaces/database";

/**
 * Get submission information and create embed
 * @author Juknum, Evorp
 * @param message message to check and embed
 */
export default async function submitTexture(message: Message<true>) {
	if (!message.attachments.size)
		return cancelSubmission(message, strings.submission.image_not_attached);

	let ongoingMenu: boolean;
	// no forEach because it doesn't play well with async
	for (const [attachmentIndex, attachment] of Array.from(message.attachments.values()).entries()) {
		if (DEBUG)
			console.log(`Texture submitted: ${attachmentIndex + 1} of ${message.attachments.size}`);

		// remove extra metadata
		if (!attachment.url.split("?")[0].endsWith(".png")) {
			cancelSubmission(message, strings.submission.invalid_format);
			continue;
		}

		// try and get the texture id from the message contents
		const id = message.content.match(/(?<=\[#)(.*?)(?=\])/)?.[0];

		// get authors and description for embed
		const params: EmbedParams = {
			description: message.content.replace(`[#${id}]`, ""),
			authors: await getAuthors(message),
		};

		// if there's no id, take image url to get name of texture
		const search = id ?? attachment.url.split("?")[0].split("/").slice(-1)[0].replace(".png", "");

		// if there's no search and no id the submission can't be valid
		if (!search) {
			await cancelSubmission(message, strings.submission.no_name_given);
			continue;
		}

		let results: Texture[] = [];
		try {
			results = (await axios.get<Texture[]>(`${process.env.API_URL}textures/${search}/all`)).data;
		} catch {
			await cancelSubmission(message, strings.submission.does_not_exist + "\n" + search);
			continue;
		}

		// if using texture id
		if (!Array.isArray(results)) results = [results];

		if (!results.length) {
			await cancelSubmission(message, strings.submission.does_not_exist + "\n" + search);
			continue;
		}

		if (results.length === 1) {
			await makeEmbed(message, results[0], attachment, params);
			continue;
		}

		if (DEBUG) console.log(`Generating choice embed for texture search: ${search}`);
		ongoingMenu = true;
		const mappedResults = results.map((result) => {
			const version = result.paths[0].versions.sort(versionSorter).at(-1);
			return {
				label: `[#${result.id}] (${version}) ${result.name}`,
				description: result.paths[0].name,
				value: `${result.id}__${attachmentIndex}`,
			};
		});

		await choiceEmbed(message, mappedResults);
	}

	if (!ongoingMenu && message.deletable) await message.delete();
}
