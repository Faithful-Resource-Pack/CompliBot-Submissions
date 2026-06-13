import settings from "@resources/settings.json";

import type { Pack, PackFile } from "@interfaces/database";
import { SubmissionStatus, type TextureSubmission } from "@interfaces/submission";

import { type Message, type Embed } from "discord.js";

// +1 for bot's own reaction
export const DEFAULT_REACTION_COUNT = 1;

/**
 * Concrete implementation of a TextureSubmission for use with Discord
 */
export default class DiscordTextureSubmission implements TextureSubmission {
	public readonly id: number;
	public readonly description: string;
	public readonly authors: string[];
	public readonly date: Date;
	public readonly status: SubmissionStatus;
	public readonly imageURL: string;
	public readonly votes: {
		readonly upvotes: number;
		readonly downvotes: number;
	};
	public readonly pack: Pack;

	// useful to hold onto private message reference (can use client internally)
	private readonly message: Message<true>;

	// unsafe constructor (doesn't check if message is actually a submission)
	private constructor(message: Message<true>) {
		const embed = message.embeds[0];
		const reactions = message.reactions.cache;

		this.id = Number(embed.title?.match(/(?<=\[#)(\d+)(?=\])/)?.[0]);
		this.description = embed.description;
		this.authors = embed.fields[0].value
			.split("\n")
			.map((author) => author.match(/\d+/g)?.[0] || "");
		this.date = new Date(message.createdTimestamp);
		this.status = getMessageStatus(embed);
		this.imageURL = embed.thumbnail.url;
		this.pack = getPackByChannel(message.channel.id);
		this.votes = {
			upvotes: reactions.get(settings.emojis.upvote)?.count ?? DEFAULT_REACTION_COUNT,
			downvotes: reactions.get(settings.emojis.downvote)?.count ?? DEFAULT_REACTION_COUNT,
		};
		this.message = message;
	}

	// returning false forces the caller to handle the fail case even without strict mode
	public static from(message: Message<true>): TextureSubmission | false {
		return isSubmissionMessage(message) ? new DiscordTextureSubmission(message) : false;
	}

	public isFromDate(otherDate: Date): boolean {
		return (
			this.date.getDate() === otherDate.getDate() &&
			this.date.getMonth() === otherDate.getMonth() &&
			this.date.getFullYear() === otherDate.getFullYear()
		);
	}
}

export function isSubmissionMessage(message: Message<true>): boolean {
	if (!message || !message.embeds.length || !message.embeds[0].title) return false;

	// needs to match [#<TEXTURE ID>]
	if (!message.embeds[0].title.match(/(?<=\[#)(\d+)(?=\])/).length) return false;

	// field needs to match the right pattern
	if (getMessageStatus(message.embeds[0]) === SubmissionStatus.Unknown) return false;
	return true;
}

/**
 * Get the status of a submission embed
 * @author Evorp
 * @param embed embed to read
 * @returns embed status as an enum variant
 */
export function getMessageStatus(embed: Embed): SubmissionStatus {
	// there's probably a better way to do this but it's easy to change later
	const statusField = embed.fields[1].value;
	if (statusField.includes(settings.emojis.pending)) return SubmissionStatus.Pending;
	if (statusField.includes(settings.emojis.upvote)) return SubmissionStatus.Approved;
	if (statusField.includes(settings.emojis.downvote)) return SubmissionStatus.Denied;
	if (statusField.includes(settings.emojis.instapass)) return SubmissionStatus.Instapassed;
	if (statusField.includes(settings.emojis.invalid)) return SubmissionStatus.Invalidated;
	return SubmissionStatus.Unknown;
}

/**
 * Get the corresponding pack data for a given submission channel ID
 * @author Evorp
 * @param channelID channel id to test
 * @returns pack object
 */
export function getPackByChannel(channelID: string): Pack {
	const packs: PackFile = require("@resources/packs.json");

	// even though the code is really simple it's used literally everywhere
	return Object.values(packs).find((pack) =>
		Object.values(pack.submission.channels).includes(channelID),
	);
}
