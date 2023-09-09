const { MessageButton, MessageActionRow } = require("discord.js");
const settings = require("@resources/settings.json");

/**
 * Helper file to store button data and some reactions
 * @author Evorp
 * @see interactionCreate
 */

const magnifyButton = new MessageButton()
	.setStyle("PRIMARY")
	.setEmoji(settings.emojis.magnify)
	.setCustomId("magnifyButton");

const tileButton = new MessageButton()
	.setStyle("PRIMARY")
	.setEmoji(settings.emojis.tile)
	.setCustomId("tileButton");

const paletteButton = new MessageButton()
	.setStyle("PRIMARY")
	.setEmoji(settings.emojis.palette)
	.setCustomId("paletteButton");

const diffButton = new MessageButton()
	.setStyle("PRIMARY")
	.setEmoji(settings.emojis.diff)
	.setCustomId("diffButton");

const deleteButton = new MessageButton()
	.setStyle("DANGER")
	.setEmoji(settings.emojis.delete)
	.setCustomId("deleteButton");

const imageButtons = new MessageActionRow().addComponents([
	magnifyButton,
	tileButton,
	paletteButton,
]);

const submissionButtons = new MessageActionRow().addComponents([
	...imageButtons.components,
	diffButton,
]);

const submissionReactions = [
	settings.emojis.upvote,
	settings.emojis.downvote,
	settings.emojis.see_more,
];

module.exports = {
	magnifyButton,
	tileButton,
	paletteButton,
	diffButton,
	deleteButton,
	imageButtons,
	submissionButtons,
	submissionReactions,
};
