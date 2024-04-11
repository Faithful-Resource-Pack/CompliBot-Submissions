const { readdirSync, statSync } = require("fs");
const { sep } = require("path");

/**
 * Return an array of all filepaths in a directory
 * @author Juknum, Evorp
 * @param {string} dir
 * @param {string[]} filelist recursion
 * @returns {string[]} array of file paths
 */
module.exports = function walkSync(dir, filelist = []) {
	// add trailing slash if not present
	if (dir[dir.length - 1] != sep) dir += sep;
	for (const file of readdirSync(dir)) {
		if (statSync(dir + file).isDirectory())
			// read directories inside directories recursively
			filelist = walkSync(dir + file + sep, filelist);
		else filelist.push(dir + file);
	}
	return filelist;
};
