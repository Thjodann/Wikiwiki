import type { ArticleRecord } from "./schemas";

export function slugFromTitle(title: string): string {
  const slug = title
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9:_-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "article";
}

export function articleFileName(article: ArticleRecord): string {
  return `${safeFileName(article.slug)}.html`;
}

export function articleMarkdownFileName(article: ArticleRecord): string {
  return `${safeFileName(article.slug)}.md`;
}

export function safeFileName(value: string): string {
  return value.replace(/[^a-z0-9._-]+/gi, "-");
}
