import {
	ChatInputCommandInteraction,
	Collection,
	ButtonInteraction,
	ModalSubmitInteraction,
	StringSelectMenuInteraction,
	SlashCommandOptionsOnlyBuilder,
	ClientEvents,
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

	interface ClientEvents {
		slashCommandUsed: [interaction: ChatInputCommandInteraction];
		buttonUsed: [interaction: ButtonInteraction];
		modalSubmit: [interaction: ModalSubmitInteraction];
		// no global select menu interaction, uses collectors instead
	}
}

export interface Command {
	// bot doesn't support subcommands so this is fine
	readonly data: SlashCommandOptionsOnlyBuilder;
	readonly execute: CommandExecute;
}

export type CommandExecute = (interaction: ChatInputCommandInteraction) => void;

export interface Event<E extends keyof ClientEvents> {
	readonly name: E;
	readonly execute: (...args: ClientEvents[E]) => void;
}

export type AnyInteraction =
	| ChatInputCommandInteraction
	| ButtonInteraction
	| ModalSubmitInteraction
	| StringSelectMenuInteraction;

/** Useful macros for type-safe exports */
export const defineCommand = (data: Command) => data;
export const defineEvent = <E extends keyof ClientEvents>(data: Event<E>) => data;
