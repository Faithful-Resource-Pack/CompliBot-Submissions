const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const getAuthors = require("@submission/utility/getAuthors");
const makeEmbed = require("@submission/makeEmbed");
const addDeleteButton = require("@helpers/addDeleteButton");

const { default: axios } = require("axios");
const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require("discord.js");
/**
 * Selection menu for dealing with multiple valid options
 * @author Evorp
 * @param {import("discord.js").Client} client
 * @param {import("discord.js").Message} message message to reply to
 * @param {import("discord.js").MessageSelectOptionData[]} choices pre-mapped choices
 */
module.exports = async function choiceEmbed(client, message, choices) {
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
		const menu = new MessageSelectMenu()
			.setCustomId(`choiceEmbed_${currentRow}`)
			.setPlaceholder(strings.submission.choice_embed.placeholder)
			.addOptions(options);

		const row = new MessageActionRow().addComponents(menu);
		components.push(row);
	}

	const embed = new MessageEmbed()
		.setTitle(`${choicesLength} results found`)
		.setDescription(strings.submission.choice_embed.description)
		.setColor(settings.colors.blue);

	const choiceMessage = await message.reply({ embeds: [embed], components: components });
	await addDeleteButton(choiceMessage);

	const filter = (interaction) =>
		interaction.isSelectMenu() &&
		interaction.customId == "choiceEmbed" &&
		interaction.user.id == message.author.id;

	const collector = message.channel.createMessageComponentCollector({ filter, time: 30000 });

	collector.on("collect", async (interaction) => {
		if (message.deletable) {
			const [id, index] = interaction.values[0].split("__");
			const attachments = Array.from(message.attachments.values());

			const param = {
				description: message.content,
				authors: await getAuthors(message),
			};

			/** @type {import("@helpers/jsdoc").Texture} */
			const texture = (await axios.get(`${process.env.API_URL}textures/${id}/all`)).data;
			if (choiceMessage.deletable) await choiceMessage.delete();

			return await makeEmbed(client, message, texture, attachments[index], param);
		}
	});

	collector.on("end", async () => {
		if (message.deletable) message.delete();
		if (choiceMessage.deletable) await choiceMessage.delete();
	});
};
