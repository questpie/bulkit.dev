import { USER_ROLE } from "@bulkit/shared/constants/db.constants";
import { Nullable, StringLiteralEnum } from "@bulkit/shared/schemas/misc";
import { type Static, Type } from "@sinclair/typebox";

export const OrganizationMemberSchema = Type.Object({
	id: Type.String(),
	email: Type.String(),
	name: Type.String(),
	role: StringLiteralEnum(USER_ROLE),
	createdAt: Type.String(),
});
export const SendInvitationSchema = Type.Object({
	email: Type.String(),
	role: StringLiteralEnum(USER_ROLE.filter((o) => o !== "owner")),
});

export const OrganizationSchema = Type.Object({
	id: Type.String(),
	name: Type.String(),
	externalCustomerId: Nullable(Type.String()),
	createdAt: Type.String(),
	updatedAt: Type.String(),
});

export const OrganizationWithRoleSchema = Type.Composite([
	OrganizationSchema,
	Type.Object({
		role: StringLiteralEnum(USER_ROLE),
	}),
]);

export const OrganizationListItemSchema = Type.Composite([
	OrganizationWithRoleSchema,
	Type.Object({
		membersCount: Type.Number(),
	}),
]);

export const CreateOrganizationSchema = Type.Object({
	name: Type.String(),
});

export type OrganizationMember = Static<typeof OrganizationMemberSchema>;
export type OrganizationWithRole = Static<typeof OrganizationWithRoleSchema>;
export type OrganizationListItem = Static<typeof OrganizationListItemSchema>;
export type Organization = Static<typeof OrganizationSchema>;
