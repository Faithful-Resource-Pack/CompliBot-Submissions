const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const getAuthors = require("@submission/utility/getAuthors");
const makeEmbed = require("@submission/makeEmbed");
const addDeleteButton = require("@helpers/addDeleteButton");

const { default: axios } = require("axios");
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { SelectMenuInteraction } = require("discord.js");

const DEBUG = process.env.DEBUG.toLowerCase() == "true";

/**
 * Selection menu for dealing with multiple valid options
 * @author Juknum, Evorp
 * @param {import("discord.js").Message} message message to reply to
 * @param {import("discord.js").MessageSelectOptionData[]} choices pre-mapped choices
 */
module.exports = async function choiceEmbed(message, choices) {
	const emojis = settings.emojis.default_select;
	const components = [];
	const choicesLength = choices.length; // we're modifying choices directly so it needs to be saved first

	const maxRows = 4; // actually 5 but - 1 because we are adding a delete button to it (the 5th one)
	for (let currentRow = 0; currentRow <= maxRows && choices.length; ++currentRow) {
		/** @type {import("discord.js").MessageSelectOptionData[]} */
		const options = [];
		for (let i = 0; i < emojis.length; ++i) {
			if (choices[0] !== undefined) {
				let choice = choices.shift();
				choice.emoji = emojis[i % emojis.length];
				options.push(choice);
			}
		}
		const menu = new StringSelectMenuBuilder()
			.setCustomId(`choiceEmbed_${currentRow}`)
			.setPlaceholder(strings.submission.choice_embed.placeholder)
			.addOptions(options);

		const row = new ActionRowBuilder().addComponents(menu);
		components.push(row);
	}

	const embed = new EmbedBuilder()
		.setTitle(`${choicesLength} results found`)
		.setDescription(strings.submission.choice_embed.description)
		.setColor(settings.colors.blue);

	const choiceMessage = await message.reply({ embeds: [embed], components: components });
	await addDeleteButton(choiceMessage);

	/** @param {SelectMenuInteraction} interaction */
	const filter = (interaction) =>
		interaction.customId.startsWith("choiceEmbed") && // format is choiceEmbed_<ROWNUMBER>
		interaction.message.id == choiceMessage.id &&
		interaction.user.id == message.author.id; // correct permissions

	const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 });

	collector.once("collect", async (interaction) => {
		if (!message.deletable) {
			// message already deleted so we clean up and break early
			if (choiceMessage.deletable) choiceMessage.delete();
			return;
		};

		const [id, index] = interaction.values[0].split("__");
		if (DEBUG) console.log(`Texture selected: ${id}`);
		const attachments = Array.from(message.attachments.values());

		const param = {
			description: message.content,
			authors: await getAuthors(message),
		};

		/** @type {import("@helpers/jsdoc").Texture} */
		const texture = (await axios.get(`${process.env.API_URL}textures/${id}/all`)).data;
		if (choiceMessage.deletable) await choiceMessage.delete();

		return await makeEmbed(message, texture, attachments[index], param);
	});

	collector.once("end", async () => {
		// throws error if already deleted, for some reason .deletable doesn't work?
		message.delete().catch(() => {});
		choiceMessage.delete().catch(() => {});
	});
};
