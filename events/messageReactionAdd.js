const client = require('../index').Client
const DEV = (process.env.DEV.toLowerCase() == 'true')
const DEV_REACTION = (process.env.DEV_REACTION || false) == 'true'
const settings = require('../resources/settings.json')

const { editSubmission } = require('../functions/textures/submission/editSubmission')

module.exports = {
    name: "messageReactionAdd",
    async execute(reaction, user) {
        if (DEV) return;
        if (user.bot) return;
        if (reaction.message.partial) await reaction.message.fetch(); // dark magic to fetch message that are sent before the start of the bot

        // TEXTURE SUBMISSIONS
        for (let i in settings.submission) {
            if (
                Object.values(settings.submission[i].channels).includes(reaction.message.channel.id)
            ) {
                editSubmission(client, reaction, user);
                break;
            }
        }
    },
};