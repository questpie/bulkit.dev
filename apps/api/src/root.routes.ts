import { lemonSqueezyWebhookRoutes } from "@bulkit/api/lemon-squeezy/lemon-squeezy-webhook.routes";
import { aiRoutes } from "@bulkit/api/modules/ai/ai.routes";
import { appRoutes } from "@bulkit/api/modules/app/app.routes";
import { adminRoutes } from "@bulkit/api/modules/auth/admin/admin.routes";
import { authRoutes } from "@bulkit/api/modules/auth/auth.routes";
import { channelRoutes } from "@bulkit/api/modules/channels/channels.routes";
import { chatRoutes } from "@bulkit/api/modules/chat/chat.routes";
import { commentsRoutes } from "@bulkit/api/modules/comments/comments.routes";
import { foldersRoutes } from "@bulkit/api/modules/folders/folders.routes";
import { knowledgeRoutes } from "@bulkit/api/modules/knowledge/knowledge.routes";
import { labelsRoutes } from "@bulkit/api/modules/labels/labels.routes";
import { openGraphRoutes } from "@bulkit/api/modules/open-graph/open-graph.routes";
import { organizationRoutes } from "@bulkit/api/modules/organizations/organizations.routes";
import { planRoutes } from "@bulkit/api/modules/plans/plans.routes";
import { postsRoutes } from "@bulkit/api/modules/posts/posts.routes";
import { resourceRoutes } from "@bulkit/api/modules/resources/resources.routes";
import { tasksRoutes } from "@bulkit/api/modules/tasks/tasks.routes";
import { Elysia } from "elysia";

/**
 * Aggregate all routes here
 */
export const rootRoutes = new Elysia()
	.use(adminRoutes)
	.use(appRoutes)
	.use(aiRoutes)
	.use(authRoutes)
	.use(channelRoutes)
	.use(chatRoutes)
	.use(commentsRoutes)
	.use(foldersRoutes)
	.use(knowledgeRoutes)
	.use(labelsRoutes)
	.use(organizationRoutes)
	.use(postsRoutes)
	.use(resourceRoutes)
	.use(tasksRoutes)
	.use(openGraphRoutes)
	.use(lemonSqueezyWebhookRoutes)
	.use(planRoutes);
