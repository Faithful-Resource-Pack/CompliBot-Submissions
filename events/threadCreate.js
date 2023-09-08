module.exports = {
	name: "threadCreate",
	/** @param {import("discord.js").ThreadChannel} thread */
	async execute(thread) {
		// automatically join created thread
		if (thread.joinable) await thread.join();
	},
};
