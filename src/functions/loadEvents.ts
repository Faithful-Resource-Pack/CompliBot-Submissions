import { join } from "path";

import type { Event } from "@interfaces/discord";
import walkSync from "@helpers/walkSync";

import { Client, ClientEvents } from "discord.js";

/**
 * Load bot events and register them to the client object
 * @author Evorp
 * @param client client to load events to
 */
export default async function loadEvents(client: Client<boolean>) {
	// use async to prevent walkSync blocking
	const eventPaths = walkSync(join(__dirname, "..", "events")).filter((f) => f.endsWith(".ts"));
	return Promise.all(
		eventPaths.map(async (file) => {
			const event = await import(file).then<Event<keyof ClientEvents>>(({ default: ev }) => ev);

			// catch invalid events
			if (typeof event !== "object") return;
			client.on(event.name, event.execute);
		}),
	);
}
