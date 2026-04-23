import { GoogleGenAI } from "@google/genai";

// Re-export types for use by other services
export type { Schema, GenerateContentResponse } from "@google/genai";

const getClient = (manualApiKey?: string) => {
  const apiKey = manualApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Gemini API Key missing in getClient");
    throw new Error("API Key not found. Please provide a Gemini API Key in the configuration.");
  }
  console.log("Initializing GoogleGenAI with key (first 4 chars):", apiKey.substring(0, 4) + "...");
  return new GoogleGenAI({ apiKey });
};

export { getClient };

// NEW STYLE SUFFIX V2.16 - Updated per user request
const STYLE_SUFFIX = "Modern 2D webcomic style, pastel color background, bold clean line art, stylized character design, flat colors with cel-shading, cinematic dramatic lighting, volumetric atmosphere, rim lighting, deep shadows, ambient occlusion, depth of field, sharp focus on subject, 8k resolution, high quality digital illustration.";

// Helper: Process System Instruction Placeholders
const processSystemInstruction = (instruction: string, narratorName: string, styleSuffix: string, easterEggCount: number, easterEggTypes: string[], negativePrompt: string = "", language: 'id' | 'en' = 'id'): string => {
    let processed = instruction
        .replace(/{{NARRATOR_NAME}}/g, narratorName)
        .replace(/{{STYLE_SUFFIX}}/g, styleSuffix);

    // Add Language Rule
    const languageRule = language === 'en' 
        ? "\nLANGUAGE RULE: You MUST output all visual prompts and narrative text in ENGLISH. The user provided input might be in Indonesian, but your output must be English."
        : "\nLANGUAGE RULE: You MUST output all visual prompts and narrative text in INDONESIAN.";
    
    processed += languageRule;

    // Construct Easter Egg Rule dynamically
    let easterEggRule = "";
    if (easterEggCount === 0) {
        easterEggRule = "NO EASTER EGGS: Do not include any specific easter eggs in the prompt.";
    } else {
        easterEggRule = `EASTER EGG RULE (MANDATORY):
- You MUST include exactly ${easterEggCount} Easter Egg(s) in the description.
- Types required:
${easterEggTypes.map((type, i) => `  ${i+1}. ${type}`).join('\n')}
- IMPORTANT: Easter eggs must be added as accessories, background elements, or subtle details. DO NOT change the character's base outfit or appearance defined in the reference.
- For "khas indonesia", use diverse cultural icons, traditional patterns, or local food items.
- For "pop culture", use diverse global movie, game, or anime references.
- For "internasional", use diverse global landmarks, brands, or memes.
`;
    }

    // Replace the static Easter Egg section in the default prompt if it exists, 
    // or append/inject if we are using a custom prompt that might not have the placeholder.
    // The DEFAULT_SYSTEM_PROMPT has a section "B. INTEGRASI LOKASI & EASTER EGG".
    // We will try to replace the specific sub-bullet about Single Easter Egg.
    
    // Regex to find the "SINGLE EASTER EGG (INTERNATIONAL)" block and replace it
    const easterEggRegex = /- SINGLE EASTER EGG \(INTERNATIONAL\):[\s\S]*?- HAPUS referensi lokal Indonesia \(seperti Batik, Monas, Warteg\)\./;
    
    if (easterEggRegex.test(processed)) {
        processed = processed.replace(easterEggRegex, easterEggRule);
    } else {
        // If regex fails (custom prompt), append it to the end of the prompt
        processed += `\n\n${easterEggRule}`;
    }

    // Add Negative Prompt Rule
    if (negativePrompt.trim()) {
        const negativeRule = `
NEGATIVE PROMPT / FORBIDDEN CONCEPTS (STRICT):
- The following words/concepts are STRICTLY FORBIDDEN in the visual prompts: ${negativePrompt}
- Do NOT include them even if the narrative mentions them.
- Find creative alternatives or omit them entirely.
`;
        processed += negativeRule;
    }

    return processed;
};

// Helper: Clean JSON String from potential Markdown or Conversational text
const cleanJsonString = (input: string): string => {
    let text = input;
    
    // 1. Remove Markdown Code Block wrappers (```json ... ```)
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
    const match = text.match(codeBlockRegex);
    if (match) {
        text = match[1];
    }

    // 2. Find the OUTERMOST JSON Object boundaries (start with { and end with })
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    
    if (start !== -1 && end !== -1 && end >= start) {
        text = text.substring(start, end + 1);
    }
    
    return text.trim();
};

// Helper: Escape Regex
const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Helper: Apply Narrator Suffix to Visual Prompts
const applyNarratorSuffix = (prompt: string, narratorName: string, narratorSuffix: string): string => {
    if (!narratorSuffix.trim() || !narratorName.trim()) return prompt;
    
    // If the prompt already contains the suffix, don't append it again.
    if (prompt.toLowerCase().includes(narratorSuffix.toLowerCase().trim())) {
        return prompt;
    }

    const narratorRegex = new RegExp(`(${escapeRegExp(narratorName)})`, 'i');
    if (narratorRegex.test(prompt)) {
        return prompt.replace(narratorRegex, `$1 ${narratorSuffix.trim()}`);
    }
    return prompt;
};

// Helper: Retry operation with exponential backoff
const retryOperation = async <T>(
    operation: () => Promise<T>, 
    retries = 2, 
    delay = 2000
): Promise<T> => {
    try {
        return await operation();
    } catch (err: any) {
        const msg = (err.message || "").toLowerCase();
        // Retry on Server Errors (5xx), RPC failures, or Network Errors
        if (retries > 0 && (
            msg.includes("500") || 
            msg.includes("503") || 
            msg.includes("rpc failed") || 
            msg.includes("fetch failed") || 
            msg.includes("network error") || 
            msg.includes("unknown") ||
            msg.includes("unexpected token") // Retry on JSON parse errors sometimes helps if model hallucinated
        )) {
            console.warn(`API Error (${msg}). Retrying in ${delay}ms... (Attempts left: ${retries})`);
            await new Promise(res => setTimeout(res, delay));
            return retryOperation(operation, retries - 1, delay * 2);
        }
        throw err;
    }
};

// Helper: Call SumoPod API (Supports DeepSeek and Seed models)
const callSumoPodAI = async (apiKey: string, modelName: string, messages: any[], temperature = 0.7, maxTokens = 4096) => {
    if (!apiKey) throw new Error("SumoPod API Key is required.");

    const directUrl = "https://ai.sumopod.com/v1/chat/completions";
    // Using corsproxy.io as a fallback
    const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(directUrl);
    
    const payload = {
        model: modelName,
        messages: messages,
        max_tokens: maxTokens,
        temperature: temperature,
        stream: false
    };

    const headers = {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
    };

    const makeRequest = async (url: string) => {
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`SumoPod API Error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
    };

    try {
        // Attempt Direct Call
        return await makeRequest(directUrl);
    } catch (error: any) {
        // Retry via Proxy on failure
        if (error.message && (error.message.includes("Failed to fetch") || error.message.includes("NetworkError"))) {
            console.warn("Direct SumoPod connection failed (CORS). Retrying via Proxy...");
            try {
                return await makeRequest(proxyUrl);
            } catch (proxyError: any) {
                throw new Error(`Koneksi SumoPod Gagal (CORS). Gunakan Extension 'Allow CORS' atau Proxy. (${proxyError.message})`);
            }
        }
        throw error;
    }
};

// Re-export helper functions for use by other services
export { 
    processSystemInstruction, 
    cleanJsonString, 
    applyNarratorSuffix, 
    retryOperation,
    callSumoPodAI,
    STYLE_SUFFIX
};