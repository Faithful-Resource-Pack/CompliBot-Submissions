const { readdirSync, statSync } = require("fs");

/**
 * Return an array of all filepaths in a directory
 * @author Juknum, Evorp
 * @param {String} dir
 * @param {String[]} filelist recursion
 * @returns {String[]} array of file paths
 */
module.exports = function walkSync(dir, filelist = []) {
	// add trailing slash if not present
	if (dir[dir.length - 1] != "/") dir += "/";
	for (const file of readdirSync(dir)) {
		if (statSync(dir + file).isDirectory())
			// read directories inside directories recursively
			filelist = walkSync(dir + file + "/", filelist);
		else filelist.push(dir + file);
	}
	return filelist;
};
