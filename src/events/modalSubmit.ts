import { defineEvent } from "@interfaces/discord";
import { feedbackBug, feedbackSuggestion } from "@functions/feedback";

export default defineEvent({
	name: "modalSubmit",
	async execute(interaction) {
		switch (interaction.customId) {
			case "bugTicket":
				return feedbackBug(interaction);
			case "suggestionTicket":
				return feedbackSuggestion(interaction);
		}
	},
});
