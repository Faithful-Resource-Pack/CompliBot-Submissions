import { ActionRowBuilder, ButtonBuilder, ComponentType, Message } from "discord.js";
import { deleteButton } from "@helpers/interactions";

/**
 * Add delete button to bot message
 * @author Evorp
 * @param message message sent by bot
 */
export default async function addDeleteButton(message: Message) {
	if (
		message.components[0] != undefined &&
		message.components.at(-1).components.length < 5 && // check there aren't 5 buttons
		message.components.at(-1).components[0].type === ComponentType.Button // checks there isn't a select menu
	) {
		// typed as any since we know it's a button row but discord.js doesn't
		const deleteRow = ActionRowBuilder.from<ButtonBuilder>(
			message.components.at(-1) as any,
		).addComponents(deleteButton);

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
