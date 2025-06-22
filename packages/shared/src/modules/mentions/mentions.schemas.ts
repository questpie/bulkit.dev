import { StringLiteralEnum } from "@bulkit/shared/schemas/misc";
import { type Static, Type } from "@sinclair/typebox";

export const MENTION_TYPES = [
	"user",
	"post",
	"resource",
	"knowledge",
	"task",
	"channel",
];

export type MentionType = (typeof MENTION_TYPES)[number];

// Comment mention types - simplified to not include agent-specific fields
export const MentionSchema = Type.Object({
	id: Type.String(),
	name: Type.String(),
	startIndex: Type.Number(),
	endIndex: Type.Number(),
	type: StringLiteralEnum(MENTION_TYPES),
});

export type Mention = Static<typeof MentionSchema>;
