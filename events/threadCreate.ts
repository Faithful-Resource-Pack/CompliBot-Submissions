import { ThreadChannel } from "discord.js";
import type { Event } from "@interfaces/discord";

export default {
	name: "threadCreate",
	async execute(thread: ThreadChannel) {
		// automatically join created thread
		if (thread.joinable) await thread.join();
	},
} as Event;
