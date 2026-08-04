import { defineEvent } from "@interfaces/discord";
import { ThreadChannel } from "discord.js";

export default defineEvent({
	name: "threadCreate",
	async execute(thread: ThreadChannel) {
		// automatically join created thread
		if (thread.joinable) await thread.join();
	},
});
