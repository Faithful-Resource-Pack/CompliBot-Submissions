import { ButtonBuilder, ActionRowBuilder, ButtonStyle } from "discord.js";
import settings from "@resources/settings.json";

/**
 * Helper file to store button data and some reactions
 * @author Evorp
 * @see interactionCreate
 */

export const magnifyButton = new ButtonBuilder()
	.setStyle(ButtonStyle.Primary)
	.setEmoji(settings.emojis.magnify)
	.setCustomId("magnifyButton");

export const tileButton = new ButtonBuilder()
	.setStyle(ButtonStyle.Primary)
	.setEmoji(settings.emojis.tile)
	.setCustomId("tileButton");

export const paletteButton = new ButtonBuilder()
	.setStyle(ButtonStyle.Primary)
	.setEmoji(settings.emojis.palette)
	.setCustomId("paletteButton");

export const diffButton = new ButtonBuilder()
	.setStyle(ButtonStyle.Primary)
	.setEmoji(settings.emojis.diff)
	.setCustomId("diffButton");

export const deleteButton = new ButtonBuilder()
	.setStyle(ButtonStyle.Danger)
	.setEmoji(settings.emojis.delete)
	.setCustomId("deleteButton");

export const infoButton = new ButtonBuilder()
	.setStyle(ButtonStyle.Secondary)
	.setEmoji(settings.emojis.question_mark)
	.setCustomId("infoButton");

export const submissionButtons = new ActionRowBuilder<ButtonBuilder>().addComponents([
	magnifyButton,
	tileButton,
	paletteButton,
	infoButton,
]);

export const diffableButtons = new ActionRowBuilder<ButtonBuilder>().addComponents([
	magnifyButton,
	tileButton,
	paletteButton,
	diffButton,
	infoButton,
]);

export const submissionReactions = [
	settings.emojis.upvote,
	settings.emojis.downvote,
	settings.emojis.see_more,
];
