
export type AIProvider = 'gemini' | 'claude' | 'openai';

export interface Idea {
  id: string;
  title: string;
  hook: string;
  flow?: string[]; // New field for X Article outline
  userFeedback?: string;
  isApproved: boolean;
}

export interface Draft {
  id: string;
  ideaId: string;
  content: string;
}

export enum AgentType {
  IDEA_GENERATOR = 'Idea Generator',
  DRAFT_WRITER = 'Draft Writer',
  VIRAL_CHECK = 'Viral Check',
}

// Renamed TWEET to DEFAULT ('Alfred')
export enum WritingStyle {
  DEFAULT = 'Alfred',
  ABDULLAH = 'Abdullah',
  JOY = 'Joy',
}

// Format is now open-ended to support developer presets
export type WritingFormat = string;

export interface AgentConfig {
  id: AgentType;
  systemPrompt: string;
  description: string;
}


export type Step = 'BRIEF' | 'IDEATION' | 'DRAFTING';

export interface Guardrails {
  dos: string;
  donts: string;
}

export interface ResearchProfile {
  id: string;
  name: string;
  topics: string;
  audience: string;
  domains?: string[]; // Specific sources to prioritize
}

export interface ResearchFinding {
  id: string;
  headline: string;
  bullets: string[];
  fullContext?: string; // New field for the "entire article" representation
  relevanceScore: number;
}

export type ResearchTimeRange = '24h' | '3d' | '7d' | '30d';

export interface Session {
  id: string;
  name: string;
  createdAt: number; // timestamp
  lastAccessedAt?: number; // updated on open; used for 30-day cleanup
  pinned?: boolean; // pinned sessions are never auto-deleted
  step: Step;
  brief: string;
  writingStyle: string;
  writingFormat: WritingFormat; // New field

  // Research Data
  activeProfileId?: string;
  researchTimeRange: ResearchTimeRange;
  researchResults?: ResearchFinding[];
  selectedResearchIds?: string[];
  researchSources?: Array<{ title: string; url: string }>; // Global sources for the session
  isResearching?: boolean;

  ideas: Idea[];
  drafts: Draft[];
  isProcessing: boolean; // localized loading state
  isRefining?: boolean; // background refinement state

  // Newsletter Specifics
  newsletterSubjectLines?: string[]; // Generated subject lines in Ideation
  selectedNewsletterSubjectLine?: string; // The one picked in Ideation
  newsletterSubjectLineVariations?: string[]; // The 5 variations generated in Drafting
}

// New Interface for Custom Styles (Personas)
export interface CustomStyle {
  id: string;
  name: string;
  prompts: Record<AgentType, string>;
  nativeFormat?: string; // The format this style was trained on (e.g. "Tweet")
  description?: string; // Short bio of the persona
  role?: string; // Two word archetype (e.g. "The Contrarian")
}

// Interface for Developer Formats
export interface FormatDefinition {
  id: string;
  name: string;
  description: string;
  instruction: string; // The formatting rule to inject
}

export interface CsvRow {
  content: string;
  likes: number;
}

// ── Onboarding ──────────────────────────────────────────────────────────────

export interface OnboardingProfile {
  formats: string[];      // What they write: ['Tweet', 'Thread', ...]
  audience: string;       // Who they write for
  tone: string;           // Writing voice/tone
  pillars: string[];      // Content pillars (up to 3 topics)
  samplesStyleId?: string; // ID of the CustomStyle created from their samples
}

export interface OnboardingState {
  steps: {
    formats: boolean;
    audience: boolean;
    tone: boolean;
    samples: boolean;
    pillars: boolean;
  };
  profile: Partial<OnboardingProfile>;
  completedAt?: string; // ISO string — set when all 5 steps are done
}