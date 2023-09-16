/**
 * since I'm too lazy to figure out typescript I made a bunch of JSDOC interfaces
 * they're used all throughout the bot for intellisense and easier debugging
 *
 * FIRESTORM:
 *
 * @typedef {"faithful 32x" | "faithful_64x" | "classic_faithful_32x" | "classic_faithful_64x" | "classic_faithful_32x_progart"} Pack
 *
 * @typedef Path
 * @property {String} id internal id
 * @property {String} use use it's attached to
 * @property {String} name the actual path
 * @property {Boolean} mcmeta whether it can be animated
 * @property {String[]} versions
 *
 * @typedef Use
 * @property {String} id texture id + letter
 * @property {String} name use name (usually blank)
 * @property {Number} texture texture id without letter
 * @property {"java" | "bedrock"} edition
 *
 * @typedef Contribution
 * @property {String} id internal id
 * @property {Number} date unix timestamp
 * @property {String} texture texture id
 * @property {8 | 16 | 32 | 64 | 128 | 256 | 512} resolution
 * @property {Pack} pack
 * @property {String[]} authors
 *
 * @typedef Texture
 * @property {String} id regular texture id
 * @property {String} name display name
 * @property {String[]} tags
 * @property {Use[]} uses
 * @property {Path[]} paths paths and their attached uses
 * @property {Contribution[]?} contributions
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
 * @property {String} name valid discord.js or client-emitted event name
 * @property {Boolean?} once only happens once (e.g. on ready)
 * @property {Function} execute
 *
 * SETTINGS:
 *
 * @typedef SubmissionPack
 * @property {SubmissionChannels} channels
 * @property {Boolean} council_enabled
 * @property {Number?} time_to_council
 * @property {Number} time_to_results
 * @property {String?} contributor_role
 *
 * @typedef SubmissionChannels
 * @property {String} submit
 * @property {String?} council
 * @property {String} results
 */

// so js doesn't complain that this isn't a module
module.exports = {};
