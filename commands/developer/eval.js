const settings = require("@resources/settings.json");
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("eval")
		.setDescription("Evaluates a string of code.")
		.addStringOption((option) =>
			option.setName("code").setDescription("The code to evaluate.").setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		// remove this line to instantly die
		if (!process.env.DEVELOPERS.includes(interaction.user.id))
			return warnUser(interaction, strings.command.no_permission);

		const clean = async (text) => {
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
		 * VARIABLES USED IN eval()
		 */

		const client = interaction.client;
		const channel = interaction.channel;

		// ----

		const code = interaction.options.getString("code", true);
		const evaluated = await eval(
			`(async () => { try { return await (async () => {${
				code.includes("return") ? code : `return ${code}`
			}})() } catch (e) { return e } })()`,
		);

		interaction.reply({
			ephemeral: true,
			embeds: [
				new EmbedBuilder().setColor(settings.colors.blue).setDescription(
					`\`\`\`js\n${(await clean(evaluated)).slice(0, 4085)}\`\`\``,
				),
			],
		});
	},
};
