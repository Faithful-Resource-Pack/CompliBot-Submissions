import { defineEvent } from "@interfaces/discord";
import { feedbackBug, feedbackSuggestion } from "@functions/feedback";
import { submitModal } from "@submission/creation/submitTexture";
import { ModalSubmitInteraction } from "discord.js";

export default defineEvent({
	name: "modalSubmit",
	async execute(interaction) {
		switch (interaction.customId) {
			case "bugTicket": {
				return feedbackBug(interaction);
			}
			case "suggestionTicket": {
				return feedbackSuggestion(interaction);
			}
			case "submissionModal": {
				// disabled in dms so it's a guaranteed safe cast
				return submitModal(interaction as ModalSubmitInteraction<"cached">);
			}
		}
	},
});
