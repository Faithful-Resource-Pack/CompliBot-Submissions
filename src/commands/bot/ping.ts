import settings from "@resources/settings.json";
import strings from "@resources/strings.json";
import { defineCommand } from "@interfaces/discord";

import addDeleteButton from "@helpers/addDeleteButton";

import axios from "axios";
import { EmbedBuilder, SlashCommandBuilder } from "discord.js";

export default defineCommand({
	data: new SlashCommandBuilder().setName("ping").setDescription(strings.command.description.ping),
	async execute(interaction) {
		const quotes = (
			await axios.get<Record<string, string[]>>(
				`https://raw.githubusercontent.com/Faithful-Resource-Pack/CompliBot-Commands/main/json/quotes.json`,
			)
		).data.ping;

		const quote = quotes[Math.floor(Math.random() * quotes.length)];
		// NEVER USE AWAIT ASYNC
		// only send response to maximize response time
		return interaction.reply({ content: "** **", withResponse: true }).then(({ resource }) => {
			const apiPing = interaction.client.ws.ping;
			const botPing = resource.message.createdTimestamp - interaction.createdTimestamp;

			const embed = new EmbedBuilder()
				.setTitle(strings.command.ping.title)
				.setDescription(`_${quote.replace("%YEAR%", String(new Date().getFullYear() + 2))}_`)
				.setColor(settings.colors.blue)
				.addFields(
					{ name: strings.command.ping.bot_field, value: `${botPing}ms`, inline: true },
					{ name: strings.command.ping.api_field, value: `${Math.round(apiPing)}ms`, inline: true },
				);

			return interaction.editReply({ embeds: [embed], components: addDeleteButton() });
		});
	},
});
