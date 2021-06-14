const Canvas   = require('canvas')
const Discord  = require('discord.js')
const settings = require('../../ressources/settings')

const { addDeleteReact } = require('../../helpers/addDeleteReact')
const { getMeta }  = require('../../helpers/getMeta')
const { warnUser } = require('../../helpers/warnUser')

/**
 * Magnify image
 * @author Juknum
 * @param {DiscordMessage} message 
 * @param {String} url Image URL
 * @param {DiscordUserID} gotocomplichannel if set, the message is send to the corresponding #complibot
 * @returns Send a message with the magnified image
 */
function magnify(message, url, gotocomplichannel = undefined) {

	let complichannel
	if (gotocomplichannel) {
		if (message.guild.id == settings.C32_ID) complichannel = message.guild.channels.cache.get(settings.C32_COMPLICHANNEL) // C32x discord
		if (message.guild.id == settings.C64_ID) complichannel = message.guild.channels.cache.get(settings.C64_COMPLICHANNEL) // C64x discord
	}

	getMeta(url).then(async function(dimension) {
		var sizeOrigin = dimension.width * dimension.height
		var factor     = 64

		if (sizeOrigin == 256)   factor = 32
		if (sizeOrigin > 256)    factor = 16
		if (sizeOrigin > 1024)   factor = 8
		if (sizeOrigin > 4096)   factor = 4
		if (sizeOrigin > 65636)  factor = 2
		if (sizeOrigin > 262144) return warnUser(message, 'The input picture is too big!')

		var canvasStart = Canvas.createCanvas(dimension.width, dimension.height).getContext('2d')
		var canvasResult = Canvas.createCanvas(dimension.width * factor, dimension.height * factor)
		var canvasResultCTX = canvasResult.getContext('2d')

		const temp = await Canvas.loadImage(url)
		canvasStart.drawImage(temp, 0, 0)

		var image = canvasStart.getImageData(0, 0, dimension.width, dimension.height).data

		let index, r, g, b, a

		for (var x = 0; x < dimension.width; x++) {
			for (var y = 0; y < dimension.height; y++) {
				index = (y * dimension.width + x) * 4
				r = image[index];
				g = image[index + 1]
				b = image[index + 2]
				a = image[index + 3] / 255
				canvasResultCTX.fillStyle = `rgba(${r},${g},${b},${a})`
				canvasResultCTX.fillRect(x * factor, y * factor, factor, factor)
			}
		}

		const attachment = new Discord.MessageAttachment(canvasResult.toBuffer(), 'magnified.png');

		let embedMessage
		if (gotocomplichannel) {
			try {
				const member = await message.guild.members.cache.get(gotocomplichannel)
				embedMessage = await member.send(attachment);
			} catch(e) {
				embedMessage = await complichannel.send(`<@!${gotocomplichannel}>`, attachment);
			}
		}
		else embedMessage = await message.inlineReply(attachment);
		addDeleteReact(embedMessage, message, true)

		return attachment;
	});
}

exports.magnify = magnify;