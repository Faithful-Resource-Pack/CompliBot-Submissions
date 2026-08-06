import { defineEvent } from "@interfaces/discord";

export default defineEvent({
	name: "threadCreate",
	async execute(thread) {
		// automatically join created thread
		if (thread.joinable) await thread.join();
	},
});
