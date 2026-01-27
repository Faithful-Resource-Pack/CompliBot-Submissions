import {
	ActionRowBuilder,
	AnyComponentBuilder,
	ButtonBuilder,
	ComponentType,
	MessageActionRowComponentBuilder,
} from "discord.js";
import { deleteButton } from "@helpers/interactions";

/**
 * Add delete button to message components
 * @author Evorp
 * @param components message components to add delete button to
 */
export default function addDeleteButton(
	components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [],
): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
	if (components.length >= 5) return components;

	const lastRow = components.at(-1);
	const canAppend =
		lastRow !== undefined && // there is at least one existing row
		lastRow.components.length < 5 && // check there aren't 5 buttons already
		lastRow.components[0].data.type === ComponentType.Button; // not a select menu or something

	if (canAppend)
		return [
			...components.slice(0, -1),
			ActionRowBuilder.from<MessageActionRowComponentBuilder>(lastRow).addComponents(deleteButton),
		];

	// if there's no existing buttons it spreads an empty array so it works fine
	return [...components, new ActionRowBuilder<ButtonBuilder>().addComponents(deleteButton)];
}
