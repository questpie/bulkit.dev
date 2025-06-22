import { ioc } from "@bulkit/api/ioc";
import type { Mention } from "@bulkit/shared/modules/mentions/mentions.schemas";

export class MentionService {
	/**
	 * Extract mentions from HTML content
	 * Looks for patterns like @username, @#post-id, @$task-id, etc.
	 */
	getMentionsFromHtml(html: string): Mention[] {
		const mentions: Mention[] = [];

		// Remove HTML tags but keep the text content with positions
		const textContent = this.stripHtmlKeepPositions(html);

		// Extract mentions from the clean text
		return this.extractMentions(textContent);
	}

	/**
	 * Extract mentions from plain text content
	 * Looks for patterns like @username, @#post-id, @$task-id, etc.
	 */
	getMentionsFromText(text: string): Mention[] {
		return this.extractMentions(text);
	}

	private extractMentions(text: string): Mention[] {
		const mentions: Mention[] = [];

		// Pattern to match different mention types:
		// @username (user mentions)
		// @#post-id (post mentions)
		// @$task-id (task mentions)
		// @&channel-name (channel mentions)
		// @!resource-id (resource mentions)
		// @?knowledge-id (knowledge mentions)
		const mentionPattern = /@([#$&!?]?)([a-zA-Z0-9_-]+)/g;

		let match;
		while ((match = mentionPattern.exec(text)) !== null) {
			const fullMatch = match[0];
			const prefix = match[1] || "";
			const id = match[2] || "";

			// Determine mention type based on prefix
			let type: string;
			let name = fullMatch; // Default name to the full match

			switch (prefix) {
				case "#":
					type = "post";
					name = `Post ${id}`;
					break;
				case "$":
					type = "task";
					name = `Task ${id}`;
					break;
				case "&":
					type = "channel";
					name = `#${id}`;
					break;
				case "!":
					type = "resource";
					name = `Resource ${id}`;
					break;
				case "?":
					type = "knowledge";
					name = `Knowledge ${id}`;
					break;
				default:
					type = "user";
					name = `@${id}`;
					break;
			}

			mentions.push({
				id,
				name,
				startIndex: match.index || 0,
				endIndex: (match.index || 0) + fullMatch.length,
				type,
			});
		}

		return mentions;
	}

	private stripHtmlKeepPositions(html: string): string {
		// Simple HTML tag removal - for more complex cases, you might want to use a proper HTML parser
		return html.replace(/<[^>]*>/g, "");
	}

	/**
	 * Replace mentions in content with proper formatting
	 * This can be used when displaying content with mentions highlighted
	 */
	formatMentions(content: string, mentions: Mention[]): string {
		if (mentions.length === 0) return content;

		// Sort mentions by startIndex in descending order to avoid index shifting
		const sortedMentions = [...mentions].sort(
			(a, b) => b.startIndex - a.startIndex,
		);

		let formattedContent = content;

		for (const mention of sortedMentions) {
			const before = formattedContent.substring(0, mention.startIndex);
			const after = formattedContent.substring(mention.endIndex);
			const mentionText = `<span class="mention mention-${mention.type}" data-id="${mention.id}">${mention.name}</span>`;

			formattedContent = before + mentionText + after;
		}

		return formattedContent;
	}

	/**
	 * Validate mentions against actual entities in the database
	 * This would typically check if the mentioned users, posts, tasks, etc. actually exist
	 */
	async validateMentions(mentions: Mention[]): Promise<Mention[]> {
		// For now, return all mentions as valid
		// In a real implementation, you would:
		// 1. Group mentions by type
		// 2. Query the database for each type to verify existence
		// 3. Filter out invalid mentions
		// 4. Update mention names with actual entity names

		return mentions;
	}
}

export const injectMentionService = ioc.register("mentionService", () => {
	return new MentionService();
});
