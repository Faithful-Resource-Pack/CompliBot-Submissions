import type { User } from "@interfaces/database";
import axios from "axios";
import { Message } from "discord.js";

/**
 * Detects co-authors from pings and curly bracket syntax in a given message
 * @author Evorp
 * @param message message to detect co-authors from
 * @returns array of author's discord IDs
 */
export default async function getAuthors(message: Message) {
	const authors = [message.author.id];

	// detect text between curly brackets
	const names = message.content
		.match(/(?<=\{)(.*?)(?=\})/g)
		?.map((name) => name.toLowerCase().trim());

	if (names?.length) {
		const users: User[] = (await axios.get(`${process.env.API_URL}users/names`)).data;
		for (const user of users)
			if (names.includes(user.username?.toLowerCase()) && !authors.includes(user.id))
				authors.push(user.id);
	}

	// detect by ping (using regex to ensure users not in the server get included)
	const mentions = message.content.match(/(?<=<@|<@!)(\d*?)(?=>)/g) ?? [];
	for (const mention of mentions) if (!authors.includes(mention)) authors.push(mention);

	return authors;
}
