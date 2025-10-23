import strings from "@resources/strings.json";
import type { Command } from "@interfaces/discord";

import { inspect } from "util";

import warnUser from "@helpers/warnUser";
import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } from "discord.js";

export default {
	data: new SlashCommandBuilder()
		.setName("eval")
		.setDescription("Evaluates a string of code.")
		.addStringOption((option) =>
			option.setName("code").setDescription("The code to evaluate.").setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	async execute(interaction) {
		// remove this line to instantly die
		if (!process.env.DEVELOPERS.includes(interaction.user.id))
			return warnUser(interaction, strings.command.no_permission);
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const clean = async (text: unknown) => {
			if (text && text.constructor.name === "Promise") text = await text;
			if (typeof text !== "string") text = inspect(text, { depth: 1 });

			// we now know that text is a string
			return (text as string)
				.replaceAll(process.env.CLIENT_TOKEN, "[BOT_TOKEN]")
				.replaceAll(process.env.API_TOKEN, "[API_TOKEN]")
				.replaceAll(process.env.GIT_TOKEN, "[GIT_TOKEN]")
				.replace(/`/g, "`" + String.fromCharCode(8203))
				.replace(/@/g, "@" + String.fromCharCode(8203));
		};

		/* eslint-disable @typescript-eslint/no-unused-vars */
		const { client, channel, guild } = interaction;
		const settings = await import("@resources/settings.json");
		const packs = await import("@resources/packs.json");
		/* eslint-enable @typescript-eslint/no-unused-vars */

		const code = interaction.options.getString("code", true);
		let evaluated: any;
		try {
			evaluated = await eval(
				`(async () => { try { return await (async () => {${
					code.includes("return") ? code : `return ${code}`
				}})() } catch (e) { return e } })()`,
			);
		} catch (e) {
			evaluated = e;
		}

		interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setColor(settings.colors.blue)
					.setDescription(`\`\`\`js\n${(await clean(evaluated)).slice(0, 4085)}\`\`\``),
			],
		});
	},
} as Command;
