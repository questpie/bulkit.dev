import type { TransactionLike } from "@bulkit/api/db/db.client";
import { knowledgeTable, usersTable } from "@bulkit/api/db/db.schema";
import { ioc } from "@bulkit/api/ioc";
import type {
	CreateKnowledge,
	Knowledge,
	KnowledgeListQuery,
	UpdateKnowledge,
} from "@bulkit/shared/modules/knowledge/knowledge.schemas";
import type { PaginatedResponse } from "@bulkit/shared/schemas/misc";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { HttpError } from "elysia-http-error";
import { injectMentionService } from "../../mentions/mention.service";

// Service interfaces
interface CreateKnowledgeOpts {
	organizationId: string;
	userId: string;
	data: CreateKnowledge;
}

interface GetKnowledgeOpts {
	knowledgeId: string;
	organizationId: string;
}

interface UpdateKnowledgeOpts {
	knowledgeId: string;
	organizationId: string;
	userId: string;
	data: UpdateKnowledge;
}

interface DeleteKnowledgeOpts {
	knowledgeId: string;
	organizationId: string;
}

interface ListKnowledgeOpts {
	organizationId: string;
	query: KnowledgeListQuery;
}

interface CreateFromTemplateOpts {
	organizationId: string;
	userId: string;
	templateId: string;
	title?: string;
	placeholderValues?: Record<string, string>;
}

export class KnowledgeService {
	constructor(private readonly mentionService: any) {}

	async getAll(
		db: TransactionLike,
		opts: ListKnowledgeOpts,
	): Promise<PaginatedResponse<Knowledge>> {
		const { organizationId, query } = opts;
		const page = query.page ?? 1;
		const limit = Math.min(query.limit ?? 20, 100);
		const offset = (page - 1) * limit;

		// Build where conditions
		const whereConditions = [eq(knowledgeTable.organizationId, organizationId)];

		if (query.search) {
			whereConditions.push(
				or(
					ilike(knowledgeTable.title, `%${query.search}%`),
					ilike(knowledgeTable.content, `%${query.search}%`),
				)!,
			);
		}

		if (query.status) {
			whereConditions.push(eq(knowledgeTable.status, query.status));
		}

		// Get knowledge documents with user relations
		const baseQuery = db
			.select({
				id: knowledgeTable.id,
				title: knowledgeTable.title,
				content: knowledgeTable.content,
				excerpt: knowledgeTable.excerpt,
				status: knowledgeTable.status,
				mentions: knowledgeTable.mentions,
				organizationId: knowledgeTable.organizationId,
				createdByUserId: knowledgeTable.createdByUserId,
				lastEditedByUserId: knowledgeTable.lastEditedByUserId,
				createdAt: knowledgeTable.createdAt,
				updatedAt: knowledgeTable.updatedAt,
				folderId: knowledgeTable.folderId,
				folderOrder: knowledgeTable.folderOrder,
				addedToFolderAt: knowledgeTable.addedToFolderAt,
				addedToFolderByUserId: knowledgeTable.addedToFolderByUserId,
			})
			.from(knowledgeTable)
			.innerJoin(usersTable, eq(knowledgeTable.createdByUserId, usersTable.id))
			.where(and(...whereConditions))
			.orderBy(
				query.sortBy === "title"
					? query.sortOrder === "desc"
						? desc(knowledgeTable.title)
						: asc(knowledgeTable.title)
					: query.sortOrder === "desc"
						? desc(knowledgeTable.updatedAt)
						: asc(knowledgeTable.updatedAt),
			)
			.limit(limit + 1)
			.offset(offset);

		const [knowledgeList, total] = await Promise.all([
			baseQuery,
			db.$count(baseQuery),
		]);

		// Transform to match expected format
		const items: Knowledge[] = knowledgeList
			.map((item) => ({
				...item,
				mentions: item.mentions ?? [],
			}))
			.slice(0, limit);

		const hasMore = knowledgeList.length > limit;

		return {
			items,
			total,
			nextCursor: hasMore ? offset + limit : null,
		};
	}

	async getById(
		db: TransactionLike,
		opts: GetKnowledgeOpts,
	): Promise<Knowledge> {
		const knowledge = await db
			.select({
				id: knowledgeTable.id,
				title: knowledgeTable.title,
				content: knowledgeTable.content,
				excerpt: knowledgeTable.excerpt,
				status: knowledgeTable.status,
				mentions: knowledgeTable.mentions,
				organizationId: knowledgeTable.organizationId,
				createdByUserId: knowledgeTable.createdByUserId,
				lastEditedByUserId: knowledgeTable.lastEditedByUserId,
				createdAt: knowledgeTable.createdAt,
				updatedAt: knowledgeTable.updatedAt,
				folderId: knowledgeTable.folderId,
				folderOrder: knowledgeTable.folderOrder,
				addedToFolderAt: knowledgeTable.addedToFolderAt,
				addedToFolderByUserId: knowledgeTable.addedToFolderByUserId,
			})
			.from(knowledgeTable)
			.innerJoin(usersTable, eq(knowledgeTable.createdByUserId, usersTable.id))
			.where(
				and(
					eq(knowledgeTable.id, opts.knowledgeId),
					eq(knowledgeTable.organizationId, opts.organizationId),
				),
			)
			.then((res) => res[0]);

		if (!knowledge) {
			throw HttpError.NotFound("Knowledge document not found");
		}

		return {
			...knowledge,
			mentions: knowledge.mentions ?? [],
		};
	}

	async create(
		db: TransactionLike,
		opts: CreateKnowledgeOpts,
	): Promise<Knowledge> {
		return db.transaction(async (trx) => {
			// Extract mentions from content if not provided
			const mentions =
				opts.data.mentions ??
				this.mentionService?.getMentionsFromHtml(opts.data.content) ??
				[];

			// Get next folder order
			const folderOrder = await this.getNextFolderOrder(
				trx,
				opts.organizationId,
				null,
			);

			const knowledge = await trx
				.insert(knowledgeTable)
				.values({
					title: opts.data.title,
					content: opts.data.content,
					excerpt: opts.data.excerpt ?? null,
					status: opts.data.status ?? "draft",
					mentions: mentions,
					organizationId: opts.organizationId,
					createdByUserId: opts.userId,
					folderOrder,
				})
				.returning()
				.then((res) => res[0]!);

			return this.getById(trx, {
				knowledgeId: knowledge.id,
				organizationId: opts.organizationId,
			});
		});
	}

	async update(
		db: TransactionLike,
		opts: UpdateKnowledgeOpts,
	): Promise<Knowledge> {
		return db.transaction(async (trx) => {
			// Check if document exists
			const existing = await trx
				.select()
				.from(knowledgeTable)
				.where(
					and(
						eq(knowledgeTable.id, opts.knowledgeId),
						eq(knowledgeTable.organizationId, opts.organizationId),
					),
				)
				.then((res) => res[0]);

			if (!existing) {
				throw HttpError.NotFound("Knowledge document not found");
			}

			// Extract mentions from content if content is being updated
			let mentions = opts.data.mentions;
			if (opts.data.content && !mentions) {
				mentions =
					this.mentionService?.getMentionsFromHtml(opts.data.content) ?? [];
			}

			const updatedKnowledge = await trx
				.update(knowledgeTable)
				.set({
					title: opts.data.title ?? existing.title,
					content: opts.data.content ?? existing.content,
					excerpt: opts.data.excerpt ?? existing.excerpt,
					status: opts.data.status ?? existing.status,
					mentions: mentions ?? existing.mentions,
					lastEditedByUserId: opts.userId,
					updatedAt: new Date().toISOString(),
				})
				.where(eq(knowledgeTable.id, opts.knowledgeId))
				.returning()
				.then((res) => res[0]!);

			return this.getById(trx, {
				knowledgeId: updatedKnowledge.id,
				organizationId: opts.organizationId,
			});
		});
	}

	async delete(db: TransactionLike, opts: DeleteKnowledgeOpts): Promise<void> {
		const result = await db
			.delete(knowledgeTable)
			.where(
				and(
					eq(knowledgeTable.id, opts.knowledgeId),
					eq(knowledgeTable.organizationId, opts.organizationId),
				),
			)
			.returning();

		if (result.length === 0) {
			throw HttpError.NotFound("Knowledge document not found");
		}
	}

	private async getNextFolderOrder(
		db: TransactionLike,
		organizationId: string,
		folderId: string | null,
	): Promise<number> {
		const result = await db
			.select({ maxOrder: sql<number>`COALESCE(MAX(folder_order), -1)` })
			.from(knowledgeTable)
			.where(
				and(
					eq(knowledgeTable.organizationId, organizationId),
					folderId
						? eq(knowledgeTable.folderId, folderId)
						: sql`folder_id IS NULL`,
				),
			);

		return (result[0]?.maxOrder ?? -1) + 1;
	}
}

export const injectKnowledgeService = ioc.register(
	"knowledgeService",
	() =>
		new KnowledgeService(ioc.resolve([injectMentionService]).mentionService),
);
