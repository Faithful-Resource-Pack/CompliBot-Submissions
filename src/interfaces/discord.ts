import {
	ChatInputCommandInteraction,
	Collection,
	ButtonInteraction,
	ModalSubmitInteraction,
	StringSelectMenuInteraction,
	SlashCommandOptionsOnlyBuilder,
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
	// bot doesn't support subcommands so this is fine
	readonly data: SlashCommandOptionsOnlyBuilder;
	readonly execute: CommandExecute;
}

export type CommandExecute = (interaction: ChatInputCommandInteraction) => void;

export interface Event {
	readonly name: string;
	readonly once?: boolean;
	readonly execute: (...args: any[]) => void;
}

export type AnyInteraction =
	| ChatInputCommandInteraction
	| ButtonInteraction
	| ModalSubmitInteraction
	| StringSelectMenuInteraction;

/** Useful macros for type-safe exports */
export const defineCommand = (data: Command) => data;
export const defineEvent = (data: Event) => data;
