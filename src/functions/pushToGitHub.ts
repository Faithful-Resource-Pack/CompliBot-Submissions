/**
 * ORIGINAL LINK
 * https://dev.to/lucis/how-to-push-files-programatically-to-a-repository-using-octokit-with-typescript-1nj0
 */

import { readFileSync } from "fs";
import { normalize, relative } from "path";

import { Octokit } from "@octokit/rest";
import walkSync from "@helpers/walkSync";

// octokit is really weirdly typed so you need to manually declare some interfaces
interface FileBlob {
	url: string;
	sha: string;
}

/**
 * Premade function for pushing directly to GitHub
 * @param org GitHub organization name
 * @param repo Github repository name
 * @param branch branch name
 * @param commitMessage
 * @param localPath
 * @returns sent commit SHA
 */
export default async function pushToGitHub(
	org: string,
	repo: string,
	branch: string,
	commitMessage: string,
	localPath: string,
): Promise<string> {
	const octo = new Octokit({ auth: process.env.GIT_TOKEN });

	const currentCommit = await getCurrentCommit(octo, org, repo, branch);
	const filePaths = walkSync(localPath);
	if (!filePaths) return;

	// suspected problem on createBlobForFile which fails and give undefined
	const filesBlobs = await Promise.all(
		filePaths.map((path) => createBlobForFile(octo, org, repo, path)),
	);

	const pathsForBlobs = filePaths.map((fullPath) =>
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
}

/**
 * Remove files from a GitHub repository by name
 * @author Evorp
 * @param org GitHub organization name
 * @param repo GitHub repository name
 * @param branch branch name
 * @param commitMessage
 * @param filePaths Paths to delete
 * @returns sent commit sha
 */
export async function deleteFromGitHub(
	org: string,
	repo: string,
	branch: string,
	commitMessage: string,
	filePaths: string[],
) {
	const octo = new Octokit({ auth: process.env.GIT_TOKEN });
	const { commitSha, treeSha } = await getCurrentCommit(octo, org, repo, branch);

	const treeItems = filePaths.map(
		(path) =>
			({
				path,
				mode: "100644",
				// null means deletion
				sha: null,
			}) as const,
	);

	const { data: newTreeData } = await octo.git.createTree({
		owner: org,
		repo,
		tree: treeItems,
		base_tree: treeSha,
	});

	const commitData = await createNewCommit(
		octo,
		org,
		repo,
		commitMessage,
		newTreeData.sha,
		commitSha,
	);

	await setBranchToCommit(octo, org, repo, branch, commitData.sha);
	return commitData.sha;
}

/**
 * Get current commit of a branch from a repository
 * @param octo
 * @param org GitHub organisation
 * @param repo GitHub repository of the organisation
 * @param branch GitHub branch of the repository
 * @returns
 */
async function getCurrentCommit(
	octo: Octokit,
	org: string,
	repo: string,
	branch: string,
): Promise<{ commitSha: string; treeSha: string }> {
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
 * @param filePath
 * @returns a utf8 file
 */
const getFileAsUTF8 = (filePath: string) => readFileSync(filePath, { encoding: "utf-8" });

/**
 * Get file as binary (used for image files)
 * @param filePath
 * @returns a base64 file
 */
const getFileAsBinary = (filePath: string) => readFileSync(filePath, { encoding: "base64" });

/**
 * Create blob for a file
 * @param octo
 * @param org Github organisation
 * @param repo Github repository of the organisation
 * @returns data of the blob
 */
async function createBlobForFile(
	octo: Octokit,
	org: string,
	repo: string,
	filePath: string,
): Promise<FileBlob> {
	let content: string;
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
}

/**
 * @param octo
 * @param owner GitHub organisation
 * @param repo GitHub repository of the organisation
 * @param blobs
 * @param paths
 * @param parentTreeSha
 */
async function createNewTree(
	octo: Octokit,
	owner: string,
	repo: string,
	blobs: FileBlob[],
	paths: string[],
	parentTreeSha: string,
) {
	const tree = blobs.map(
		({ sha }, index) =>
			({
				path: paths[index],
				mode: "100644",
				type: "blob",
				sha,
			}) as const,
	);
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
 * @param octo
 * @param org GitHub organisation
 * @param repo GitHub repository of the organisation
 * @param message Commit message
 * @param currentTreeSha
 * @param lastCommitSha
 */
async function createNewCommit(
	octo: Octokit,
	org: string,
	repo: string,
	message: string,
	currentTreeSha: string,
	lastCommitSha: string,
) {
	const { data } = await octo.git.createCommit({
		owner: org,
		repo,
		message,
		tree: currentTreeSha,
		parents: [lastCommitSha],
	});
	return data;
}

/**
 * Set branch to commit
 * @param octo
 * @param org GitHub organisation
 * @param repo GitHub repository of the organisation
 * @param branch GitHub branch of the repository
 * @param commitSha
 */
const setBranchToCommit = (
	octo: Octokit,
	org: string,
	repo: string,
	branch: string,
	commitSha: string,
) =>
	octo.git.updateRef({
		owner: org,
		repo,
		ref: `heads/${branch}`,
		sha: commitSha,
	});
