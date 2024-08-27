import { GuildMember, PermissionFlagsBits } from "discord.js";

export type PermissionType = "administrator" | "council" | "moderator" | "submission";

/**
 * Check permissions of a given member
 * @author Evorp
 * @param member member to check
 * @param type what type of role to check for
 * @returns whether the member has the permissions
 */
export function hasPermission(member: GuildMember, type: PermissionType = "submission"): boolean {
	const hasAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
	const hasMod = member.permissions.has(PermissionFlagsBits.ManageMessages);
	const hasCouncil = member.roles.cache.some((role) => role.name.toLowerCase().includes("council"));

	switch (type) {
		case "administrator":
			return hasAdmin;
		case "council":
			return hasCouncil;
		case "moderator":
			return hasMod;
		case "submission":
			return hasAdmin || hasCouncil;
		default:
			return false;
	}
}
