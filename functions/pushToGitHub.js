/**
 * ORIGINAL LINK: (TypeScript)
 * https://dev.to/lucis/how-to-push-files-programatically-to-a-repository-using-octokit-with-typescript-1nj0
 */

const glob = require("globby");
const { normalize, relative } = require("path");

const { Octokit } = require("@octokit/rest");
const { readFileSync } = require("fs");

/**
 * Premade function for pushing directly to GitHub
 * @param {string} org GitHub organization name
 * @param {string} repo Github repository name
 * @param {string} branch branch name
 * @param {string} commitMessage
 * @param {string} localPath
 * @returns {Promise<string>} sent commit SHA
 */
module.exports = async function pushToGitHub(org, repo, branch, commitMessage, localPath) {
	const octo = new Octokit({
		auth: process.env.GIT_TOKEN,
	});

	const currentCommit = await getCurrentCommit(octo, org, repo, branch);
	const filesPaths = await glob(localPath);
	if (!filesPaths) return;

	// suspected problem on createBlobForFile which fails and give undefined
	const filesBlobs = await Promise.all(filesPaths.map(createBlobForFile(octo, org, repo)));
	const pathsForBlobs = filesPaths.map((fullPath) =>
		normalize(relative(localPath, fullPath)).replace(/\\/g, "/"),
	);
	const newTree = await createNewTree(
		octo,
		org,
		repo,
		filesBlobs,
		pathsForBlobs,
		currentCommit.treeSha,
	);

	const newCommit = await createNewCommit(
		octo,
		org,
		repo,
		commitMessage,
		newTree.sha,
		currentCommit.commitSha,
	);

	await setBranchToCommit(octo, org, repo, branch, newCommit.sha);
	return newCommit.sha;
};

/**
 * Get current commit of a branch from a repository
 * @param {Octokit} octo
 * @param {string} org GitHub organisation
 * @param {string} repo GitHub repository of the organisation
 * @param {string} branch GitHub branch of the repository
 * @returns {Promise<{commitSha: string, treeSha: string}>}
 */
async function getCurrentCommit(octo, org, repo, branch) {
	const { data: refData } = await octo.git.getRef({
		owner: org,
		repo,
		ref: `heads/${branch}`,
	});
	const commitSha = refData.object.sha;
	const { data: commitData } = await octo.git.getCommit({
		owner: org,
		repo,
		commit_sha: commitSha,
	});
	return {
		commitSha,
		treeSha: commitData.tree.sha,
	};
}

/**
 * Get file as utf8 file
 * Notice that readFile's UTF8 is typed differently from Github's UTF-8
 * @param {string} filePath
 * @returns {string} a utf8 file
 */
const getFileAsUTF8 = (filePath) => readFileSync(filePath, { encoding: "utf-8" });

/**
 * Get file as binary (used for image files)
 * @param {string} filePath
 * @returns {string} a base64 file
 */
const getFileAsBinary = (filePath) => readFileSync(filePath, { encoding: "base64" });

/**
 * Create blob for a file
 * @param {Octokit} octo
 * @param {string} org Github organisation
 * @param {string} repo Github repository of the organisation
 * @returns {Function} data of the blob
 */
const createBlobForFile = (octo, org, repo) => async (filePath) => {
	/** @type {string} */
	let content;
	let encoding = "utf-8";

	if ([".png", ".tga"].some((ex) => filePath.endsWith(ex))) {
		content = getFileAsBinary(filePath);
		encoding = "base64";
	} else content = getFileAsUTF8(filePath);

	const blobData = await octo.git.createBlob({
		owner: org,
		repo,
		content,
		encoding,
	});

	return blobData.data;
};

/**
 * @param {Octokit} octo
 * @param {string} owner GitHub organisation
 * @param {string} repo GitHub repository of the organisation
 * @param {Blob[]} blobs
 * @param {string[]} paths
 * @param {string} parentTreeSha
 */
async function createNewTree(octo, owner, repo, blobs, paths, parentTreeSha) {
	const tree = blobs.map(({ sha }, index) => ({
		path: paths[index],
		mode: "100644",
		type: "blob",
		sha,
	})); //as Octokit.GitCreateTreeParamsTree()
	const { data } = await octo.git.createTree({
		owner,
		repo,
		tree,
		base_tree: parentTreeSha,
	});

	return data;
}

/**
 * Create a new commit
 * @param {Octokit} octo
 * @param {string} org GitHub organisation
 * @param {string} repo GitHub repository of the organisation
 * @param {string} message Commit message
 * @param {string} currentTreeSha
 * @param {string} currentCommitSha
 */
const createNewCommit = async (octo, org, repo, message, currentTreeSha, currentCommitSha) =>
	(
		await octo.git.createCommit({
			owner: org,
			repo,
			message,
			tree: currentTreeSha,
			parents: [currentCommitSha],
		})
	).data;

/**
 * Set branch to commit
 * @param {Octokit} octo
 * @param {string} org GitHub organisation
 * @param {string} repo GitHub repository of the organisation
 * @param {string} branch GitHub branch of the repository
 * @param {string} commitSha
 */
const setBranchToCommit = (octo, org, repo, branch, commitSha) =>
	octo.git.updateRef({
		owner: org,
		repo,
		ref: `heads/${branch}`,
		sha: commitSha,
	});
