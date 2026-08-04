import { defineEvent } from "@interfaces/discord";
import { feedbackBug, feedbackSuggestion } from "@functions/feedback";

import { ModalSubmitInteraction } from "discord.js";

export default defineEvent({
	name: "modalSubmit",
	async execute(interaction: ModalSubmitInteraction) {
		switch (interaction.customId) {
			case "bugTicket":
				return feedbackBug(interaction);
			case "suggestionTicket":
				return feedbackSuggestion(interaction);
		}
	},
});
