const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const { EmbedBuilder } = require("discord.js");
const { Octokit } = require("@octokit/rest");

/**
 * Create a bug report on GitHub with modal information
 * @author Evorp
 * @param {import("discord.js").ModalSubmitInteraction} interaction
 */
async function feedbackBug(interaction) {
	await interaction.reply({
		embeds: [
			new EmbedBuilder()
				.setTitle("Bug report received!")
				.setDescription(strings.command.feedback_sent)
				.setColor(settings.colors.blue),
		],
	});

	// I know there's a lot of copy/paste but this is the best djs can do
	const title = `[Bug] ${interaction.fields.getTextInputValue("bugTitle")}`;
	const whatHappened = interaction.fields.getTextInputValue("bugWhatHappened");
	const toReproduce = interaction.fields.getTextInputValue("bugToReproduce");
	const notes = interaction.fields.getTextInputValue("bugNotes");

	const description =
		`### What happened?\n\n${whatHappened}\n\n` +
		`### To reproduce\n\n${toReproduce}\n\n` +
		`### Notes\n\n${notes || "*No response*"}`;

	return feedbackSend(interaction, title, description);
}

/**
 * Create a feature request on GitHub with modal information
 * @author Evorp
 * @param {import("discord.js").ModalSubmitInteraction} interaction
 */
async function feedbackSuggestion(interaction) {
	await interaction.reply({
		embeds: [
			new EmbedBuilder()
				.setTitle("Feature request received!")
				.setDescription(strings.command.feedback_sent)
				.setColor(settings.colors.blue),
		],
	});

	const title = `[Feature] ${interaction.fields.getTextInputValue("suggestionTitle")}`;
	const isProblem = interaction.fields.getTextInputValue("suggestionIsProblem");
	const describe = interaction.fields.getTextInputValue("suggestionDescription");
	const notes = interaction.fields.getTextInputValue("suggestionNotes");

	const description =
		`### Is your feature request related to a problem?\n\n${isProblem || "*No response*"}\n\n` +
		`### Describe the feature you'd like\n\n${describe}\n\n` +
		`### Notes\n\n${notes || "*No response*"}\n\n`;

	return feedbackSend(interaction, title, description);
}

/**
 * Create GitHub issue with specified title and description
 * @author Evorp
 * @param {import("discord.js").ModalSubmitInteraction} interaction
 * @param {string} title
 * @param {string} description
 */
async function feedbackSend(interaction, title, description) {
	try {
		const octokit = new Octokit({
			auth: process.env.GIT_TOKEN,
		});

		octokit.issues.create({
			owner: "Faithful-Resource-Pack",
			repo: "CompliBot-Submissions",
			title,
			body: `*Issue originally created by \`${interaction.user.displayName}\` on Discord*\n\n${description}`,
		});
	} catch (err) {
		interaction.followUp({
			embeds: [
				new EmbedBuilder()
					.setTitle("Feedback could not be sent!")
					.setDescription(`Error for the developers: \`\`\`${err}\`\`\``)
					.setColor(settings.colors.red),
			],
		});
	}
}

module.exports = {
	feedbackBug,
	feedbackSuggestion,
	feedbackSend,
};
