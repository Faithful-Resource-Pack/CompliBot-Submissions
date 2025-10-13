export type MinecraftEdition = "java" | "bedrock";

export interface Path {
	id?: string;
	use: string;
	name: string;
	mcmeta: boolean;
	versions: string[];
}

export interface Use {
	id: string;
	name: string;
	texture: number;
	edition: MinecraftEdition;
}

export interface Contribution {
	// id not there when posting contribution
	id?: string;
	date: number;
	texture: string;
	pack: string;
	authors: string[];
}

export interface Texture {
	id: string;
	name: string;
	tags: string[];
	uses: Use[];
	paths: Path[];
	contributions: Contribution[];
	mcmeta?: MCMETA;
}

export interface User {
	id: string;
	username?: string;
	uuid?: string;
	roles?: string[];
	media?: string[];
	anonymous?: boolean;
}

export interface MCMETA {
	animation?: Partial<{
		frametime: number;
		interpolate: boolean;
		frames: (number | { index?: number; time?: number })[];
		height: number;
		width: number;
	}>;
}

export interface Pack {
	id: string;
	name: string;
	tags: string[];
	logo: string;
	resolution: number;
	github: Record<MinecraftEdition, { org: string; repo: string }>;
	submission: Submission;
}

export interface Submission {
	id: string;
	reference: string;
	channels: SubmissionChannels;
	time_to_results: number;
	contributor_role?: string;
}

export interface SubmissionChannels {
	submit: string;
	results: string;
}

export type PackFile = Record<string, Pack>;
