const addDeleteButton = require("@helpers/addDeleteButton");
const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const axios = require("axios").default;

const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	data: new SlashCommandBuilder().setName("ping").setDescription(strings.command.description.ping),
	async execute(interaction) {
		const quotes = (
			await axios.get(
				`https://raw.githubusercontent.com/Faithful-Resource-Pack/CompliBot/main/json/quotes.json`,
			)
		).data.ping;

		const quote = quotes[Math.floor(Math.random() * quotes.length)];
		// NEVER USE AWAIT ASYNC
		// only send response to maximize response time
		return interaction
			.reply({ content: "** **", fetchReply: true })
			.then((msg) => {
				const apiPing = interaction.client.ws.ping;
				const botPing = msg.createdTimestamp - interaction.createdTimestamp;

				const embed = new EmbedBuilder()
					.setTitle("Pong!")
					.setDescription(`_${quote.replace("%YEAR%", new Date().getFullYear() + 2)}_`)
					.setColor(settings.colors.blue)
					.addFields(
						{ name: "Bot Latency", value: `${botPing}ms`, inline: true },
						{ name: "API Latency", value: `${Math.round(apiPing)}ms`, inline: true },
					);

				return interaction.editReply({ embeds: [embed] });
			})
			.then(addDeleteButton);
	},
};
