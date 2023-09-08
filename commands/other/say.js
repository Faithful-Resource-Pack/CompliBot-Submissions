const strings = require("@resources/strings.json");

const warnUser = require("@helpers/warnUser");

module.exports = {
	name: "say",
	guildOnly: true,
	async execute(client, message, args) {
		if (!process.env.DEVELOPERS.includes(message.author.id)) return;
		if (!args.length) return warnUser(message, strings.command.args.none_given);

		// remove first "word" which is the command
		const content = message.content.substring(message.content.indexOf(" ") + 1);

		if (message.attachments.size)
			await message.channel.send({
				content,
				files: [message.attachments.values().map((attachment) => attachment.url)],
			});
		else await message.channel.send({ content });

		await message.delete().catch();
	},
};
