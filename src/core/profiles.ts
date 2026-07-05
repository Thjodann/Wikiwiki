import type { RecordType } from "./schemas";

export const wikiProfiles = ["user", "developer", "mixed"] as const;
export const siteAudiences = ["all", "user", "developer"] as const;

export type WikiProfile = (typeof wikiProfiles)[number];
export type SiteAudience = (typeof siteAudiences)[number];

export type ProfileSeed = {
  type: "article" | "concept" | "decision" | "event" | "note" | "symbol";
  title: string;
  purpose: string;
  audience: SiteAudience;
  tags: string[];
  file?: string;
};

export type WikiProfileRecipe = {
  name: WikiProfile;
  description: string;
  target_counts: Partial<Record<RecordType, number>>;
  page_emphasis: string[];
  recommended_tags: string[];
  seeds: ProfileSeed[];
};

export const audienceTags = {
  all: "audience:all",
  user: "audience:user",
  developer: "audience:developer"
} as const;

export const userMaterialTags = [
  "faq",
  "getting-started",
  "instructions",
  "troubleshooting"
] as const;

export const profileRecipes: Record<WikiProfile, WikiProfileRecipe> = {
  mixed: {
    name: "mixed",
    description: "Balanced first-pass wiki for users and maintainers.",
    target_counts: {
      article: 5,
      concept: 8,
      decision: 4,
      event: 2,
      note: 3,
      symbol: 4
    },
    page_emphasis: [
      "Home starts with public articles for user orientation and shared project essentials.",
      "Guides prioritize article-led setup, FAQ, troubleshooting, and developer architecture.",
      "Agent record indexes remain available as evidence and maintainer context."
    ],
    recommended_tags: [
      audienceTags.all,
      audienceTags.user,
      audienceTags.developer,
      ...userMaterialTags
    ],
    seeds: [
      articleSeed("Project overview", "Write the public entry article: what this is, who it is for, and why it matters.", "all", ["product", "overview", "homepage"]),
      articleSeed("Getting started", "Write the first successful user path with concrete setup or first-run steps.", "user", ["getting-started", "instructions", "homepage"]),
      articleSeed("Features and workflows", "Explain the main user-facing modes, workflows, or feature areas.", "user", ["features", "instructions"]),
      articleSeed("FAQ and troubleshooting", "Answer common user questions and first fixes in a browseable public page.", "user", ["faq", "troubleshooting"]),
      articleSeed("Developer guide", "Explain architecture, generated-file rules, and the maintainer/agent workflow.", "developer", ["architecture", "dx", "maintenance"]),
      conceptSeed("Product promise", "Explain what the project is, who it is for, and the core value in plain language.", "all", ["product", "overview", "homepage"]),
      conceptSeed("Install and first start", "Explain how a new user gets from download/install to the first useful session.", "user", ["getting-started", "instructions", "homepage"]),
      conceptSeed("Modes and features", "Describe the main user-facing modes, workflows, or feature areas.", "user", ["features", "instructions"]),
      conceptSeed("Privacy and local data", "Explain what data stays local, what leaves the machine, and what users should know.", "user", ["privacy", "faq"]),
      conceptSeed("FAQ", "Answer common user questions in short, scannable form.", "user", ["faq"]),
      conceptSeed("Troubleshooting", "List common problems, symptoms, and first fixes.", "user", ["troubleshooting", "instructions"]),
      conceptSeed("Architecture overview", "Summarize the main technical parts and how maintainers should orient themselves.", "developer", ["architecture", "dx"]),
      conceptSeed("Data model", "Explain durable data, storage boundaries, generated files, and source-of-truth rules.", "developer", ["architecture", "data-model"]),
      decisionSeed("Choose local-first project knowledge", "Capture why the wiki is generated from repo-local records instead of a hosted service.", "all", ["architecture", "product"]),
      decisionSeed("Separate user and developer surfaces", "Capture how user-facing wiki pages differ from agent record indexes and maintainer docs.", "all", ["ux", "dx"]),
      decisionSeed("Keep generated files deterministic", "Capture why generated Markdown and static site output should be reproducible.", "developer", ["docs", "generated-files"]),
      decisionSeed("Use a static human wiki site", "Capture why the human wiki is plain static HTML rather than a dynamic app.", "all", ["site", "publishing"]),
      eventSeed("Initial wiki seed", "Record the first meaningful Wikiwiki seeding pass and what it covered.", "all", ["milestone"]),
      eventSeed("Latest dogfood milestone", "Record the most recent product/development milestone worth showing in project history.", "developer", ["devlog", "milestone"]),
      noteSeed("Generated file workflow", "Remind contributors to edit structured records and rerun render/site commands instead of editing generated output.", "developer", ["docs", "generated-files"]),
      noteSeed("Documentation drift caveats", "Capture known areas where the wiki may lag reality or need human review.", "all", ["docs", "caveats"]),
      noteSeed("Open user questions", "Track unresolved user-facing questions that should become FAQ or troubleshooting material.", "user", ["faq", "product"]),
      symbolSeed("Application entrypoint", "Point maintainers at the main runtime or CLI entrypoint.", "developer", "TODO: path/to/entrypoint"),
      symbolSeed("Data store", "Point maintainers at the source-of-truth storage module.", "developer", "TODO: path/to/store"),
      symbolSeed("Site renderer", "Point maintainers at the wiki/site rendering module.", "developer", "TODO: path/to/site-renderer"),
      symbolSeed("Test entrypoint", "Point maintainers at the primary tests for wiki-critical behavior.", "developer", "TODO: path/to/tests")
    ]
  },
  user: {
    name: "user",
    description: "First-pass wiki focused on product orientation and support.",
    target_counts: {
      article: 5,
      concept: 6,
      decision: 2,
      event: 1,
      note: 3,
      symbol: 0
    },
    page_emphasis: [
      "Home leads with public articles that explain the product, who it is for, and how to begin.",
      "Guides prioritize article-led getting started, modes/features, privacy, FAQ, and troubleshooting.",
      "Developer-only records stay out of the primary reader journey."
    ],
    recommended_tags: [
      audienceTags.all,
      audienceTags.user,
      ...userMaterialTags
    ],
    seeds: [
      articleSeed("Overview", "Write the public entry article for the product promise and audience.", "all", ["product", "overview", "homepage"]),
      articleSeed("Getting started", "Write the first successful user path.", "user", ["getting-started", "instructions", "homepage"]),
      articleSeed("Features", "Explain what users can do and when to use each feature area.", "user", ["features", "instructions"]),
      articleSeed("Privacy and data", "Explain user-visible privacy and storage behavior.", "user", ["privacy", "faq"]),
      articleSeed("FAQ and troubleshooting", "Answer common questions and fixes.", "user", ["faq", "troubleshooting"]),
      conceptSeed("Product promise", "Explain what the project is, who it is for, and why it matters.", "all", ["product", "overview", "homepage"]),
      conceptSeed("Getting started", "Explain the first successful user path.", "user", ["getting-started", "instructions", "homepage"]),
      conceptSeed("Core modes and features", "Describe what users can do and when to use each mode.", "user", ["features", "instructions"]),
      conceptSeed("Privacy and data", "Explain user-visible privacy and storage behavior.", "user", ["privacy", "faq"]),
      conceptSeed("FAQ", "Answer common user questions.", "user", ["faq"]),
      conceptSeed("Troubleshooting", "Document common symptoms and fixes.", "user", ["troubleshooting"]),
      decisionSeed("Define the user promise", "Capture the product boundary and user promise that docs should preserve.", "all", ["product", "ux"]),
      decisionSeed("Choose a support path", "Capture how users should get unstuck and where support material belongs.", "user", ["support", "troubleshooting"]),
      eventSeed("Initial user wiki seed", "Record the first user-facing wiki pass.", "all", ["milestone"]),
      noteSeed("Known caveats", "Capture caveats users should know before they get surprised.", "user", ["caveats", "faq"]),
      noteSeed("Open FAQ items", "Track unanswered user questions.", "user", ["faq"]),
      noteSeed("Docs review reminders", "Track user-facing pages that need verification.", "user", ["docs"])
    ]
  },
  developer: {
    name: "developer",
    description: "First-pass wiki focused on architecture, maintenance, and agent workflows.",
    target_counts: {
      article: 3,
      concept: 7,
      decision: 5,
      event: 3,
      note: 2,
      symbol: 6
    },
    page_emphasis: [
      "Home leads with developer articles for architecture and source-of-truth rules.",
      "Guides prioritize article-led data model, workflow, decisions, and symbol anchors.",
      "User-facing records are included only when they clarify product intent."
    ],
    recommended_tags: [
      audienceTags.all,
      audienceTags.developer,
      "architecture",
      "data-model",
      "generated-files",
      "maintenance"
    ],
    seeds: [
      articleSeed("Architecture overview", "Write the maintainer entry article for modules and boundaries.", "developer", ["architecture", "homepage"]),
      articleSeed("Data model", "Write the article for persisted records, generated artifacts, and source-of-truth rules.", "developer", ["architecture", "data-model"]),
      articleSeed("Development workflow", "Write the article for build/test/render/closeout and agent expectations.", "developer", ["dx", "maintenance", "agents"]),
      conceptSeed("Architecture overview", "Summarize the main modules and boundaries.", "developer", ["architecture", "homepage"]),
      conceptSeed("Data model", "Explain persisted records, generated artifacts, and source-of-truth rules.", "developer", ["architecture", "data-model"]),
      conceptSeed("Development workflow", "Document the daily build/test/render workflow.", "developer", ["dx", "maintenance"]),
      conceptSeed("Generated-file workflow", "Explain what should and should not be edited by hand.", "developer", ["generated-files", "docs"]),
      conceptSeed("Extension points", "Identify likely integration points for future tools or agents.", "developer", ["architecture", "agents"]),
      conceptSeed("Testing strategy", "Explain the important tests and release checks.", "developer", ["tests", "release"]),
      conceptSeed("Product promise", "Keep a short shared summary of the product intent developers should preserve.", "all", ["product", "overview"]),
      decisionSeed("Choose the storage model", "Capture why records are stored where they are.", "developer", ["architecture", "data-model"]),
      decisionSeed("Choose generated output boundaries", "Capture why Markdown and site output are generated artifacts.", "developer", ["generated-files", "docs"]),
      decisionSeed("Choose agent workflow boundaries", "Capture what agents may infer and what requires user authority.", "developer", ["agents", "authority"]),
      decisionSeed("Choose publishing workflow", "Capture how docs are built and published.", "developer", ["publishing", "ci"]),
      decisionSeed("Choose user/developer audience split", "Capture how the wiki separates reader journeys.", "all", ["ux", "dx"]),
      eventSeed("Initial developer wiki seed", "Record the first developer-focused wiki pass.", "developer", ["milestone", "devlog"]),
      eventSeed("Current architecture milestone", "Record the most recent architecture milestone.", "developer", ["architecture", "milestone"]),
      eventSeed("Current release milestone", "Record the most recent release or packaging milestone.", "developer", ["release", "milestone"]),
      noteSeed("Maintenance caveats", "Capture known rough edges or stale areas.", "developer", ["maintenance", "caveats"]),
      noteSeed("Agent closeout reminders", "Capture how agents should update records before finishing work.", "developer", ["agents", "docs"]),
      symbolSeed("Application entrypoint", "Point to the main app or CLI entrypoint.", "developer", "TODO: path/to/entrypoint"),
      symbolSeed("Record store", "Point to the durable storage implementation.", "developer", "TODO: path/to/store"),
      symbolSeed("Validation layer", "Point to schema or validation code.", "developer", "TODO: path/to/validation"),
      symbolSeed("Renderer", "Point to Markdown or site rendering code.", "developer", "TODO: path/to/renderer"),
      symbolSeed("Search/indexing", "Point to search or indexing code.", "developer", "TODO: path/to/search"),
      symbolSeed("Release checks", "Point to test or packaging entrypoints.", "developer", "TODO: path/to/release-checks")
    ]
  }
};

export function parseWikiProfile(value: string | undefined, fallback: WikiProfile = "mixed"): WikiProfile {
  if (!value) {
    return fallback;
  }

  if ((wikiProfiles as readonly string[]).includes(value)) {
    return value as WikiProfile;
  }

  throw new Error(`Unknown wiki profile: ${value}. Expected one of: ${wikiProfiles.join(", ")}.`);
}

export function parseSiteAudience(value: string | undefined, fallback: SiteAudience = "all"): SiteAudience {
  if (!value) {
    return fallback;
  }

  if ((siteAudiences as readonly string[]).includes(value)) {
    return value as SiteAudience;
  }

  throw new Error(`Unknown site audience: ${value}. Expected one of: ${siteAudiences.join(", ")}.`);
}

function articleSeed(title: string, purpose: string, audience: SiteAudience, tags: string[]): ProfileSeed {
  return {
    type: "article",
    title,
    purpose,
    audience,
    tags: withAudience(tags, audience)
  };
}

function conceptSeed(title: string, purpose: string, audience: SiteAudience, tags: string[]): ProfileSeed {
  return {
    type: "concept",
    title,
    purpose,
    audience,
    tags: withAudience(tags, audience)
  };
}

function decisionSeed(title: string, purpose: string, audience: SiteAudience, tags: string[]): ProfileSeed {
  return {
    type: "decision",
    title,
    purpose,
    audience,
    tags: withAudience(tags, audience)
  };
}

function eventSeed(title: string, purpose: string, audience: SiteAudience, tags: string[]): ProfileSeed {
  return {
    type: "event",
    title,
    purpose,
    audience,
    tags: withAudience(tags, audience)
  };
}

function noteSeed(title: string, purpose: string, audience: SiteAudience, tags: string[]): ProfileSeed {
  return {
    type: "note",
    title,
    purpose,
    audience,
    tags: withAudience(tags, audience)
  };
}

function symbolSeed(title: string, purpose: string, audience: SiteAudience, file: string): ProfileSeed {
  return {
    type: "symbol",
    title,
    purpose,
    audience,
    file,
    tags: withAudience(["symbol", "dx"], audience)
  };
}

function withAudience(tags: string[], audience: SiteAudience): string[] {
  const audienceTag = audienceTags[audience];
  return [audienceTag, ...tags.filter((tag) => tag !== audienceTag)];
}
