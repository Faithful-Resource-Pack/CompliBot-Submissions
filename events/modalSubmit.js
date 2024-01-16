const { feedbackBug, feedbackSuggestion } = require("@functions/feedback");

/** @type {import("@helpers/jsdoc").Event} */
module.exports = {
	name: "modalSubmit",
	/** @param {import("discord.js").ModalSubmitInteraction} interaction */
	async execute(interaction) {
		switch (interaction.customId) {
			case "bugTicket":
				return feedbackBug(interaction, "bug");
			case "suggestionTicket":
				return feedbackSuggestion(interaction, "suggestion");
		}
	},
};
