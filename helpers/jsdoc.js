/**
 * since I'm too lazy to figure out typescript I made a bunch of JSDOC interfaces
 * they're used all throughout the bot for intellisense and easier debugging
 *
 * FIRESTORM:
 *
 * @typedef {"java" | "bedrock"} MinecraftEdition
 *
 * @typedef Path
 * @property {string} id internal id
 * @property {string} use use it's attached to
 * @property {string} name the actual path
 * @property {boolean} mcmeta whether it can be animated
 * @property {string[]} versions
 *
 * @typedef Use
 * @property {string} id texture id + letter
 * @property {string} name use name (usually blank)
 * @property {number} texture texture id without letter
 * @property {MinecraftEdition} edition
 *
 * @typedef Contribution
 * @property {string} id internal id
 * @property {number} date unix timestamp
 * @property {string} texture texture id
 * @property {string} pack
 * @property {string[]} authors
 *
 * @typedef Texture
 * @property {string} id regular texture id
 * @property {string} name display name
 * @property {string[]} tags
 * @property {Use[]} uses
 * @property {Path[]} paths paths and their attached uses
 * @property {Contribution[]} [contributions]
 * @property {import("@functions/images/animate").MCMETA} [mcmeta]
 *
 * @typedef User
 * @property {string} id
 * @property {string} [username]
 * @property {string} [uuid]
 * @property {string[]} [roles]
 * @property {string[]} [media]
 * @property {boolean} [anonymous]
 *
 * BOT:
 *
 * @typedef Command
 * @property {import("discord.js").SlashCommandBuilder} data command setup
 * @property {CommandExecute} execute
 *
 * @callback CommandExecute
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 *
 * @typedef Event
 * @property {string} name valid discord.js or client-emitted event name
 * @property {boolean} [once] only happens once (e.g. on ready)
 * @property {Function} execute
 *
 * @typedef {string | URL | Buffer | ArrayBufferLike | Uint8Array | import("@napi-rs/canvas").Image | import("stream").Readable} ImageSource
 *
 * SETTINGS:
 *
 * @typedef Pack
 * @property {string} id
 * @property {string} name
 * @property {string[]} tags
 * @property {string} logo
 * @property {number} resolution
 * @property {Record<MinecraftEdition, { org: string, repo: string }>} github java and bedrock
 * @property {Submission} submission
 *
 * @typedef Submission
 * @property {string} id
 * @property {string} reference
 * @property {SubmissionChannels} channels
 * @property {boolean} council_enabled
 * @property {number} [time_to_council]
 * @property {number} time_to_results
 * @property {string} [contributor_role]
 *
 * @typedef SubmissionChannels
 * @property {string} submit
 * @property {string} [council]
 * @property {string} results
 */

// so js doesn't complain that this isn't a module
module.exports = {};
