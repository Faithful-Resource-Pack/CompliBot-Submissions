const prefix = process.env.PREFIX;

const strings = require('../../resources/strings.json')
const settings = require('../../resources/settings.json')

const { MessageEmbed } = require('discord.js')
const { warnUser } = require('../../helpers/warnUser');
const { modLog } = require('../../functions/moderation/modLog');
const { addMutedRole } = require('../../functions/moderation/addMutedRole');

module.exports = {
	name: 'mute',
	description: strings.command.description.mute,
	category: 'Moderation',
	guildOnly: true,
	uses: strings.command.use.mods,
	syntax: `${prefix}mute <@user> <time> <reason>`,
	example: `${prefix}mute @Domi#5813 3h posting memes in #general`,
	async execute(client, message, args) {
		if (!message.member.roles.cache.some(role => role.name.includes("Administrator") || role.name.includes("Moderator") || role.id === '747839021421428776')) return warnUser(message, strings.command.no_permission)
		if (!args.length) return warnUser(message, strings.command.args.none_given);

		let userID = undefined
		try {
			let member = message.mentions.member.first() || message.guild.members.cache.get(args[0])
			userID = member.id
		}
		catch (err) {
			userID = args[0].replace('<!@', '').replace('<@', '').replace('>', '')
		}

		if (userID.startsWith('!')) userID = userID.replace('!', '')

		const reason = args.slice(2).join(' ') || 'Not Specified'
		let time = args[1] || -100
		let timeOr = args[1] || -100
		let timeDur = 'undefined'

		if (typeof time === 'string') {
			if (time.includes('s') || time.includes('second')) {
				time = parseInt(time, 10)
				if (parseInt(timeOr, 10) == 1) timeDur = 'second'
				else timeDur = 'seconds'
			} else if (time.includes('min') || time.includes('minute')) {
				time = 60 * parseInt(time, 10)
				if (parseInt(timeOr, 10) == 1) timeDur = 'minute'
				else timeDur = 'minutes'
			} else if (time.includes('h') || time.includes('hour')) {
				time = 3600 * parseInt(time, 10)
				if (parseInt(timeOr, 10) == 1) timeDur = 'hour'
				else timeDur = 'hours'
			} else if (time.includes('d') || time.includes('day')) {
				time = 86400 * parseInt(time, 10)
				if (parseInt(timeOr, 10) == 1) timeDur = 'day'
				else timeDur = 'days'
			} else if (time.includes('w') || time.includes('week')) {
				time = 604800 * parseInt(time, 10)
				if (parseInt(timeOr, 10) == 1) timeDur = 'week'
				else timeDur = 'weeks'
			} else if (time.includes('m') || time.includes('month')) {
				time = 2592000 * parseInt(time, 10)
				if (parseInt(timeOr, 10) == 1) timeDur = 'month'
				else timeDur = 'months'
			} else if (time.includes('y') || time.includes('year')) {
				time = 31536000 * parseInt(time, 10)
				if (parseInt(timeOr, 10) == 1) timeDur = 'year'
				else timeDur = 'years'
			}
			else return await warnUser(message, strings.command.mute.invalid.time)
		}

		if (!userID) return await warnUser(message, strings.command.mute.specify_user)
		if (userID === message.author.id) return await warnUser(message, strings.command.mute.cant_mute_self)
		if (userID === client.user.id) return await message.channel.send({ content: strings.command.no_i_dont_think_i_will })

		if (isNaN(time)) return await warnUser(message, strings.command.specify_number)
		else {
			var timeout = undefined
			if (time < 0) timeout = 'Unlimited'
			else timeout = `${time}`

			addMutedRole(client, userID, time)

			var endsAt = new Date()
			endsAt.setSeconds(endsAt.getSeconds() + time)
			if (time < 0) endsAt = "Never"
			else endsAt = `${endsAt.getUTCDate()}/${endsAt.getUTCMonth() + 1}/${endsAt.getUTCFullYear()} ${endsAt.getUTCHours()}:${endsAt.getUTCMinutes()}:${endsAt.getUTCSeconds()} UTC`

			var embed = new MessageEmbed()
				.setAuthor(message.author.tag, message.author.displayAvatarURL())
				.setTitle(`Muted someone:`)
				.setDescription(`**User:** <@!${userID}>\n**Reason:** \`${reason}\`\n**Time:** \`${timeout != 'Unlimited' ? parseInt(timeOr, 10) + ` ${timeDur}` : 'Unlimited'}\`\n**Ends at:** \`${endsAt}\``)
				.setColor(settings.colors.black)
				.setTimestamp()

			await message.reply({ embeds: [embed] })

			modLog(client, message, userID, reason, `${parseInt(timeOr, 10)} ${timeDur}`, 'muted')
		}
	}
};