const prefix = process.env.PREFIX
const strings = require('../../resources/strings.json')

const { palette } = require('../../functions/textures/palette')
const { warnUser } = require('../../helpers/warnUser')

module.exports = {
	name: 'palette',
	aliases: ['p', 'colors', 'colormap', 'colours'],
	description: strings.command.description.palette,
	category: 'Minecraft',
	guildOnly: false,
	uses: strings.command.use.anyone,
	syntax: `${prefix}palette (Default: up to 10 images above)\n${prefix}palette (attach an image)\n${prefix}palette (reply to a message)\n${prefix}palette <Discord message url>\n${prefix}palette <image URL>\n${prefix}palette <message ID>\n${prefix}palette [up/^/last]`,
	async execute(client, message, args) {
		var DATA

		// <data>
		// image attached
		if ((args[0] == undefined || args[0] == '') && message.attachments.size > 0) {
			DATA = message.attachments.first().url;
			return palette(message, DATA);
		}

		// replying to message
		else if (message.reference) {
			message.channel.messages.fetch(message.reference.messageId).then(msg => {
				if (msg.attachments.size > 0) {
					DATA = msg.attachments.first().url;
					return palette(message, DATA);
				}
				else return warnUser(message, strings.command.image.no_reply_attachment);
			}).catch(error => {
				return warnUser(message, error);
			})
		}

		// previous image
		else if ((args[0] == undefined || args[0] == '' || args[0] == 'up' || args[0] == '^' || args[0] == 'last') && message.attachments.size == 0) {
			return PreviousImage();
		}

		// Discord message URL
		else if (args[0].startsWith('https://discord.com/channels')) {
			message.channel.messages.fetch(args[0].split('/').pop()).then(msg => {
				if (msg.attachments.size > 0) {
					DATA = msg.attachments.first().url;
					return palette(message, DATA);
				}
				else return warnUser(message, strings.command.image.not_attached.message);
			}).catch(() => {
				return warnUser(message, strings.command.url.same_channel_only)
			});
		}

		// Image URL
		else if (args[0].startsWith('https://') || args[0].startsWith('http://')) {
			if (args[0].endsWith('.png') || args[0].endsWith('.jpeg') || args[0].endsWith('.jpg') || args[0].endsWith('.gif')) {
				DATA = args[0];
				return palette(message, DATA);
			} else return warnUser(message, strings.command.image.invalid_extension)
		}

		// Discord message ID
		else if (!isNaN(args[0])) {
			message.channel.messages.fetch(args[0]).then(msg => {
				if (msg.attachments.size > 0) {
					DATA = msg.attachments.first().url;
					return palette(message, DATA);
				}
				else return warnUser(message, strings.command.image.not_attached.id);
			}).catch(error => {
				return warnUser(message, error);
			})
		}

		async function PreviousImage() {
			/**
			 * DO NOT DELETE THE COMMENTS IN THIS FUNCTION!
			 * Right now this function is using a workaround for something that was broken by discord.js v13 and may possibly work again in the future.
			 */

			var found = false;
			//var messages = [];
			var list_messages = await message.channel.messages.fetch({ limit: 10 });
			var lastMsg = list_messages.sort((a, b) => b.createdTimestamp - a.createdTimestamp).filter((m) => m.attachments.size > 0 || m.embeds[0] != undefined).first();
			//messages.push(...list_messages.array());

			//for (var i in messages) {
			//var msg = messages[i]
			var url = '';
			try {
				if (lastMsg.attachments.size > 0) {
					found = true;
					url = lastMsg.attachments.first().url;
					//break;
				}
				else if (lastMsg.embeds[0] != undefined && lastMsg.embeds[0] != null && lastMsg.embeds[0].image) {
					found = true;
					url = lastMsg.embeds[0].image.url;
					//break;
				}
				else if (lastMsg.content.startsWith('https://') || lastMsg.content.startsWith('http://')) {
					if (lastMsg.content.endsWith('.png') || lastMsg.content.endsWith('.jpeg') || lastMsg.content.endsWith('.jpg') || lastMsg.content.endsWith('.gif')) {
						found = true;
						url = lastMsg.content;
						//break;
					}
				}
			} catch (e) {
				return warnUser(message, strings.command.image.not_found_in_10_last)
			}
			//}

			if (found) await palette(message, url);
			else return warnUser(message, strings.command.image.not_found_in_10_last)
		}
	}
}