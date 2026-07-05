import { articleMarkdownFileName } from "../core/articles";
import type { ArticleRecord, AnyRecord } from "../core/schemas";

export function articlesPage(records: ArticleRecord[]): string {
  const sorted = sortArticles(records);
  const body = sorted.length
    ? sorted.map(renderArticleListItem).join("\n\n")
    : "_No articles captured yet._";

  return `# Articles

${body}
`;
}

export function articlePage(record: ArticleRecord, sourceRecords: AnyRecord[]): string {
  const categories = record.categories.length ? `\n\nCategories: ${record.categories.map((category) => `\`${category}\``).join(", ")}` : "";
  const aliases = record.aliases.length ? `\n\nAliases: ${record.aliases.map((alias) => `\`${alias}\``).join(", ")}` : "";
  const files = record.files.length ? `\n\nFiles: ${record.files.map((file) => `\`${file}\``).join(", ")}` : "";
  const sources = sourceRecords.length
    ? `\n\n## Source Records\n\n${sourceRecords.map((source) => `- \`${source.id}\` (${source.type})`).join("\n")}`
    : "";
  const body = record.body.trim() || "_No article body captured yet._";

  return `# ${record.title}

${record.summary}
${categories}${aliases}${files}

${body}${sources}

Record: \`${record.id}\` | Slug: \`${record.slug}\` | Authority: ${record.authority} | Confidence: ${record.confidence}
`;
}

function renderArticleListItem(record: ArticleRecord): string {
  const categories = record.categories.length ? `\n\nCategories: ${record.categories.map((category) => `\`${category}\``).join(", ")}` : "";
  const aliases = record.aliases.length ? `\n\nAliases: ${record.aliases.map((alias) => `\`${alias}\``).join(", ")}` : "";

  return `## [${record.title}](./articles/${articleMarkdownFileName(record)})

${record.summary}${categories}${aliases}

Record: \`${record.id}\``;
}

function sortArticles(records: ArticleRecord[]): ArticleRecord[] {
  return [...records].sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
}
