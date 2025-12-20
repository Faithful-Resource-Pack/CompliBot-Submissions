import settings from "@resources/settings.json";
import strings from "@resources/strings.json";

import type { Texture } from "@interfaces/database";

import getAuthors from "@submission/creation/getAuthors";
import makeEmbed, { EmbedCreationParams } from "@submission/creation/makeEmbed";

import addDeleteButton from "@helpers/addDeleteButton";
import { hasPermission, PermissionType } from "@helpers/permissions";

import {
	EmbedBuilder,
	ActionRowBuilder,
	StringSelectMenuBuilder,
	Message,
	SelectMenuComponentOptionData,
	StringSelectMenuInteraction,
	ComponentType,
} from "discord.js";
import axios from "axios";

const DEBUG = process.env.DEBUG.toLowerCase() === "true";

// todo: look into the actual length (you can go a bit higher than this and it still works)
export const MAX_LENGTH = 6000;
// 5 - 1 for delete button row
export const MAX_ROWS = 4;
export const MAX_CHOICE_PER_ROW = 25;

/**
 * Selection menu for dealing with multiple valid options
 * @author Juknum, Evorp
 * @param message message to reply to
 * @param choices pre-mapped choices
 */
export default async function choiceEmbed(
	message: Message<true>,
	choices: SelectMenuComponentOptionData[],
) {
	const choiceMessage = await sendChoiceEmbed(message, choices);
	const filter = (interaction: StringSelectMenuInteraction) =>
		// format is choiceEmbed_<ROWNUMBER> (needs unique ids)
		interaction.customId.startsWith("choiceEmbed") &&
		interaction.message.id === choiceMessage.id &&
		// admins can interact with choice embeds always
		(interaction.user.id === message.author.id ||
			hasPermission(message.member, PermissionType.Administrator));

	const collector = message.channel.createMessageComponentCollector<ComponentType.StringSelect>({
		filter,
		time: 60000,
	});

	collector.once("collect", async (interaction: StringSelectMenuInteraction) => {
		if (!message.deletable) {
			// message already deleted so we clean up and break early
			if (choiceMessage.deletable) choiceMessage.delete();
			return;
		}

		const [id, index] = interaction.values[0].split("__");
		if (DEBUG) console.log(`Texture selected: ${id}`);
		const attachments = Array.from(message.attachments.values());

		const params: EmbedCreationParams = {
			attachment: attachments[index],
			description: message.content,
			authors: await getAuthors(message),
		};

		const texture = (await axios.get<Texture>(`${process.env.API_URL}textures/${id}/all`)).data;

		await makeEmbed(message, texture, params);
		if (choiceMessage.deletable) return choiceMessage.delete();
	});

	collector.once("end", async () => {
		// throws error if already deleted
		message.delete().catch(() => {});
		choiceMessage.delete().catch(() => {});
	});
}

/**
 * Create/send choice menu and return it
 * @author Juknum, Evorp
 * @param message message to reply to
 * @param choices pre-mapped choices
 * @returns
 */
export async function sendChoiceEmbed(
	message: Message<true>,
	choices: SelectMenuComponentOptionData[],
) {
	const emojis = settings.emojis.default_select;
	const menuLength = Math.min(MAX_CHOICE_PER_ROW, emojis.length);

	let messageLength = 0;
	let resultCount = 0;

	const components: ActionRowBuilder<StringSelectMenuBuilder>[] = [];
	for (let currentRow = 0; currentRow < MAX_ROWS; ++currentRow) {
		const options = choices
			// take relevant slice (end not included)
			.slice(currentRow * menuLength, (1 + currentRow) * menuLength)
			.reduce<SelectMenuComponentOptionData[]>((acc, cur, i) => {
				messageLength += cur.label.length + cur.description.length;
				// stop accepting new
				if (messageLength > MAX_LENGTH) return acc;
				acc.push({ ...cur, emoji: emojis[i] });
				return acc;
			}, []);

		// hit char limit or all options have been exhausted
		if (!options.length) break;
		resultCount += options.length;

		const menu = new StringSelectMenuBuilder()
			.setCustomId(`choiceEmbed_${currentRow}`)
			.setPlaceholder(strings.submission.choice_embed.placeholder)
			.addOptions(options);

		components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu));
	}

	const embed = new EmbedBuilder()
		.setTitle(`${choices.length} results found`)
		.setDescription(strings.submission.choice_embed.description)
		.setColor(settings.colors.blue);

	if (messageLength > MAX_LENGTH)
		embed.setTitle(`Showing 1–${resultCount} of ${choices.length} results`);

	const choiceMessage = await message.reply({ embeds: [embed], components: components });
	await addDeleteButton(choiceMessage);
	return choiceMessage;
}
