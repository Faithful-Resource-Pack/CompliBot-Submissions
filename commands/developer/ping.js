const addDeleteButton = require("@helpers/addDeleteButton");
const settings = require("@resources/settings.json");
const { default: axios } = require("axios");

const { MessageEmbed } = require("discord.js");

/** @type {import("@helpers/jsdoc").Command} */
module.exports = {
	name: "ping",
	aliases: ["r"],
	guildOnly: false,
	async execute(client, message, args) {
		const quotes = (
			await axios.get(
				`https://raw.githubusercontent.com/Faithful-Resource-Pack/CompliBot/main/lang/en-US/commands.json`,
			)
		).data["Command.Ping.Quotes"];

		const quote = quotes[Math.floor(Math.random() * quotes.length)];
		// NEVER USE AWAIT ASYNC
		// only send response to maximize response time
		return message.channel
			.send("** **")
			.then((msg) => {
				const apiPing = client.ws.ping;
				const botPing = msg.createdTimestamp - message.createdTimestamp;

				const embed = new MessageEmbed().setTitle("Pong!").setColor(settings.colors.blue)
					.setDescription(`_${quote.replace("%YEAR%", new Date().getFullYear() + 2)}_
### Bot Latency:
${botPing}ms
### API Latency:
${Math.round(apiPing)}ms
`);

				return Promise.all([msg.delete(), message.reply({ embeds: [embed] })]);
			})
			.then((results) => {
				const m = results[1];
				addDeleteButton(m);
			});
	},
};
