import strings from "@resources/strings.json";
import settings from "@resources/settings.json";

import { Command } from "@interfaces/discord";
import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { MinecraftEdition, Pack, PackFile, Path, Texture } from "@interfaces/database";
import axios from "axios";
import { deleteFromGitHub } from "@functions/pushToGitHub";
import addDeleteButton from "@helpers/addDeleteButton";

const DEBUG = process.env.DEBUG.toLowerCase() === "true";

export default {
	data: new SlashCommandBuilder()
		.setName("remove")
		.setDescription(strings.command.description.remove)
		.addStringOption((option) =>
			option
				.setName("pack")
				.setDescription("Which pack to remove textures from.")
				.addChoices(
					{ name: "All", value: "all" },
					...Object.values(require("@resources/packs.json")).map((pack: Pack) => ({
						name: pack.name,
						value: pack.id,
					})),
				)
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("texture")
				.setDescription("Texture name or ID to find (first name will be chosen so be careful).")
				.setRequired(true),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false),
	async execute(interaction) {
		interaction.deferReply();
		const submissions: PackFile = require("@resources/packs.json");
		const pack = interaction.options.getString("pack", true);
		const texture = interaction.options.getString("texture", true);

		const cleanedTextureName = texture
			.trim()
			.replace(".png", "")
			.replace("#", "")
			.replace(/ /g, "_");

		const noResultEmbed = new EmbedBuilder()
			.setTitle("No results found!")
			.setDescription(`No results were found for ${cleanedTextureName}. Have you made a typo?`)
			.setColor(settings.colors.red);

		let results: Texture | Texture[];
		try {
			results = (
				await axios.get(
					`${process.env.API_URL}textures/${encodeURIComponent(cleanedTextureName)}/all`,
				)
			).data;
		} catch {
			return interaction.editReply({
				embeds: [noResultEmbed],
			});
		}

		results = Array.isArray(results) ? results : [results];
		if (!results.length)
			return interaction.editReply({
				embeds: [noResultEmbed],
			});

		// take first result
		const { name, uses, paths } = results[0];

		// grouped by edition -> version -> path name
		const groupedPaths = uses.reduce<Record<string, Record<string, string[]>>>((acc, cur) => {
			acc[cur.edition] ||= {};
			for (const path of paths.filter((p) => p.use === cur.id)) {
				// add path to every version it's in
				for (const version of path.versions) {
					acc[cur.edition][version] ||= [];
					acc[cur.edition][version].push(path.name);
				}
			}
			return acc;
		}, {});

		for (const [edition, versions] of Object.entries(groupedPaths)) {
			const { org, repo } = submissions[pack].github[edition as MinecraftEdition];
			for (const [version, paths] of Object.entries(versions)) {
				try {
					await deleteFromGitHub(
						org,
						repo,
						version,
						`Delete ${name} executed by ${interaction.user.displayName}`,
						paths,
					);
					if (DEBUG) console.log(`Deleted: ${org}/${repo}:${version} (${name})`);
				} catch {
					// can also be an auth error or really anything but this is most likely
					if (DEBUG) console.log(`Branch ${version} doesn't exist for pack ${repo}!`);
				}
			}
		}

		return interaction
			.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle(`Successfully removed texture ${name} from pack ${submissions[pack].name}`)
						.setDescription(
							"Note that this does not remove contributions or other pack-specific data.",
						)
						.setColor(settings.colors.green),
				],
			})
			.then((msg) => addDeleteButton(msg));
	},
} as Command;
