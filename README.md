<img src="https://database.faithfulpack.net/images/branding/logos/transparent/hd/complibot_submissions_logo.png?w=256" alt="CompliBot Submissions Logo" align="right">
<div align="center">
  <h1>CompliBot Submissions</h1>
  <h3>Fully automated texture pushing and submission system for the Faithful Discord servers.</h3>

  ![RepoSize](https://img.shields.io/github/repo-size/Faithful-Resource-Pack/CompliBot-Submissions)
  ![Issues](https://img.shields.io/github/issues/Faithful-Resource-Pack/CompliBot-Submissions)
  ![PullRequests](https://img.shields.io/github/issues-pr/Faithful-Resource-Pack/CompliBot-Submissions)
</div>

---

## Found a bug or want to suggest something?

You can either create an issue on our [bug tracker](https://github.com/Faithful-Resource-Pack/CompliBot-Submissions/issues/new/choose) or use the `/feedback` form on our bot.

---

## Requirements

- NodeJS 20+ https://nodejs.org
- pnpm (`corepack enable` + `corepack prepare pnpm@latest --activate`)

## Running

```bash
pnpm install
```

```bash
pnpm dev
```

---

## Bot Setup

**DISCLAIMER: We won't help you rebrand the bot for any other server. If you really want to do that, then you need to figure it out yourself.**

1. Create an app on the **[Discord Developer Portal](https://discord.com/developers/)**.
2. Go to the **Bot** tab, create a bot and copy its token.
3. Rename the **.env.example** file to **.env** and open it using any text editor.
4. Paste in your token after `CLIENT_TOKEN`.
5. Create two files in `resources/` called `settings.json` and `packs.json`, both of which can be just a set of curly brackets `{}`. This will be loaded dynamically later but needs to be created first because of GitHub limitations.

## API Reference:

This project is heavily developed around our public API. Check out our API documentation at https://api.faithfulpack.net/docs for more information about endpoints and making requests.

## Configuration

- `resources/strings.json` for all bot-related messages
- `resources/settings.json` for roles, channel IDs, and colors
- `resources/packs.json` for submission pack data

Make sure to disable settings fetching in your `.env` file if you're adding your own packs locally!
