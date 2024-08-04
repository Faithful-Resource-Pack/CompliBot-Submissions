import {
	ChatInputCommandInteraction,
	Collection,
	SlashCommandBuilder,
	ButtonInteraction,
	ModalSubmitInteraction,
	StringSelectMenuInteraction,
} from "discord.js";

declare module "discord.js" {
	interface EmbedBuilder {
		// loading from JSON has issues with being resolvable by discord.js
		setColor(color: string | ColorResolvable | null): this;
	}

	interface Client {
		// commands are loaded directly onto the client object
		commands: Collection<string, Command>;
	}
}

export interface Command {
	data: SlashCommandBuilder;
	execute: CommandExecute;
}

export type CommandExecute = (interaction: ChatInputCommandInteraction) => any;

export interface Event {
	name: string;
	once?: boolean;
	execute: () => any;
}

export type AnyInteraction =
	| ChatInputCommandInteraction
	| ButtonInteraction
	| ModalSubmitInteraction
	| StringSelectMenuInteraction;
