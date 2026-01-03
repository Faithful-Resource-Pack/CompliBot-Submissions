import settings from "@resources/settings.json";
import strings from "@resources/strings.json";

import type { Texture } from "@interfaces/database";

import makeEmbed, { EmbedCreationParams } from "@submission/creation/makeEmbed";

import addDeleteButton from "@helpers/addDeleteButton";
import { hasPermission, PermissionType } from "@helpers/permissions";
import devLogger from "@helpers/devLogger";
import versionRange from "@helpers/versionRange";

import {
	EmbedBuilder,
	ActionRowBuilder,
	StringSelectMenuBuilder,
	Message,
	SelectMenuComponentOptionData,
	StringSelectMenuInteraction,
	ComponentType,
	MessageCreateOptions,
} from "discord.js";

const DEBUG = process.env.DEBUG.toLowerCase() === "true";

// todo: look into the actual length (you can go a bit higher than this and it still works)
export const MAX_LENGTH = 6000;
// 5 - 1 for delete button row
export const MAX_ROWS = 4;
export const MAX_CHOICE_PER_ROW = 25;

/**
 * Create a choice menu for multiple textures and listen for results
 * @author Juknum, Evorp
 * @param message message to reply to
 * @param results texture results to choose between
 * @param params additional options for the submission embed
 */
export default async function choiceEmbed(
	message: Message<true>,
	results: Texture[],
	params: EmbedCreationParams,
) {
	const choiceMessage = await sendChoiceEmbed(message, results);

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

	// only resolves once selected
	return new Promise<MessageCreateOptions>((resolve, reject) => {
		collector.once("collect", async (interaction: StringSelectMenuInteraction) => {
			if (!message.deletable) {
				if (choiceMessage.deletable) choiceMessage.delete();
				return reject("Submission message already deleted");
			}

			const id = interaction.values[0];
			if (DEBUG) console.log(`Texture selected: [#${id}]`);

			const texture = results.find((r) => r.id === id);
			if (!texture) {
				await devLogger(message.client, `Failed to find ID [#${id}] in choice embed`);
				return reject("Texture not found");
			}

			const options = await makeEmbed(message, texture, params);
			if (choiceMessage.deletable) choiceMessage.delete();
			resolve(options);
		});

		collector.once("end", async () => {
			choiceMessage.delete().catch(() => {});
			reject("Timed out");
		});
	});
}

/**
 * Create/send choice menu and return it
 * @author Juknum, Evorp
 * @param message message to reply to
 * @param results texture results to choose between
 */
export async function sendChoiceEmbed(message: Message<true>, results: Texture[]) {
	message.channel.sendTyping();
	const choices = results.map<SelectMenuComponentOptionData>(({ id, name, paths }) => ({
		// usually the first path is the most important
		label: `[#${id}] ${name} (${versionRange(paths[0].versions)})`,
		description: paths[0].name,
		value: id,
	}));

	if (DEBUG) {
		const candidates = choices.map((c, i) => `${i + 1}: ${c.label}`).join("\n");
		console.log(`Generating choice embed for potential results:\n${candidates}`);
	}

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
				messageLength += cur.label.length + (cur.description?.length ?? 0);
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
