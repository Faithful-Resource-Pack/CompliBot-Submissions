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
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		if (!process.env.DEVELOPERS.includes(interaction.user.id))
			return await interaction.reply({ content: "lol no" });

		const msgID = interaction.options.getString("message");

		if (!msgID) return await interaction.reply({ content: strings.command.behave });

		try {
			const message = await interaction.channel.messages.fetch(msgID);
			const msg = await interaction.reply({ content: "** **", fetchReply: true });
			msg.delete();

			return await message.reply({ content: strings.command.behave });
		} catch {
			return await interaction.reply({ content: strings.command.behave });
		}
	},
};
