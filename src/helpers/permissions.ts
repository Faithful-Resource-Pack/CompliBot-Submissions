import { GuildMember, PermissionFlagsBits } from "discord.js";

export enum PermissionType {
	Administrator,
	Moderator,
	Council,
	Submission, // admin or council
}

/**
 * Check permissions of a given member
 * @author Evorp
 * @param member member to check
 * @param type what type of role to check for
 * @returns whether the member has the permissions
 */
export function hasPermission(member: GuildMember, type = PermissionType.Submission): boolean {
	const hasAdmin = member.permissions.has(PermissionFlagsBits.Administrator);
	const hasMod = member.permissions.has(PermissionFlagsBits.ManageMessages);
	const hasCouncil = member.roles.cache.some((role) => role.name.toLowerCase().includes("council"));

	switch (type) {
		case PermissionType.Administrator:
			return hasAdmin;
		case PermissionType.Council:
			return hasCouncil;
		case PermissionType.Moderator:
			return hasMod;
		case PermissionType.Submission:
			return hasAdmin || hasCouncil;
	}
}
