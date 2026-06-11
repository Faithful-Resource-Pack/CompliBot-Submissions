import settings from "@resources/settings.json";
import { Embed, Message, TextChannel } from "discord.js";
import getPackByChannel from "./discord/getPackByChannel";
import { Pack } from "@interfaces/database";

// +1 for bot's own reaction
export const DEFAULT_REACTION_COUNT = 1;

export enum SubmissionStatus {
	Pending,
	Approved,
	Denied,
	Instapassed,
	Invalidated,
	Unknown,
}

export interface TextureSubmission {
	id: number;
	authors: string[];
	date: Date;
	status: SubmissionStatus;
	imageURL: string;
	votes: {
		upvotes: number;
		downvotes: number;
	};
	pack: Pack;

	isFromDate(date: Date): boolean;
}

export class DiscordTextureSubmission implements TextureSubmission {
	public id: number;
	public authors: string[];
	public date: Date;
	public status: SubmissionStatus;
	public imageURL: string;
	public votes: {
		upvotes: number;
		downvotes: number;
	};
	public pack: Pack;

	// useful to hold onto private message reference
	private _message: Message<true>;

	// unsafe constructor (doesn't check if message is actually a message)
	private constructor(message: Message<true>) {
		const embed = message.embeds[0];
		const reactions = message.reactions.cache;

		this.id = Number(message.embeds[0].title?.match(/(?<=\[#)(\d+)(?=\])/)?.[0]);
		this.authors = embed.fields[0].value
			.split("\n")
			.map((author) => author.match(/\d+/g)?.[0] || "");
		this.date = new Date(message.createdTimestamp);
		this.status = DiscordTextureSubmission.getMessageStatus(embed);
		this.imageURL = embed.thumbnail.url;
		this.pack = getPackByChannel(message.channel.id);
		this.votes = {
			upvotes: reactions.get(settings.emojis.upvote)?.count ?? DEFAULT_REACTION_COUNT,
			downvotes: reactions.get(settings.emojis.downvote)?.count ?? DEFAULT_REACTION_COUNT,
		};
		this._message = message;
	}

	// returning false forces the caller to handle the fail case even without strict mode
	public static from(message: Message<true>): TextureSubmission | false {
		if (!DiscordTextureSubmission.isSubmissionMessage(message)) return false;
		return new DiscordTextureSubmission(message);
	}

	public static isSubmissionMessage(message: Message<true>): boolean {
		if (!message) return false;
		if (!message.embeds.length) return false;
		if (!message.embeds[0].title) return false;
		if (!message.embeds[0].title.match(/(?<=\[#)(\d+)(?=\])/).length) return false;
		return true;
	}

	public isFromDate(otherDate: Date) {
		return (
			this.date.getDate() === otherDate.getDate() &&
			this.date.getMonth() === otherDate.getMonth() &&
			this.date.getFullYear() === otherDate.getFullYear()
		);
	}

	private static getMessageStatus(embed: Embed): SubmissionStatus {
		const statusField = embed.fields[1].value;
		if (statusField.includes(settings.emojis.pending)) return SubmissionStatus.Pending;
		if (statusField.includes(settings.emojis.upvote)) return SubmissionStatus.Approved;
		if (statusField.includes(settings.emojis.downvote)) return SubmissionStatus.Denied;
		if (statusField.includes(settings.emojis.instapass)) return SubmissionStatus.Instapassed;
		if (statusField.includes(settings.emojis.invalid)) return SubmissionStatus.Invalidated;
		return SubmissionStatus.Unknown;
	}
}
