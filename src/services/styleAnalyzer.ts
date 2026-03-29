import 'server-only';

import { AgentType, CustomStyle, Guardrails, CsvRow } from "../types";
import { SYSTEM_GUARDRAILS } from "../constants";
import { safeRandomUUID } from "../server/uuid";
import { AIProviderAdapter } from "./providers/types";

const COMMON_JSON_SCHEMA = {
    type: 'object',
    properties: {
        ideaGeneratorPrompt: { type: 'string' },
        draftWriterPrompt: { type: 'string' },
        viralCheckPrompt: { type: 'string' },
        personaRole: { type: 'string', description: "2-3 word archetype (e.g. 'The Data Storyteller')" },
        personaDescription: { type: 'string', description: "1-2 sentence description of the voice." }
    },
    required: ["ideaGeneratorPrompt", "draftWriterPrompt", "viralCheckPrompt", "personaRole", "personaDescription"]
};

const injectGuardrails = (prompt: string, guardrails?: Guardrails) => {
    const userDos = guardrails?.dos || '';
    const userDonts = guardrails?.donts || '';
    const systemDos = SYSTEM_GUARDRAILS.dos;
    const systemDonts = SYSTEM_GUARDRAILS.donts;

    if (userDos || userDonts || systemDos || systemDonts) {
        return `${prompt}

        CRITICAL GLOBAL GUARDRAILS:
        The generated prompts MUST explicitly incorporate the following rules.
        If the training data violates these guardrails, the GUARDRAILS WIN.

        SYSTEM RULES (IMMUTABLE):
        DO: ${systemDos}
        DON'T: ${systemDonts}

        USER RULES:
        ${userDos ? `DO: ${userDos}` : ''}
        ${userDonts ? `DON'T: ${userDonts}` : ''}
        `;
    }
    return prompt;
};

export const createStyleFromDescription = async (
    adapter: AIProviderAdapter,
    styleName: string,
    description: string,
    guardrails?: Guardrails
): Promise<CustomStyle> => {
    let prompt = `
    You are an Expert Persona Designer.
    Your goal is to create a WRITING PERSONA called "${styleName}" based on the user's description.

    USER DESCRIPTION:
    "${description}"

    TASK:
    Translate this abstract description into 3 highly specific System Instructions (Prompts) for our AI Agent Pipeline.

    1. Idea Generator: What kind of concepts/angles does this persona come up with? (e.g., "Contrarian", "Analytical", "Story-driven").
    2. Draft Writer: The specific Style Guide.
       - Tone (e.g., "Sarcastic", "Formal").
       - Vocabulary (e.g., "Simple English", "Academic").
       - Structure (e.g., "Short sentences", "Rhetorical questions").
       - **DO NOT include length or formatting constraints (like "max 280 chars"). Only Focus on Voice.**
    3. Viral Check: Criteria to score a draft 0-100 based on how well it matches this specific description.

    ALSO GENERATE:
    - Persona Role: A cool 2-3 word archetype name (e.g. "The Savage Analyst").
    - Persona Description: A short 1-2 sentence summary of this voice for a user UI.

    OUTPUT:
    Return a JSON object containing the 3 prompts and the persona details.
    `;

    prompt = injectGuardrails(prompt, guardrails);

    const result = await adapter.generateStructuredJSON<{
        ideaGeneratorPrompt: string;
        draftWriterPrompt: string;
        viralCheckPrompt: string;
        personaRole: string;
        personaDescription: string;
    }>({
        systemPrompt: "You are a meta-prompting system.",
        userPrompt: prompt,
        jsonSchema: COMMON_JSON_SCHEMA,
    });

    if (!result.data) throw new Error("No response from AI");

    return {
        id: safeRandomUUID(),
        name: styleName,
        role: result.data.personaRole,
        description: result.data.personaDescription,
        prompts: {
            [AgentType.IDEA_GENERATOR]: result.data.ideaGeneratorPrompt,
            [AgentType.DRAFT_WRITER]: result.data.draftWriterPrompt,
            [AgentType.VIRAL_CHECK]: result.data.viralCheckPrompt,
        }
    };
};

export const createStyleFromData = async (
    adapter: AIProviderAdapter,
    styleName: string,
    data: CsvRow[],
    nativeFormat: string,
    guardrails?: Guardrails
): Promise<CustomStyle> => {
    const maxLikes = Math.max(...data.map(d => d.likes));
    const hasRanking = maxLikes > 0;

    let prompt = `
    You are an Elite AI Linguist and Stylometry Expert.
    Your goal is to "Reverse Engineer" a WRITING PERSONA (The "Voice") based on the provided dataset to create a new AI persona called "${styleName}".

    TRAINING DATA CONTEXT:
    The provided data is natively formatted as: "${nativeFormat}".

    CRITICAL ANALYSIS TASK:
    You must extract the exact stylometric DNA of this author. Do not just describe the "vibe". Find the RIGID PATTERNS.

    PERFORM A DEEP ATOMIC PATTERN RECOGNITION on the following:

    1. **LEXICAL ANCHORS & PHRASES:**
       - Scan the data for specific starting phrases or words that appear repeatedly (e.g., "I wonder why...", "Here's the thing:", "Basically,").
       - Identify specific transition words or "crutch words" the author relies on (e.g., "Thus", "So", "However").
       - **Capture these exact phrases.**

    2. **FORMATTING MICRO-HABITS:**
       - **Numbers:** Does the author write "5" or "five"? Do they use "1,000" or "1k"?
       - **Lists:** Do they use "-", "•", "1.", or emojis?
       - **Punctuation:** Do they use em-dashes (—) heavily? Do they avoid semicolons? Do they use lowercase only?
       - **Capitalization:** Is it standard, lowercase aesthetic, or aggressive CAPS?
       - **Spacing:** Do they use double line breaks between every sentence?

    3. **SENTENCE ARCHITECTURE:**
       - **Rhythm:** Is it staccato (3-5 words)? Lyrical (20+ words)? A mix of short-long-short?
       - **Word Count:** What is the average length?
       - **Positioning:** Do they place the most important word at the start or end of the sentence?

    4. **RHETORICAL DEVICES:**
       - (e.g., "Starts with a question", "Uses analogies", "Aggressive hooks").

    If the training data shows a specific way of writing ${nativeFormat}s, your generated prompt must enforce that structure rigidly.
    `;

    prompt = injectGuardrails(prompt, guardrails);

    if (hasRanking) {
        const topPosts = data.slice(0, 15).map(r => `[${r.likes} likes]: ${r.content}`).join('\n---\n');
        const bottomPosts = data.slice(-5).map(r => `[${r.likes} likes]: ${r.content}`).join('\n---\n');

        prompt += `
        DATASET (Ranked by Performance):

        TOP PERFORMING CONTENT (High Likes) - MIMIC THIS:
        ${topPosts}

        POOR PERFORMING CONTENT (Low Likes) - AVOID THIS:
        ${bottomPosts}

        TASK:
        Contrast the top vs bottom content. What specific choices lead to high engagement for this author? Encode these insights into the prompts.
        `;
    } else {
        const samples = data.slice(0, 30).map(r => r.content).join('\n---\n');

        prompt += `
        DATASET (Raw Content Samples):
        ${samples}

        TASK:
        Analyze the syntax, tone, vocabulary, and rhetorical devices of this dataset. Identify the unique voice and recurring patterns.
        `;
    }

    prompt += `
    Generate 3 distinct System Instructions (Prompts) for the following agents:

    1. Idea Generator: What kind of concepts/angles does this PERSONA prefer? (e.g., "Contrarian takes", "Vulnerable stories", "Hard data").
    2. Draft Writer: The specific Style Guide.
       - **CRITICAL:** This prompt must be a standalone guide to writing excellent ${nativeFormat}s in this specific voice.
       - **CODIFY THE PATTERNS:** Explicitly state the rules you found. (e.g., "Rule: Always start tweets with a verb." or "Rule: Use digits for numbers, never words.")
       - Include strict rules on Tone, Vocabulary, Pacing.
       - Include strict rules on STRUCTURE (e.g. "Always start with...", "Max 2 lines per paragraph").
       - *Include 3 examples from the dataset in the prompt as "Few-Shot" examples.*
    3. Viral Check: Criteria to score a draft 0-100 based on how well it matches this specific PERSONA's voice and the native format requirements.

    ALSO GENERATE:
    - Persona Role: A cool 2-3 word archetype name (e.g. "The Deep Thinker").
    - Persona Description: A short 1-2 sentence summary of this voice for a user UI.

    OUTPUT:
    Return a JSON object containing the 3 prompts and the persona details.
    `;

    const result = await adapter.generateStructuredJSON<{
        ideaGeneratorPrompt: string;
        draftWriterPrompt: string;
        viralCheckPrompt: string;
        personaRole: string;
        personaDescription: string;
    }>({
        systemPrompt: "You are a meta-prompting system. You build tools for other AIs.",
        userPrompt: prompt,
        jsonSchema: COMMON_JSON_SCHEMA,
    });

    if (!result.data) throw new Error("No response from AI");

    return {
        id: safeRandomUUID(),
        name: styleName,
        nativeFormat,
        role: result.data.personaRole,
        description: result.data.personaDescription,
        prompts: {
            [AgentType.IDEA_GENERATOR]: result.data.ideaGeneratorPrompt,
            [AgentType.DRAFT_WRITER]: result.data.draftWriterPrompt,
            [AgentType.VIRAL_CHECK]: result.data.viralCheckPrompt,
        }
    };
};
