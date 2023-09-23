const { ActionRowBuilder, ComponentType } = require("discord.js");
const { deleteButton } = require("@helpers/interactions");

/**
 * Add delete button to bot message
 * @author Evorp
 * @param {import("discord.js").Message} message message sent by bot
 */
module.exports = async function addDeleteButton(message) {
	if (
		message.components[0] != undefined &&
		message.components.at(-1).components.length < 5 && //check there aren't 5 buttons
		message.components.at(-1).components[0].type === ComponentType.Button //checks there isn't a select menu
	) {
		const deleteRow = ActionRowBuilder.from(message.components.at(-1)).addComponents(deleteButton);
		return message.edit({
			components: [...message.components.slice(0, -1), deleteRow],
		});
	}
	return message.edit({
		components: [...message.components, new ActionRowBuilder().addComponents(deleteButton)],
	});
};
