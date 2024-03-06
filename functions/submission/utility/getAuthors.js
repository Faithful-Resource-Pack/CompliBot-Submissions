const axios = require("axios").default;

/**
 * Detects co-authors from pings and curly bracket syntax in a given message
 * @author Evorp
 * @param {import("discord.js").Message} message
 * @returns {Promise<string[]>} array of author's discord IDs
 */
module.exports = async function getAuthors(message) {
	const authors = [message.author.id];

	// detect text between curly brackets
	const names = message.content
		.match(/(?<=\{)(.*?)(?=\})/g)
		?.map((name) => name.toLowerCase().trim());

	if (names?.length) {
		/** @type {import("@helpers/jsdoc").User[]} filter contributors that match regex */
		const users = (await axios.get(`${process.env.API_URL}users/names`)).data;
		for (const user of users)
			if (names.includes(user.username?.toLowerCase()) && !authors.includes(user.id))
				authors.push(user.id);
	}

	// detect by ping (using regex to ensure users not in the server get included)
	const mentions = message.content.match(/(?<=\<\@|\<\@\!)(\d*?)(?=\>)/g) ?? [];
	for (const mention of mentions) if (!authors.includes(mention)) authors.push(mention);

	return authors;
};
