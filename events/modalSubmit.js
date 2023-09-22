const settings = require("@resources/settings.json");
const strings = require("@resources/strings.json");

const { feedbackBug, feedbackSuggestion } = require("@functions/feedback");

/** @type {import("@helpers/jsdoc").Event} */
module.exports = {
	name: "modalSubmit",
	/** @param {import("discord.js").ModalSubmitInteraction} interaction */
	async execute(interaction) {
		switch (interaction.customId) {
			case "bugTicket":
				return await feedbackBug(interaction, "bug");
			case "suggestionTicket":
				return await feedbackSuggestion(interaction, "suggestion");
		}
	},
};
