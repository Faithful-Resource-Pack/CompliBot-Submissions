import strings from "@resources/strings.json";

const DEBUG = process.env.DEBUG.toLowerCase() === "true";

import makeEmbed, { EmbedParams } from "@submission/makeEmbed";
import cancelSubmission from "@submission/utility/cancelSubmission";
import choiceEmbed from "@submission/utility/choiceEmbed";

import getAuthors from "@submission/utility/getAuthors";
import versionSorter from "@helpers/versionSorter";

import axios from "axios";
import { Attachment, Message, SelectMenuComponentOptionData } from "discord.js";
import type { Texture } from "@interfaces/database";

/**
 * Create submission embeds from a message
 * @author Evorp
 * @param message message to embed
 */
export default async function submitTexture(message: Message<true>) {
	if (!message.attachments.size)
		return cancelSubmission(message, strings.submission.image_not_attached);

	const attachments = Array.from(message.attachments.values());
	// can run concurrently because the process order doesn't matter as long as it all happens
	const hasMenus = await Promise.all(
		attachments.map((attachment, i) => submitAttachment(message, attachment, i)),
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
): Promise<void | true> {
	// remove extra metadata
	const url = attachment.url.split("?")[0];
	const name = url.split("/").slice(-1)[0].replace(".png", "");

	if (DEBUG) console.log(`Texture ${name} submitted: ${index + 1} of ${message.attachments.size}`);

	if (!url.endsWith(".png")) return cancelSubmission(message, strings.submission.invalid_format);

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
	if (!search) return cancelSubmission(message, strings.submission.no_name_given);

	let results: Texture[] = [];
	try {
		results = (await axios.get<Texture[]>(`${process.env.API_URL}textures/${search}/all`)).data;
	} catch {
		return cancelSubmission(message, `${strings.submission.does_not_exist}\n${search}`);
	}

	// if using texture id
	if (!Array.isArray(results)) results = [results];

	if (!results.length)
		return cancelSubmission(message, `${strings.submission.does_not_exist}\n${search}`);

	if (results.length === 1) return makeEmbed(message, results[0], attachment, params);

	if (DEBUG) console.log(`Generating choice embed for texture search: ${search}`);

	const mappedResults = results.map<SelectMenuComponentOptionData>((result) => {
		const version = result.paths[0].versions.sort(versionSorter).at(-1);
		return {
			label: `[#${result.id}] (${version}) ${result.name}`,
			description: result.paths[0].name,
			value: `${result.id}__${index}`,
		};
	});

	await choiceEmbed(message, mappedResults);
	return true;
}
