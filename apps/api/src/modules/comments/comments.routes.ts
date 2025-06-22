import { injectDatabase } from "@bulkit/api/db/db.client";
import { bindContainer } from "@bulkit/api/ioc";
import { organizationMiddleware } from "@bulkit/api/modules/organizations/organizations.middleware";
import {
	CommentListQuerySchema,
	CommentReplyQuerySchema,
	CreateCommentReactionSchema,
	CreateCommentSchema,
	UpdateCommentSchema,
} from "@bulkit/shared/modules/comments/comments.schemas";
import Elysia, { t } from "elysia";
import { injectCommentsService } from "./services/comments.service";

export const commentsRoutes = new Elysia({ prefix: "/comments" })
	.use(organizationMiddleware)
	.use(bindContainer([injectCommentsService, injectDatabase]))
	.post(
		"/",
		async ({ body, auth, organization, db, commentsService }) => {
			const comment = await commentsService.createComment(db, {
				userId: auth.user.id,
				organizationId: organization.id,
				data: body,
			});

			return comment;
		},
		{
			body: CreateCommentSchema,
		},
	)

	.get(
		"/",
		async ({ query, auth, organization, db, commentsService }) => {
			const comments = await commentsService.getCommentList(db, {
				...query,
				userId: auth.user.id,
				organizationId: organization.id,
			});
			return comments;
		},
		{
			query: CommentListQuerySchema,
		},
	)

	.get("/:id", async ({ params, organization, db, commentsService }) => {
		const comment = await commentsService.getCommentWithUser(
			db,
			params.id,
			organization.id,
		);
		return comment;
	})

	.put(
		"/:id",
		async ({ params, body, auth, organization, db, commentsService }) => {
			const comment = await commentsService.updateComment(db, {
				commentId: params.id,
				userId: auth.user.id,
				organizationId: organization.id,
				data: body,
			});

			return comment;
		},
		{
			body: UpdateCommentSchema,
		},
	)

	.delete(
		"/:id",
		async ({ params, auth, organization, db, commentsService }) => {
			await commentsService.deleteComment(db, {
				commentId: params.id,
				userId: auth.user.id,
				organizationId: organization.id,
			});

			return { success: true };
		},
	)

	.get(
		"/:id/replies",
		async ({ params, query, organization, db, commentsService }) => {
			const replies = await commentsService.getCommentReplies(
				db,
				params.id,
				organization.id,
				query,
			);
			return replies;
		},
		{
			query: CommentReplyQuerySchema,
		},
	)

	.post(
		"/:id/reactions",
		async ({ params, body, auth, organization, db, commentsService }) => {
			await commentsService.addReaction(db, {
				userId: auth.user.id,
				organizationId: organization.id,
				data: {
					commentId: params.id,
					reactionType: body.reactionType,
				},
			});

			return { success: true };
		},
		{
			body: CreateCommentReactionSchema,
		},
	)

	.delete(
		"/:id/reactions/:reactionType",
		async ({ params, auth, organization, db, commentsService }) => {
			await commentsService.removeReaction(db, {
				commentId: params.id,
				userId: auth.user.id,
				organizationId: organization.id,
				reactionType: params.reactionType,
			});

			return { success: true };
		},
	);
