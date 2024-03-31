const strings = require("@resources/strings.json");

const DEBUG = process.env.DEBUG.toLowerCase() == "true";

const choiceEmbed = require("@submission/utility/choiceEmbed");
const makeEmbed = require("@submission/makeEmbed");
const cancelSubmission = require("@submission/utility/cancelSubmission");

const getAuthors = require("@submission/utility/getAuthors");
const minecraftSorter = require("@helpers/minecraftSorter");

const axios = require("axios").default;

/**
 * Get submission information and create embed
 * @author Juknum, Evorp
 * @param {import("discord.js").Message} message message to check and embed
 */
module.exports = async function submitTexture(message) {
	if (!message.attachments.size)
		return cancelSubmission(message, strings.submission.image_not_attached);

	let ongoingMenu;
	// no forEach because it doesn't play well with async
	for (const [attachmentIndex, attachment] of [...message.attachments.values()].entries()) {
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
		const param = {
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

		/** @type {import("@helpers/jsdoc").Texture[]} */
		let results = [];
		try {
			results = (await axios.get(`${process.env.API_URL}textures/${search}/all`)).data;
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

		if (results.length == 1) {
			await makeEmbed(message, results[0], attachment, param);
			continue;
		}

		if (DEBUG) console.log(`Generating choice embed for texture search: ${search}`);
		ongoingMenu = true;
		const mappedResults = results.map((result) => {
			const version = result.paths[0].versions.sort(minecraftSorter).at(-1);
			return {
				label: `[#${result.id}] (${version}) ${result.name}`,
				description: result.paths[0].name,
				value: `${result.id}__${attachmentIndex}`,
			};
		});

		await choiceEmbed(message, mappedResults);
	}

	if (!ongoingMenu && message.deletable) await message.delete();
};
