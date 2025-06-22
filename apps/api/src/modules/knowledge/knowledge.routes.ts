import { HttpErrorSchema } from "@bulkit/api/common/http-error-handler";
import { applyRateLimit } from "@bulkit/api/common/rate-limit";
import { bindContainer } from "@bulkit/api/ioc";
import { organizationMiddleware } from "@bulkit/api/modules/organizations/organizations.middleware";
import {
	CreateKnowledgeSchema,
	KnowledgeListQuerySchema,
	KnowledgeSchema,
	UpdateKnowledgeSchema,
} from "@bulkit/shared/modules/knowledge/knowledge.schemas";
import { PaginatedResponseSchema } from "@bulkit/shared/schemas/misc";
import { Elysia, t } from "elysia";
import { injectKnowledgeService } from "./services/knowledge.service";

export const knowledgeRoutes = new Elysia({
	prefix: "/knowledge",
	detail: { tags: ["Knowledge Base"] },
})
	.use(
		applyRateLimit({
			tiers: {
				authenticated: {
					points: 100,
					duration: 60,
					blockDuration: 120,
				},
			},
		}),
	)
	.use(organizationMiddleware)
	.use(bindContainer([injectKnowledgeService]))

	// Get all knowledge documents with filtering and pagination
	.get(
		"/",
		async (ctx) => {
			const result = await ctx.knowledgeService.getAll(ctx.db, {
				organizationId: ctx.organization.id,
				query: ctx.query,
			});

			return result;
		},
		{
			query: KnowledgeListQuerySchema,
			response: {
				200: PaginatedResponseSchema(KnowledgeSchema),
				500: HttpErrorSchema(),
			},
		},
	)

	// Get knowledge document by ID
	.get(
		"/:id",
		async (ctx) => {
			const knowledge = await ctx.knowledgeService.getById(ctx.db, {
				knowledgeId: ctx.params.id,
				organizationId: ctx.organization.id,
			});

			return knowledge;
		},
		{
			response: {
				200: KnowledgeSchema,
				404: HttpErrorSchema(),
				500: HttpErrorSchema(),
			},
		},
	)

	// Create knowledge document
	.post(
		"/",
		async (ctx) => {
			const knowledge = await ctx.knowledgeService.create(ctx.db, {
				organizationId: ctx.organization.id,
				userId: ctx.auth.user.id,
				data: ctx.body,
			});

			return knowledge;
		},
		{
			body: CreateKnowledgeSchema,
			response: {
				200: KnowledgeSchema,
				400: HttpErrorSchema(),
				401: HttpErrorSchema(),
				500: HttpErrorSchema(),
			},
		},
	)

	// Update knowledge document
	.put(
		"/:id",
		async (ctx) => {
			const knowledge = await ctx.knowledgeService.update(ctx.db, {
				knowledgeId: ctx.params.id,
				organizationId: ctx.organization.id,
				userId: ctx.auth.user.id,
				data: ctx.body,
			});

			return knowledge;
		},
		{
			body: UpdateKnowledgeSchema,
			response: {
				200: KnowledgeSchema,
				400: HttpErrorSchema(),
				401: HttpErrorSchema(),
				404: HttpErrorSchema(),
				500: HttpErrorSchema(),
			},
		},
	)

	// Delete knowledge document
	.delete(
		"/:id",
		async (ctx) => {
			await ctx.knowledgeService.delete(ctx.db, {
				knowledgeId: ctx.params.id,
				organizationId: ctx.organization.id,
			});

			return { success: true };
		},
		{
			response: {
				200: t.Object({ success: t.Boolean() }),
				401: HttpErrorSchema(),
				404: HttpErrorSchema(),
				500: HttpErrorSchema(),
			},
		},
	);
