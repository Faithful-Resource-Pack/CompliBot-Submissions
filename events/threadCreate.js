/** @type {import("@helpers/jsdoc").Event} */
module.exports = {
	name: "threadCreate",
	/**
	 * @param {import("discord.js").Client} client
	 * @param {import("discord.js").ThreadChannel} thread
	 */
	async execute(client, thread) {
		// automatically join created thread
		if (thread.joinable) await thread.join();
	},
};
