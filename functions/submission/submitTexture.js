const strings = require("@resources/strings.json");

const DEBUG = process.env.DEBUG.toLowerCase() == "true";

const choiceEmbed = require("@submission/utility/choiceEmbed");
const makeEmbed = require("@submission/makeEmbed");
const invalidSubmission = require("@submission/utility/invalidSubmission");

const getAuthors = require("@submission/utility/getAuthors");
const minecraftSorter = require("@helpers/minecraftSorter");

const { default: axios } = require("axios");

/**
 * Get submission information and create embed
 * @author Juknum, Evorp
 * @param {import("discord.js").Client} client
 * @param {import("discord.js").Message} message message to check and embed
 */
module.exports = async function submitTexture(client, message) {
	// break if no file is attached
	if (!message.attachments.size)
		return invalidSubmission(message, strings.submission.image_not_attached);

	// needs to be set to -1 since we initialize it to zero directly after
	let attachmentIndex = -1;
	let ongoingMenu;
	for (const attachment of message.attachments.values()) {
		// need to update index here since it can skip loops early otherwise
		++attachmentIndex;

		if (DEBUG)
			console.log(`Texture submitted: ${attachmentIndex + 1} of ${message.attachments.size}`);

		// remove extra metadata
		if (!attachment.url.split("?")[0].endsWith(".png")) {
			invalidSubmission(message, strings.submission.invalid_format);
			continue;
		}

		// try and get the texture id from the message contents
		const id = message.content.match(/(?<=\[\#)(.*?)(?=\])/)?.[0];

		// get authors and description for embed
		const param = {
			description: message.content.replace(`[#${id}]`, ""),
			authors: await getAuthors(message),
		};

		// priority to ids -> faster
		if (id) {
			/** @type {import("@helpers/jsdoc").Texture} */
			const texture = (await axios.get(`${process.env.API_URL}textures/${id}/all`)).data;
			if (!Object.keys(texture).length)
				await invalidSubmission(message, strings.submission.unknown_id + err);
			else await makeEmbed(client, message, texture, attachment, param);
			continue;
		}

		// if there's no id, take image url to get name of texture
		const search = attachment.url.split("?")[0].split("/").slice(-1)[0].replace(".png", "");

		// if there's no search and no id the submission can't be valid
		if (!search) {
			await invalidSubmission(message, strings.submission.no_name_given);
			continue;
		}

		/** @type {import("@helpers/jsdoc").Texture[]} */
		const results = (await axios.get(`${process.env.API_URL}textures/${search}/all`)).data;

		if (!results.length) {
			await invalidSubmission(message, strings.submission.does_not_exist + "\n" + search);
			continue;
		} else if (results.length == 1) {
			await makeEmbed(client, message, results[0], attachment, param);
			continue;
		}

		if (DEBUG) console.log(`Generating choice embed for texture search: ${search}`);
		ongoingMenu = true;
		const mappedResults = results.map((result) => {
			const version = result.paths[0].versions.sort(minecraftSorter).reverse()[0];
			return {
				label: `[#${result.id}] (${version}) ${result.name}`,
				description: result.paths[0].name,
				value: `${result.id}__${attachmentIndex}`,
			};
		});

		await choiceEmbed(client, message, mappedResults);
	}
	if (!ongoingMenu && message.deletable) await message.delete();
};
