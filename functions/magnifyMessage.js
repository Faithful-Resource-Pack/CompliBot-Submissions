const strings = require("@resources/strings.json");

const warnUser = require("@helpers/warnUser");
const { magnify } = require("@images/magnify");

/**
 * Magnify based off a message prompt
 * @param {import("discord.js").Message} message
 */
module.exports = async function magnifyMessage(message) {
	// this was originally a prefix command but got migrated here so we need to translate the data over
	const args = message.content.toLowerCase().split(" ").slice(1);

	let data;

	// image attached
	if ((args[0] == undefined || args[0] == "") && message.attachments.size > 0) {
		data = message.attachments.first().url;
		return magnify(message, data);
	}

	// replying to message
	if (message.reference) {
		message.channel.messages
			.fetch(message.reference.messageId)
			.then((msg) => {
				if (msg.attachments.size > 0) {
					data = msg.attachments.first().url;
					return magnify(message, data);
				} else return warnUser(message, strings.command.image.no_reply_attachment);
			})
			.catch((error) => {
				return warnUser(message, error);
			});
	}

	// previous image
	if (
		(args[0] == undefined ||
			args[0] == "" ||
			args[0] == "up" ||
			args[0] == "^" ||
			args[0] == "last") &&
		message.attachments.size == 0
	) {
		return previousImage(message);
	}

	// Discord message URL
	else if (args[0].startsWith("https://discord.com/channels")) {
		message.channel.messages
			.fetch(args[0].split("/").pop())
			.then((msg) => {
				if (msg.attachments.size > 0) {
					data = msg.attachments.first().url;
					return magnify(message, data);
				} else return warnUser(message, strings.command.image.not_attached.message);
			})
			.catch(() => {
				return warnUser(message, strings.command.image.url);
			});
	}

	// Image URL
	else if (args[0].startsWith("https://") || args[0].startsWith("http://")) {
		if (
			args[0].endsWith(".png") ||
			args[0].endsWith(".jpeg") ||
			args[0].endsWith(".jpg") ||
			args[0].endsWith(".gif")
		) {
			data = args[0];
			return magnify(message, data);
		} else return warnUser(message, strings.command.image.invalid_extension);
	}

	// Discord message ID
	else if (!isNaN(args[0])) {
		message.channel.messages
			.fetch(args[0])
			.then((msg) => {
				if (msg.attachments.size > 0) {
					data = msg.attachments.first().url;
					return magnify(message, data);
				} else return warnUser(message, strings.command.image.not_attached.id);
			})
			.catch((error) => {
				return warnUser(message, error);
			});
	}
};

async function previousImage(message) {
	let found = false;
	let list_messages = await message.channel.messages.fetch({ limit: 10 });
	let lastMsg = list_messages
		.sort((a, b) => b.createdTimestamp - a.createdTimestamp)
		.filter((m) => m.attachments.size > 0 || m.embeds[0] != undefined)
		.first();

	let url = "";
	try {
		if (lastMsg.attachments.size > 0) {
			found = true;
			url = lastMsg.attachments.first().url;
		} else if (
			lastMsg.embeds[0] != undefined &&
			lastMsg.embeds[0] != null &&
			lastMsg.embeds[0].image
		) {
			found = true;
			url = lastMsg.embeds[0].image.url;
		} else if (lastMsg.content.startsWith("https://") || lastMsg.content.startsWith("http://")) {
			if (
				lastMsg.content.endsWith(".png") ||
				lastMsg.content.endsWith(".jpeg") ||
				lastMsg.content.endsWith(".jpg") ||
				lastMsg.content.endsWith(".gif")
			) {
				found = true;
				url = lastMsg.content;
			}
		}
	} catch {
		return warnUser(message, strings.command.image.not_found_in_10_last);
	}

	if (found) await magnify(message, url);
	else return warnUser(message, strings.command.image.not_found_in_10_last);
}
