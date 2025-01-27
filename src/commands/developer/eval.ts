import strings from "@resources/strings.json";

import warnUser from "@helpers/warnUser";

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } from "discord.js";
import type { Command } from "@interfaces/discord";

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

		const clean = async (text: any) => {
			if (text && text.constructor.name === "Promise") text = await text;
			if (typeof text !== "string") text = require("util").inspect(text, { depth: 1 });

			return text
				.replaceAll(process.env.CLIENT_TOKEN, "[BOT_TOKEN]")
				.replaceAll(process.env.API_TOKEN, "[API_TOKEN]")
				.replaceAll(process.env.GIT_TOKEN, "[GIT_TOKEN]")
				.replace(/`/g, "`" + String.fromCharCode(8203))
				.replace(/@/g, "@" + String.fromCharCode(8203));
		};
		/**
		 * VARIABLES USED IN eval
		 */
		const { client, channel, guild } = interaction;
		const settings = await import("@resources/settings.json");
		const packs = await import("@resources/packs.json");

		// ----

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
