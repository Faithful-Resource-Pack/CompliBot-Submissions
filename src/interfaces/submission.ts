import type { Pack } from "@interfaces/database";

/** Every type a texture submission can have */
export enum SubmissionStatus {
	Unknown,
	Pending,
	Approved,
	Denied,
	Instapassed,
	Invalidated,
}

/**
 * Immutable representation of a single texture submission and its associated information
 */
export interface TextureSubmission {
	/** Texture ID of the submission */
	readonly id: number;
	/** Submission description */
	readonly description: string;
	/** IDs of the texture authors */
	readonly authors: string[];
	/** Date of the texture submission */
	readonly date: Date;
	/** Status of the submission */
	readonly status: SubmissionStatus;
	/** Submitted image URL */
	readonly imageURL: string;
	/** Current votes for the texture */
	readonly votes: {
		readonly upvotes: number;
		readonly downvotes: number;
	};
	/** The pack the texture is meant for */
	readonly pack: Pack;

	/**
	 * Check whether a submission is from the correct date
	 * @param date Date object to check
	 * @returns Whether the submission is from the provided daee
	 */
	isFromDate(date: Date): boolean;
}
