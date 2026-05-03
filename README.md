<img
  src="https://database.faithfulpack.net/images/branding/logos/transparent/hd/complibot_submissions_logo.png?w=256"
  alt="CompliBot Submissions Logo"
  height="256"
  align="right"
/>

<div align="center">
  <h1>CompliBot Submissions</h1>
  <h3>Fully automated texture pushing and submission system for the Faithful Discord servers.</h3>

![RepoSize](https://img.shields.io/github/repo-size/Faithful-Resource-Pack/CompliBot-Submissions)
![Issues](https://img.shields.io/github/issues/Faithful-Resource-Pack/CompliBot-Submissions)
![PullRequests](https://img.shields.io/github/issues-pr/Faithful-Resource-Pack/CompliBot-Submissions)

</div>

---

## Requirements

- Node.js v22+ (https://nodejs.org)
- pnpm (`corepack enable` + `corepack prepare pnpm@latest --activate`)

## Running

```bash
pnpm install
```

```bash
pnpm dev
```

> [!WARNING]
> While CompliBot is designed to be reasonably easy to fork and run your own instance of, we can't offer individual support for your specific use case.
> _Your mileage may vary in terms of necessary code modifications!_

1. Log into the **[Discord Developer Portal](https://discord.com/developers/applications)**.
2. Create an application, navigate to the **Bot** tab in its settings, and copy its token.
3. Rename the **.env.example** file to **.env** and open it using any text editor.
4. Paste your token after `CLIENT_TOKEN`.
5. Create two files in `resources/` called `settings.json` and `packs.json`, both of which can be just a set of curly brackets `{}`. These will be loaded dynamically later but need to be created first because of GitHub limitations.

## Configuration

Registering a custom pack for the submission process is relatively simple. [`resources/packs.json`](resources/packs.json) is used as the basis for all resource pack information, so just by adding an entry with your pack name, GitHub URLs, reference project, and submission channels, the bot will be immediately ready to receive texture submissions for that project.

> [!IMPORTANT]
> Make sure to set `DYNAMIC_PACK_DATA` in your `.env` file to `false` if you're adding your own resource packs locally. Otherwise, your custom configuration will be immediately overwritten when the bot is started!

```json
// Pack JSON template (make sure to remove these comments afterwards)
{
	// unique pack identifier
	"my_pack_id": {
		// The same ID as the JSON key
		"id": "my_pack_id",
		// Used in slash commands and logging
		"name": "My Formatted Pack Name",
		// Used for pushing
		"github": {
			"java": {
				"org": "GitHub-Organization-Or-User",
				"repo": "repository-name"
			},
			// You can omit an edition if you don't provide support for it
			"bedrock": {
				"org": "Faithful-Resource-Pack",
				"repo": "Faithful-32x-Java"
			}
		},
		// Discord submission data
		"submission": {
			// Enable comparisons against another supported pack
			// Set this to "default" if you don't need this
			"reference": "default",
			// Maximum number of days for a texture to be in voting
			// IMPORTANT NOTE: If this is set to 1 or below, a user can submit a texture one minute before the push cycle and have it immediately pass
			"time_to_results": 1,
			// You can get Discord channel IDs by enabling "Developer Mode" in the Developer settings and right-clicking on the channel
			"channels": {
				"submit": "123456789123456789",
				"results": "123456789123456789"
			},
			// Optionally add a role to any user that contributed to a texture
			// You can get role IDs in the same way you get channel IDs
			"contributor_role": "123456789123456789"
		}
	}
}
```

Your GitHub token must have write access to the repositories in question, and your repository branch layout should match the Faithful version system (one branch per version). If you don't support multiple versions, you can simply name your main branch `java-latest` to always use the latest stable release.

Since the Faithful contribution system relies on write-level access to the Faithful API, by default no credits will be added when a texture passes voting. You can override this behavior by modifying the [`postContributions`](src/submission/results/handleContributions.ts) function to write the contribution data anywhere you want.

## API Reference

This project uses the Faithful API for retrieving and writing most dynamic data, such as texture information, user contributions, and available resource packs. Check out our [API reference](https://api.faithfulpack.net/docs) for documentation about each API endpoint and its associated types.
