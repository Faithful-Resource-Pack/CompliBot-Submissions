const { ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const settings = require("@resources/settings.json");

/**
 * Helper file to store button data and some reactions
 * @author Evorp
 * @see interactionCreate
 */

const magnifyButton = new ButtonBuilder()
	.setStyle(ButtonStyle.Primary)
	.setEmoji(settings.emojis.magnify)
	.setCustomId("magnifyButton");

const tileButton = new ButtonBuilder()
	.setStyle(ButtonStyle.Primary)
	.setEmoji(settings.emojis.tile)
	.setCustomId("tileButton");

const paletteButton = new ButtonBuilder()
	.setStyle(ButtonStyle.Primary)
	.setEmoji(settings.emojis.palette)
	.setCustomId("paletteButton");

const diffButton = new ButtonBuilder()
	.setStyle(ButtonStyle.Primary)
	.setEmoji(settings.emojis.diff)
	.setCustomId("diffButton");

const deleteButton = new ButtonBuilder()
	.setStyle(ButtonStyle.Danger)
	.setEmoji(settings.emojis.delete)
	.setCustomId("deleteButton");

/** @type {ActionRowBuilder<ButtonBuilder>} */
const imageButtons = new ActionRowBuilder().addComponents([
	magnifyButton,
	tileButton,
	paletteButton,
]);

/** @type {ActionRowBuilder<ButtonBuilder>} */
const submissionButtons = new ActionRowBuilder().addComponents([
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
