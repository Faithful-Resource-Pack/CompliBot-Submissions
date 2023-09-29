<img src="https://raw.githubusercontent.com/Faithful-Resource-Pack/Branding/main/logos/transparent/256/complibot_submissions_logo.png" alt="CompliBot" align="right" height="256px">
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

- NodeJS 18+ https://nodejs.org
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

- Create an app on the **[Discord Developer Portal](https://discord.com/developers/)**.
- Go to the **Bot** tab, create a bot and copy its token.
- Rename the **.env.example** file to **.env** and open it using any text editor.
- Paste in your token after `CLIENT_TOKEN`.
- Create a file in in `resources/` called `settings.json`, which can be just a set of curly brackets `{}`. This will be loaded dynamically later but needs to be created first because of GitHub limitations.

## API Reference:

This project is heavily developed around our public API. Check out our API documentation at https://api.faithfulpack.net/docs for more information about endpoints and making requests.

## Configuration

- `resources/strings.json` for all types of bot-related messages
- `resources/settings.json` for roles, channel ids, and colors

Make sure to disable setting fetching in your `.env` file if you're editing `settings.json` locally!
