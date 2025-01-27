import settings from "@resources/settings.json";
import strings from "@resources/strings.json";

import addDeleteButton from "@helpers/addDeleteButton";

import axios from "axios";
import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { Command } from "@interfaces/discord";

export default {
	data: new SlashCommandBuilder().setName("ping").setDescription(strings.command.description.ping),
	async execute(interaction) {
		const quotes: string[] = (
			await axios.get(
				`https://raw.githubusercontent.com/Faithful-Resource-Pack/CompliBot/main/json/quotes.json`,
			)
		).data.ping;

		const quote = quotes[Math.floor(Math.random() * quotes.length)];
		// NEVER USE AWAIT ASYNC
		// only send response to maximize response time
		return interaction
			.reply({ content: "** **", withResponse: true })
			.then(({ resource }) => {
				const apiPing = interaction.client.ws.ping;
				const botPing = resource.message.createdTimestamp - interaction.createdTimestamp;

				const embed = new EmbedBuilder()
					.setTitle("Pong!")
					.setDescription(`_${quote.replace("%YEAR%", String(new Date().getFullYear() + 2))}_`)
					.setColor(settings.colors.blue)
					.addFields(
						{ name: "Bot Latency", value: `${botPing}ms`, inline: true },
						{ name: "API Latency", value: `${Math.round(apiPing)}ms`, inline: true },
					);

				return interaction.editReply({ embeds: [embed] });
			})
			.then(addDeleteButton);
	},
} as Command;
