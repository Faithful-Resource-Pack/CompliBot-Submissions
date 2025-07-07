import { ActionRow, ActionRowBuilder, ButtonBuilder, ComponentType, Message } from "discord.js";
import { deleteButton } from "@helpers/interactions";

/**
 * Add delete button to bot message
 * @author Evorp
 * @param message message sent by bot
 */
export default async function addDeleteButton(message: Message) {
	// djs v14.19 workaround
	const actionRow = message.components.at(-1) as ActionRow<any>;
	if (
		message.components[0] != undefined &&
		actionRow.components.length < 5 && // check there aren't 5 buttons
		actionRow.components[0].type === ComponentType.Button // checks there isn't a select menu
	) {
		const deleteRow = ActionRowBuilder.from<ButtonBuilder>(actionRow).addComponents(deleteButton);

		return message.edit({
			components: [...message.components.slice(0, -1), deleteRow],
		});
	}
	return message.edit({
		components: [
			...message.components,
			new ActionRowBuilder<ButtonBuilder>().addComponents(deleteButton),
		],
	});
}
