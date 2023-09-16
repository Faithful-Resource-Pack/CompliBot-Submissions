const strings = require("@resources/strings.json");

const { SlashCommandBuilder } = require("discord.js");
const warnUser = require("@helpers/warnUser");

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("say")
		.setDescription(strings.command.description.say)
		.addStringOption((option) =>
			option.setName("message").setDescription("What should the bot say?").setRequired(true),
		),
	async execute(interaction) {
		if (!process.env.DEVELOPERS.includes(interaction.user.id))
			return warnUser(interaction, strings.command.no_permission);

		const content = interaction.options.getString("message", true);

		const msg = await interaction.reply({ content: "** **", fetchReply: true });
		if (msg.deletable) await msg.delete();
		await interaction.channel.send({ content });
	},
};
