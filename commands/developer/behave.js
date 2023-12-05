const strings = require("@resources/strings.json");

const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName("behave")
		.setDescription(strings.command.description.behave)
		.addStringOption((option) =>
			option.setName("message").setDescription("Message ID to reply to").setRequired(false),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	async execute(interaction) {
		if (!process.env.DEVELOPERS.includes(interaction.user.id))
			return interaction.reply({ content: "lol no" });

		const msgID = interaction.options.getString("message");

		if (!msgID) return interaction.reply({ content: strings.command.behave });

		try {
			const message = await interaction.channel.messages.fetch(msgID);
			const msg = await interaction.reply({ content: "** **", fetchReply: true });
			msg.delete();

			return message.reply({ content: strings.command.behave });
		} catch {
			return interaction.reply({ content: strings.command.behave });
		}
	},
};
