/**
 * since I'm too lazy to figure out typescript I made a bunch of JSDOC interfaces
 * they're used all throughout the bot for intellisense and easier debugging
 *
 * FIRESTORM:
 *
 * @typedef {"faithful 32x" | "faithful_64x" | "classic_faithful_32x" | "classic_faithful_64x" | "classic_faithful_32x_progart"} Pack
 *
 * @typedef Path
 * @property {String} id
 * @property {String} use
 * @property {String} name
 * @property {Boolean} mcmeta
 * @property {String[]} versions
 *
 * @typedef Use
 * @property {String} id
 * @property {String} name
 * @property {"java" | "bedrock"} edition
 *
 * @typedef Contribution
 * @property {String} id
 * @property {Number} date unix timestamp
 * @property {String} texture texture id
 * @property {8 | 16 | 32 | 64 | 128 | 256 | 512} resolution
 * @property {Pack} pack
 * @property {String[]} authors
 *
 * @typedef Texture
 * @property {String} id
 * @property {String} name
 * @property {String[]} tags
 * @property {Use[]} uses
 * @property {Path[]} paths
 * @property {Contribution[]?} contributions
 *
 * BOT:
 *
 * @typedef Command
 * @property {String} name
 * @property {Boolean?} guildOnly
 * @property {String?} aliases
 * @property {CommandExecute} execute
 *
 * @callback CommandExecute
 * @param {import("discord.js").Client} client
 * @param {import("discord.js").Message} Message
 * @param {String[]} args
 *
 * @typedef Event
 * @property {String} name
 * @property {Boolean?} once
 * @property {Function} execute
 */

// so js doesn't complain that this isn't a module
module.exports = {};
