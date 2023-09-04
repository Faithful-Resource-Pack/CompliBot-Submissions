const settings = require("@resources/settings.json");
const strings = require("@resource/strings.json");

const addDeleteButton = require("@helpers/addDeleteButton");

const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require("discord.js");
/**
 * Selection menu for dealing with multiple valid options
 * @author Evorp
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

	/**
	 * @see selectMenuUsed all extra code from here on out is there
	 */
	await addDeleteButton(choiceMessage);

	return setTimeout(() => {
		if (choiceMessage.deletable) choiceMessage.delete();
		if (message.deletable) message.delete();
	}, 30000);
};
