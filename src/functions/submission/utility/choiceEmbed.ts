import settings from "@resources/settings.json";
import strings from "@resources/strings.json";

import getAuthors from "@submission/utility/getAuthors";
import makeEmbed, { EmbedParams } from "@submission/makeEmbed";
import addDeleteButton from "@helpers/addDeleteButton";

import {
	EmbedBuilder,
	ActionRowBuilder,
	StringSelectMenuBuilder,
	Message,
	SelectMenuComponentOptionData,
	StringSelectMenuInteraction,
	ComponentType,
} from "discord.js";
import { hasPermission } from "@helpers/permissions";
import axios from "axios";
import type { Texture } from "@interfaces/database";

const DEBUG = process.env.DEBUG.toLowerCase() === "true";

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
	const emojis = settings.emojis.default_select;
	const components = [];
	const choicesLength = choices.length; // we're modifying choices directly so it needs to be saved first

	const maxRows = 4; // actually 5 but - 1 because we are adding a delete button to it (the 5th one)
	for (let currentRow = 0; currentRow < maxRows && choices.length; ++currentRow) {
		const options: SelectMenuComponentOptionData[] = [];
		for (let i = 0; i < emojis.length; ++i) {
			if (choices[0] !== undefined) {
				const choice = choices.shift();
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

	const filter = (interaction: StringSelectMenuInteraction) =>
		// format is choiceEmbed_<ROWNUMBER> (needs unique ids)
		interaction.customId.startsWith("choiceEmbed") &&
		interaction.message.id === choiceMessage.id &&
		// admins can interact with choice embeds always
		(interaction.user.id === message.author.id || hasPermission(message.member, "administrator"));

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

		const params: EmbedParams = {
			description: message.content,
			authors: await getAuthors(message),
		};

		const texture = (await axios.get<Texture>(`${process.env.API_URL}textures/${id}/all`)).data;
		if (choiceMessage.deletable) await choiceMessage.delete();

		return makeEmbed(message, texture, attachments[index], params);
	});

	collector.once("end", async () => {
		// throws error if already deleted
		message.delete().catch(() => {});
		choiceMessage.delete().catch(() => {});
	});
}
