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
 * Represents a connection to a GitHub repository
 * Much simpler as a class since there's a lot of state to keep track of
 */
export default class GitHubRepository {
	private octo: Octokit;
	public readonly org: string;
	public readonly repo: string;
	constructor(org: string, repo: string) {
		this.octo = new Octokit({ auth: process.env.GIT_TOKEN });
		this.org = org;
		this.repo = repo;
	}

	/**
	 * Push files from a local path to the given branch
	 * @param branch Branch to push to
	 * @param commitMessage Commit message to use
	 * @param localPath Path to push from
	 * @returns Sent commit SHA
	 */
	public async push(
		branch: string,
		commitMessage: string,
		localPath: string,
	): Promise<string | undefined> {
		const currentCommit = await this.getCurrentCommit(branch);
		const filePaths = walkSync(localPath);
		if (!filePaths.length) return;

		// suspected problem in createBlobForFile which fails and give undefined
		const filesBlobs = await Promise.all(filePaths.map((path) => this.createBlobForFile(path)));

		const pathsForBlobs = filePaths.map((fullPath) =>
			normalize(relative(localPath, fullPath)).replace(/\\/g, "/"),
		);
		const newTree = await this.createNewTree(filesBlobs, pathsForBlobs, currentCommit.treeSha);

		const newCommit = await this.createNewCommit(
			commitMessage,
			newTree.sha,
			currentCommit.commitSha,
		);

		await this.setBranchToCommit(branch, newCommit.sha);
		return newCommit.sha;
	}

	/**
	 * Delete files from the given branch by path
	 * @param branch Branch to delete from
	 * @param commitMessage Commit message to use
	 * @param filePaths Paths to be deleted
	 * @returns Sent commit SHA
	 */
	public async delete(branch: string, commitMessage: string, filePaths: string[]): Promise<string> {
		const { commitSha, treeSha } = await this.getCurrentCommit(branch);

		const treeItems = filePaths.map(
			(path) =>
				({
					path,
					mode: "100644",
					// null means deletion
					sha: null,
				}) as const,
		);

		const { data: newTreeData } = await this.octo.git.createTree({
			owner: this.org,
			repo: this.repo,
			tree: treeItems,
			base_tree: treeSha,
		});

		const commitData = await this.createNewCommit(commitMessage, newTreeData.sha, commitSha);

		await this.setBranchToCommit(branch, commitData.sha);
		return commitData.sha;
	}

	/**
	 * Get current commit of a branch from a repository
	 * @param branch Branch to get the commit from
	 * @returns commit and tree SHA
	 */
	async getCurrentCommit(branch: string): Promise<{ commitSha: string; treeSha: string }> {
		const { data: refData } = await this.octo.git.getRef({
			owner: this.org,
			repo: this.repo,
			ref: `heads/${branch}`,
		});
		const commitSha = refData.object.sha;
		const { data: commitData } = await this.octo.git.getCommit({
			owner: this.org,
			repo: this.repo,
			commit_sha: commitSha,
		});
		return {
			commitSha,
			treeSha: commitData.tree.sha,
		};
	}

	/**
	 * Create blob for a file
	 * @returns blob data
	 */
	async createBlobForFile(filePath: string): Promise<FileBlob> {
		let content: string;
		let encoding = "utf-8";

		if ([".png", ".tga"].some((ex) => filePath.endsWith(ex))) {
			content = getFileAsBinary(filePath);
			encoding = "base64";
		} else content = getFileAsUTF8(filePath);

		const blobData = await this.octo.git.createBlob({
			owner: this.org,
			repo: this.repo,
			content,
			encoding,
		});

		return blobData.data;
	}

	/**
	 * Create a new tree
	 * @param blobs Array of blobs
	 * @param paths Array of paths
	 * @param parentTreeSha SHA of the parent tree
	 * @returns tree data
	 */
	async createNewTree(blobs: FileBlob[], paths: string[], parentTreeSha: string) {
		const tree = blobs.map(
			({ sha }, index) =>
				({
					path: paths[index],
					mode: "100644",
					type: "blob",
					sha,
				}) as const,
		);
		const { data } = await this.octo.git.createTree({
			owner: this.org,
			repo: this.repo,
			tree,
			base_tree: parentTreeSha,
		});

		return data;
	}

	/**
	 * Create a new commit
	 * @param message Commit message
	 * @param currentTreeSha SHA of the current tree
	 * @param lastCommitSha SHA of the last commit
	 * @returns commit data
	 */
	async createNewCommit(message: string, currentTreeSha: string, lastCommitSha: string) {
		const { data } = await this.octo.git.createCommit({
			owner: this.org,
			repo: this.repo,
			message,
			tree: currentTreeSha,
			parents: [lastCommitSha],
		});
		return data;
	}

	/**
	 * Set branch to commit
	 * @param branch Branch to set
	 * @param commitSha SHA of the commit to be set
	 */
	setBranchToCommit(branch: string, commitSha: string) {
		return this.octo.git.updateRef({
			owner: this.org,
			repo: this.repo,
			ref: `heads/${branch}`,
			sha: commitSha,
		});
	}
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
