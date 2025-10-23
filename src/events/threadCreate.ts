import type { Event } from "@interfaces/discord";
import { ThreadChannel } from "discord.js";

export default {
	name: "threadCreate",
	async execute(thread: ThreadChannel) {
		// automatically join created thread
		if (thread.joinable) await thread.join();
	},
} as Event;
