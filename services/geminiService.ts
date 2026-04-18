import { GoogleGenAI, Type, Schema, GenerateContentResponse, Modality } from "@google/genai";
import { AnalysisResponse, StoryScene, ReferenceImage, StoryFrame, LLMProvider } from "../types";

const getClient = (manualApiKey?: string) => {
  const apiKey = manualApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Gemini API Key missing in getClient");
    throw new Error("API Key not found. Please provide a Gemini API Key in the configuration.");
  }
  console.log("Initializing GoogleGenAI with key (first 4 chars):", apiKey.substring(0, 4) + "...");
  return new GoogleGenAI({ apiKey });
};

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

/**
 * Uses Gemini 3 Flash to analyze text and generate nested scene/frames
 */
export const analyzeNarrativeToScenes = async (
  context: string,
  targetParagraph: string,
  characterList: string,
  systemInstruction: string,
  narratorName: string = "Norman",
  narratorSuffix: string = "",
  styleSuffix: string = "Modern 2D webcomic style",
  easterEggCount: number = 1,
  easterEggTypes: string[] = ["pop culture"],
  negativePrompt: string = "",
  language: 'id' | 'en' = 'id',
  manualApiKey?: string
): Promise<StoryScene[]> => {
  const ai = getClient(manualApiKey);
  
  // Process placeholders in system instruction
  const finalSystemInstruction = processSystemInstruction(systemInstruction, narratorName, styleSuffix, easterEggCount, easterEggTypes, negativePrompt, language);
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      scenes: {
        type: Type.ARRAY,
        description: "List of scenes. RULE: Every sentence ending in a period (.), question mark (?), or exclamation mark (!) MUST be a separate Scene object.",
        items: {
          type: Type.OBJECT,
          properties: {
            narrativeText: { type: Type.STRING },
            frames: {
              type: Type.ARRAY,
              description: "Array of visual frames.",
              items: {
                type: Type.OBJECT,
                properties: {
                    visualPrompt: { type: Type.STRING, description: `Detailed prompt in ${language === 'en' ? 'ENGLISH' : 'INDONESIAN'} (International Context). Must include 'easter_egg' as per instructions.` },
                    format: { type: Type.STRING, description: "Format: 'Single Panel', 'Multi Panel (2)', 'Multi Panel (3)', or 'Sequence'. RULE: If 'splitText' array has more than 1 item, Format CANNOT be 'Single Panel'." },
                    splitText: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING },
                        description: "The narrative text split into segments. If Single Panel, array MUST have 1 item. If Multi Panel, split by conjunctions. If Sequence, split by events."
                    }
                },
                required: ["visualPrompt", "format", "splitText"]
              }
            }
          },
          required: ["narrativeText", "frames"]
        }
      }
    },
    required: ["scenes"]
  };

  const promptContent = `
    Analyze the following Target Narrative based on the Context.
    
    OUTPUT LANGUAGE: ${language === 'en' ? 'ENGLISH' : 'INDONESIAN'}
    
    INPUT DATA:
    1. Context (Backstory/Previous Events): "${context}"
    2. Characters: "${characterList}"
    3. TARGET NARRATIVE (Process THIS Text Only): "${targetParagraph}"

    OBJECTIVE: Break down ONLY the "TARGET NARRATIVE" into scenes. 

    CRITICAL SCOPE BOUNDARY (STRICT):
    - YOU MUST ONLY process the text inside "TARGET NARRATIVE".
    - ABSOLUTELY DO NOT generate scenes from the "Context". Context is ONLY for understanding character/setting.
    - ABSOLUTELY DO NOT continue the story beyond the "TARGET NARRATIVE".
    - STOP processing exactly when "TARGET NARRATIVE" ends.
    - If "TARGET NARRATIVE" contains 3 sentences, output MUST contain exactly 3 Scenes.
    
    CRITICAL RULE 0 (PRESERVE HEADINGS):
    - IF a line looks like a Heading/Subtitle (e.g., "Tanda #2:", "Nomor 3.", "Poin Pertama:", "Langkah A:"), YOU MUST TREAT IT AS A SEPARATE SCENE.
    - DO NOT merge the heading with the next sentence. Even if it doesn't end with a period.
    - Example Input: "Tanda #2: Tega Menolak Teman. Nah, kita masuk ke..."
    - Example Output: 
      Scene 1: "Tanda #2: Tega Menolak Teman."
      Scene 2: "Nah, kita masuk ke..."

    CRITICAL RULE 1: Split every sentence (ending with '.', '?', or '!') into a separate SCENE.
    
    CRITICAL RULE 2 (FORMAT & SPLITTING LOGIC):
    For each sentence, you MUST decide if it needs to be split (Multi Panel/Sequence) or kept as Single Panel.

    STEP A: CHECK FOR MULTI PANEL TRIGGERS ("ATAU", "DAN", "BUKAN... BUKAN... BUKAN")
    
    1. "TRIAD / TRIPLET NEGATION" (3 PARALLEL ITEMS) - V2.10
       - Trigger: A list of 3 distinct items, often with repetition like "Bukan A, bukan B, dan bukan C".
       - Example: "Kadang bukan inflasi, bukan harga beras naik, dan bukan juga kebijakan pemerintah."
       - Action: Split text into 3 parts.
       - FORMAT MUST BE: "Multi Panel (3)".
       - SPLIT: [Part 1, Part 2, Part 3]

    2. "ATAU" (Choice/Contrast):
       - Trigger: "Angkanya bikin hati TENANG, atau malah bikin pengen banting HP ke tembok?" 
       - Action: Split text into 2 parts. 
       - FORMAT MUST BE: "Multi Panel (2)".
    
    3. "DAN" (Distinct Parallel Ideas):
       - Trigger: "Kami gak nawarin koin micin, dan jelas gak nawarin pesugihan."
       - Action: Split text into 2 parts.
       - FORMAT MUST BE: "Multi Panel (2)".

    STEP B: CHECK FOR SEQUENCE TRIGGERS (AGGRESSIVE PACING RULE V2.8)
    1. Temporal Words: "Lalu", "Terus", "Kemudian".
    2. **AGGRESSIVE COMMA SPLITTING (V2.8):**
       - RULE: If a sentence is LONG (> 12 words) and contains an intermediate comma (","), you MUST split it into a "Sequence".
       - RATIONALE: Long sentences with pauses need visual pacing steps. Do NOT keep them as Single Panel.
       - Trigger Examples:
         - "Tapi kalau kamu punya tanda nomor tiga ini, sensasi belanja itu mendadak HILANG." -> SPLIT at comma -> Sequence.
         - "Padahal kalau dipikir-pikir lagi, sebenarnya itu cuma trik marketing." -> SPLIT at comma -> Sequence.
         - "Kita akan mulai hitung dari tanda LIMA, yang sering diremehkan." -> SPLIT at comma -> Sequence.
       
       - Action: Split text at the comma/conjunction.
       - FORMAT MUST BE: "Sequence".

    STEP C: SINGLE PANEL
    - ONLY if the text is short (< 10 words) AND has NO comma triggers AND is not a Heading.
    - FORMAT MUST BE: "Single Panel".

    STEP D: SUBTITLE/HEADING DETECTION
    - If the text is a Heading (Rule 0), Format MUST be "Single Panel" but visual prompt MUST be a Title Card.

    CRITICAL - VISUAL PROMPT STRUCTURE:
    
    RULE 1: LOCATION (MANDATORY & INTERNATIONAL)
    - Describe the setting in detail — use universal/international locations.
    - Example: "Inside a modern minimalist office." or "In a busy Times Square style street."
    
    RULE 2: EASTER EGGS (MANDATORY)
    - You MUST include ${easterEggCount} specific easter egg(s) in the description.
    - Types: ${easterEggTypes.join(", ")}.
    
    CASE 1: SUBTITLES / HEADINGS (V2.8 SPECIAL RULE)
    - DETECT: If text is a subtitle/label (e.g. "Tanda #3: ...", "Nomor 1: ...", or a short emphatic statement).
    - ACTION: The visual prompt MUST describe a Title Card.
    - INSTRUCTION: Add "Teks besar '[Content]' muncul di tengah layar dengan font Headline tebal. Desain minimalis."
    
    CASE 2: MULTI PANEL (2 or 3)
    - If Format is "Multi Panel", create ONE prompt describing a split screen.
    - STRICT FORMAT (MUST FOLLOW THIS EXACTLY):
      "Split Screen / Multi Panel.
       Panel 1 (Kiri): [Action/Visual 1]. [Location].
       easter_egg: [Pop Culture Item]
       
       Panel 2 (Tengah/Kanan): [Action/Visual 2]. [Location].
       easter_egg: [Pop Culture Item]
       
       (IF 3 PANELS)
       Panel 3 (Kanan): [Action/Visual 3]"
           
    CASE 3: SEQUENCE (V2.4 LOGIC)
    - You MUST plan the visual flow.
    - SEPARATOR: You MUST separate the visual description for EACH frame using the delimiter " ||| ".
    - Example for 2 frames: "Visual Frame 1 description ||| Visual Frame 2 description starting with Referensi..."

    CASE 4: SINGLE PANEL (Standard)
    - Standard visual description. Include 'easter_egg'.

    CRITICAL - CHARACTER PRESENCE (STRICT USAGE OF AVAILABLE CHARACTERS):
    1. AVAILABLE CHARACTERS: You have these characters available: "${characterList}".
    2. USAGE RULE: You MUST use the characters from the AVAILABLE CHARACTERS list in the scenes. Do NOT just use "${narratorName}" for everything.
    3. DISTRIBUTION: If there are multiple available characters, distribute them across the scenes. Have them act out or interact with the situations described in the narrative.
    4. FALLBACK: Only if the narrative is purely abstract and no other characters fit, use "${narratorName}" observing the scene. But strongly prefer using the other available characters.
    
    CRITICAL - FRAMING & COMPOSITION RULES (STRICT):
    1. MINIMUM FRAMING: "Half-Body Shot" (Setengah Badan) or "Full Body Shot".
    2. VISIBILITY: At least one Reference Character MUST be visible in every frame.
    3. PROHIBITION: DO NOT generate Extreme Close-ups of body parts (hands, feet) or objects without the character's face/body being visible.

    CRITICAL - CHARACTER DESCRIPTION RESTRICTIONS (NEGATIVE PROMPTING):
    1. DO NOT describe the character's clothing (e.g., "memakai baju merah", "celana jeans", "topi").
    2. DO NOT describe the character's physical features (e.g., "rambut hitam", "mata besar").
    3. DO NOT use the word "Ilustrasi".
    4. JUST use the Character Name and their Action/Pose. The reference image handles the rest.

    FINANCIAL/MATH OVERLAY RULE (CRITICAL FOR V2.7):
    If the narrative contains monetary values or calculations (e.g., "sepuluh ribu", "tiga ratus ribu", "tiga juta enam ratus ribu"):
    1. CONVERT words to digits (e.g., "tiga juta" -> "3,000,000" or "3M" -> Use International Format).
    2. DETECT timeframe if present/implied (hari/bulan/tahun).
    3. ADD INSTRUCTION: "Teks besar '[Angka] [Periode]' muncul melayang dengan font tebal digital."
    
    STYLE MANDATE:
    - Every generated 'visualPrompt' MUST end with this exact sentence: "${styleSuffix}"
    
    RETURN JSON FORMAT ONLY. The output must be valid JSON matching the schema.
  `;

  let text = "";

  const generateConfig = {
      contents: promptContent,
      config: {
        systemInstruction: finalSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
      }
  };

  try {
      const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        ...generateConfig
      }), 2, 2000); // 2 retries
      text = response.text || "";
  } catch (error: any) {
      throw new Error(`Storyboard generation failed. Server busy or input too complex. (${error.message})`);
  }

  if (!text) throw new Error("No response from AI");

  // Robust cleaning (Handles Nvidia/DeepSeek/Seed artifacts)
  text = cleanJsonString(text);

  try {
    const data = JSON.parse(text) as AnalysisResponse;
    return data.scenes.map((scene, sIdx) => ({
      id: `scene-${Date.now()}-${sIdx}`,
      narrativeText: scene.narrativeText,
      frames: scene.frames.flatMap((frame, fIdx) => {
        let correctedFormat = frame.format;
        const textSegments = frame.splitText || [];
        let isSequence = false;

        // STRICT LOGIC ENFORCEMENT:
        // If text is split (>1), it CANNOT be Single Panel.
        if (textSegments.length > 1) {
             const combinedText = textSegments.join(" ").toLowerCase();
             const fmtLower = (correctedFormat || "").toLowerCase();
             
             const isExplicitSequence = fmtLower.includes('sequence');
             const isExplicitMulti = fmtLower.includes('multi');

             if (isExplicitSequence) {
                 isSequence = true;
             } else if (isExplicitMulti) {
                 isSequence = false;
             } else {
                 // Auto-detect if format was incorrect/missing
                 const multiPanelTriggers = [" atau ", " sedangkan ", " sementara ", " di sisi lain ", " tapi ", " namun ", " bukan "];
                 const negativeCount = (combinedText.match(/bukan/g) || []).length;
                 const isMultiPanelContext = multiPanelTriggers.some(t => combinedText.includes(t)) || negativeCount >= 2;

                 if (!isMultiPanelContext) {
                     isSequence = true;
                     correctedFormat = `Sequence (${textSegments.length} Frames)`;
                 } else {
                     correctedFormat = `Multi Panel (${textSegments.length})`;
                     isSequence = false;
                 }
             }
        }

        // CRITICAL FIX: If Sequence, we MUST return multiple frame objects to ensure 1 prompt row per text split.
        if (isSequence && textSegments.length > 1) {
            const fullPrompt = frame.visualPrompt;
            
            // 1. Try splitting by explicit delimiter "|||"
            let splitParts = fullPrompt.split("|||").map(s => s.trim()).filter(s => s.length > 0);
            
            // 2. Fallback: Regex if delimiter failed or insufficient parts
            let usedRegex = false;
            if (splitParts.length < textSegments.length) {
                 const splitRegex = /(?:Frame|Panel|Sequence|Langkah|Step)\s*\d+[:.]|(?:\d+\.)\s/gi;
                 const regexParts = fullPrompt.split(splitRegex).map(s => s.trim()).filter(s => s.length > 0);
                 if (regexParts.length > splitParts.length) {
                     splitParts = regexParts;
                     usedRegex = true;
                 }
            }

            // CORRECTION FOR PREAMBLE ARTIFACT (V2.16 Bug Fix)
            // If regex split resulted in [Preamble, Frame1, Frame2...] structure where Preamble is just location info,
            // we must merge it into Frame 1 so Frame 1 isn't empty/just location.
            // Check: If we have more parts than segments, and index 0 is likely preamble.
            if (usedRegex && splitParts.length > textSegments.length) {
                const preamble = splitParts[0];
                // Heuristic: If preamble is short or starts with [Location], merge it.
                if (preamble.startsWith('[') || preamble.length < 50) {
                     splitParts[1] = `${preamble} ${splitParts[1]}`;
                     splitParts.shift(); // Remove preamble
                }
            }
            
            return textSegments.map((seg, i) => {
                let p = "";

                if (i < splitParts.length) {
                    p = splitParts[i];
                } else {
                    // Fallback strategies if splitting failed
                    if (splitParts.length > 0) {
                        p = splitParts[splitParts.length - 1]; 
                    } else {
                        p = (i === 0) ? fullPrompt : "Lanjutkan aksi dari frame sebelumnya sesuai narasi.";
                    }
                }

                // V2.0 Logic: Sequence > 1 must include reference prefix (Double Check Safety)
                if (i > 0) {
                     const prefix = "Referensi dari Gambar sebelumnya, tapi... ";
                     // Avoid double prefixing if AI already did it (which V2.4 requests)
                     if (!p.toLowerCase().startsWith("referensi dari")) {
                        p = prefix + p;
                     }
                }

                // Restore mandatory style if lost during split
                const styleCheck = "Modern 2D webcomic style"; // Basic check
                if (!p.includes(styleCheck)) {
                    p += " " + styleSuffix;
                }

                p = applyNarratorSuffix(p, narratorName, narratorSuffix);

                return {
                    id: `frame-${Date.now()}-${sIdx}-${fIdx}-${i}`,
                    format: `Sequence ${i+1}/${textSegments.length}`,
                    visualPrompt: p,
                    splitText: [seg], // One segment per frame
                    isGenerating: false
                };
            });
        }

        // Multi Panel or Single Panel stays as 1 Frame object
        return [{
            id: `frame-${Date.now()}-${sIdx}-${fIdx}`,
            format: correctedFormat,
            visualPrompt: applyNarratorSuffix(frame.visualPrompt, narratorName, narratorSuffix),
            splitText: frame.splitText,
            isGenerating: false
        }];
      }),
      isRestructuring: false
    }));
  } catch (e) {
    console.error("JSON Parse Error. Cleaned text:", text);
    throw new Error(`Failed to parse AI response. Ensure response is JSON.`);
  }
};

/**
 * Generates visual prompts from current split text config using Gemini 3 Flash
 */
export const generatePromptsFromFrames = async (
    context: string,
    characterList: string,
    narrativeText: string,
    frames: StoryFrame[],
    systemInstruction: string,
    narratorName: string = "Norman",
    narratorSuffix: string = "",
    styleSuffix: string = "Modern 2D webcomic style",
    easterEggCount: number = 1,
    easterEggTypes: string[] = ["pop culture"],
    negativePrompt: string = "",
    language: 'id' | 'en' = 'id',
    manualApiKey?: string
): Promise<string[]> => {
    const ai = getClient(manualApiKey);

    // Process placeholders in system instruction
    const finalSystemInstruction = processSystemInstruction(systemInstruction, narratorName, styleSuffix, easterEggCount, easterEggTypes, negativePrompt, language);

    // Prepare a simplified representation of the frames for the AI
    const framesConfig = frames.map((f, i) => ({
        index: i,
        format: f.format,
        splitText: f.splitText
    }));

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            prompts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of visual prompts. Length MUST match the number of frames provided."
            }
        },
        required: ["prompts"]
    };

    const promptContent = `
        Generate ${language === 'en' ? 'ENGLISH' : 'INDONESIAN'} Visual Prompts based on the configuration provided.
        
        Context: ${context}
        Characters (Names): ${characterList}
        Full Narrative: ${narrativeText}
        
        FRAMES CONFIGURATION: ${JSON.stringify(framesConfig)}

        STRICT LOGIC:
        1. Input is an array of frames. Output MUST be an array of "prompts" of exactly the same length.
        2. INDEX MAPPING IS CRITICAL. Prompt at index 0 corresponds to Frame at index 0. Prompt at index 1 corresponds to Frame at index 1.
        
        3. IF FRAME FORMAT IS "Multi Panel":
           - The frame has a 'splitText' array with multiple items.
           - ACTION: Create ONE cohesive prompt that describes a Side-by-Side layout.
           - STRICT FORMAT:
             "Split Screen / Side-by-Side.
              Panel 1 (Kiri): [Action/Visual]. [Location].
              easter_egg: [Pop Culture]
              
              Panel 2 (Tengah/Kanan): [Action/Visual]. [Location].
              easter_egg: [Pop Culture]
              
              (IF 3 PANELS)
              Panel 3 (Kanan): [Action/Visual]"
           - RULE: The panels must be arranged HORIZONTALLY (Left to Right). NEVER use Top/Bottom split.
           - RULE (CRITICAL): JANGAN gunakan garis hitam pemisah, border, atau frame antar panel. Gunakan transisi warna alami atau komposisi yang menyatu. Latar belakang harus full color.
           
        4. IF FRAME FORMAT IS "Sequence":
           - TARGET: Create prompts for a sequential storyboard.
           - Frame 0 (First frame of sequence): Describe the visual scene fully based on the text.
           - Frame >0 (Subsequent frames): Start with 'Referensi dari Gambar sebelumnya, tapi...' then describe the action/change for THIS frame.
           - CRITICAL ERROR PREVENTION:
             * DO NOT include the text "Sequence X Frame" or "Frame X" inside the generated prompt.
             * DO NOT copy the description of Frame 1 into Frame 2.
             * Prompt 1 must match SplitText 1. Prompt 2 must match SplitText 2.
           
           [EXAMPLE SEQUENCE CORRECT OUTPUT]:
           - Prompt 0: 'Di dalam kelas. Sapi makan rumput di ladang.'
           - Prompt 1: 'Referensi dari Gambar sebelumnya, tapi kini sapi sedang berlari kencang.'
           - Prompt 2: 'Referensi dari Gambar sebelumnya, tapi kini sapi berlari bersama kuda.'
           
        5. TEXT OVERLAY RULE (V2.8 UPDATE):
           - IF the text contains words in ALL CAPS (e.g. "GAK SADAR DIRI"), you MUST include an instruction: "Teks besar '[WORD]' muncul di gambar dengan font tebal komik."
           - **SUBTITLE / HEADING RULE**: If the narrative looks like a Heading (e.g. "Tanda #3: ...", "Nomor 1: ..."), you MUST include instruction: "Teks besar '[FULL SUBTITLE]' muncul di tengah layar dengan font Headline tebal. Desain minimalis."

        6. FINANCIAL/MATH OVERLAY RULE (CRITICAL FOR V2.7):
           - IF the narrative contains monetary values or calculations (e.g., "sepuluh ribu", "tiga ratus ribu", "tiga juta enam ratus ribu"):
           - CONVERT words to digits (e.g., "tiga juta" -> "3M" or "3,000,000").
           - DETECT timeframe if present/implied (hari/bulan/tahun).
           - ADD INSTRUCTION: "Teks besar '[Angka] [Periode]' muncul melayang dengan font tebal digital."
           
        7. CRITICAL - CHARACTER PRESENCE (FALLBACK OBSERVER RULE):
           - IF the narrative is abstract/metaphorical and NO specific character fits:
           - YOU MUST INCLUDE "${narratorName}" in the prompt.
           - DESCRIBE him as OBSERVING the scene (e.g. "${narratorName} watching the situation").

        8. LOCATION & EASTER EGG RULES (MANDATORY):
           - Describe the setting in detail — use universal/international locations.
           - Include ${easterEggCount} "easter_egg" item(s): ${easterEggTypes.join(", ")}.
        
        9. CHARACTER DESCRIPTION RESTRICTIONS (STRICT):
           - DO NOT describe character clothing or physical appearance.
           - DO NOT use the word "Ilustrasi".
           - Rely ONLY on the Character Name for visual consistency via reference images.

        10. FRAMING & COMPOSITION RULES (MANDATORY):
           - MINIMUM FRAMING: "Half-Body Shot" (Setengah Badan) or "Full Body Shot".
           - VISIBILITY: At least one Reference Character MUST be visible in every frame.
           - PROHIBITION: DO NOT generate Extreme Close-ups of body parts (hands, feet) or objects without the character's face/body being visible.
           
        11. STYLE REQUIREMENT (MANDATORY):
           - Every single prompt MUST end with or contain this exact sentence: "${styleSuffix}"
           - This is non-negotiable for the visual consistency.

        RETURN JSON FORMAT ONLY. Output must be a JSON object with a "prompts" array of strings.
    `;

    let text = "";

    try {
        const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-preview',
            contents: promptContent,
            config: {
                systemInstruction: finalSystemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema
            }
        }));
        text = response.text || "";
    } catch (e: any) {
        throw new Error(`Prompt generation failed: ` + e.message);
    }
    
    if(!text) throw new Error("No response");
    
    // Clean potential markdown or conversation wrappers
    text = cleanJsonString(text);

    const data = JSON.parse(text) as { prompts: string[] };
    return data.prompts.map(p => applyNarratorSuffix(p, narratorName, narratorSuffix));
};

/**
 * Refines a specific prompt based on instruction using Gemini 3 Flash
 */
export const refineScenePrompt = async (
  context: string,
  characterList: string,
  narrativeChunk: string,
  currentPrompt: string,
  instruction: string,
  systemInstruction: string,
  narratorName: string = "Norman",
  narratorSuffix: string = "",
  styleSuffix: string = "Modern 2D webcomic style",
  easterEggCount: number = 1,
  easterEggTypes: string[] = ["pop culture"],
  negativePrompt: string = "",
  language: 'id' | 'en' = 'id',
  manualApiKey?: string,
  isCharacter: boolean = false
): Promise<string> => {
  const ai = getClient(manualApiKey);

  // Create a character-specific style suffix with white background if needed
  const finalStyleSuffix = isCharacter 
    ? styleSuffix.replace(/pastel color background/gi, "pure white background")
    : styleSuffix;

  // Process placeholders in system instruction
  const finalSystemInstruction = processSystemInstruction(systemInstruction, narratorName, finalStyleSuffix, easterEggCount, easterEggTypes, negativePrompt, language);

  const promptContent = `
    Refine the following Visual Prompt based on the User Instruction.
    Context: ${context}
    Characters: ${characterList}
    ${isCharacter ? `Target Character: ${narrativeChunk}` : `Narrative Chunk: ${narrativeChunk}`}
    Current Prompt: ${currentPrompt}
    User Instruction: ${instruction}

    Output ONLY the revised prompt text in ${language === 'en' ? 'ENGLISH' : 'INDONESIAN'}.
    
    CRITICAL: 
    - NEVER use "Karakter Utama" or "Main Character". 
    - ALWAYS use the specific character Name from the provided Characters list.
    ${isCharacter ? "- DESCRIBE clothing, physical appearance, and accessories in detail." : "- DO NOT describe clothing or physical appearance of the character (handled by style rules)."}
    - DO NOT use the word "Ilustrasi".
    - MAINTAIN the location description if present.
    - MAINTAIN "easter_egg" if present.
    - ${isCharacter ? 'MANDATORY: Include the phrase "Fullbody Shot".' : 'STRICTLY FORCE "Half-Body Shot" or wider. No close-ups of just hands/feet.'}
    ${isCharacter ? "- ENSURE the background is explicitly mentioned as 'pure white background'." : `- IF no character is present, ADD "${narratorName}" observing the scene.`}
    
    STYLE PRESERVATION:
    - The revised prompt MUST still contain: "${finalStyleSuffix}"
    - If it is missing, APPEND it to the end.
    
    CRITICAL OUTPUT RULE: Return ONLY the plain text string. Do NOT use JSON.
  `;

  // GEMINI
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite-preview',
    contents: promptContent,
    config: {
      systemInstruction: finalSystemInstruction, // Pass the persona
    }
  });

  let result = response.text || currentPrompt;
  result = result.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
  
  try {
      if (result.trim().startsWith('{')) {
          const parsed = JSON.parse(result);
          if (parsed.visualPrompt) return applyNarratorSuffix(parsed.visualPrompt, narratorName, narratorSuffix);
          if (parsed.prompt) return applyNarratorSuffix(parsed.prompt, narratorName, narratorSuffix);
      }
  } catch (e) {
      // Not JSON
  }

  return applyNarratorSuffix(result, narratorName, narratorSuffix);
};

/**
 * Transforms narrative text into a Voice Director version with emotion cues.
 */
export const transformToVoiceDirector = async (
  text: string,
  language: 'id' | 'en' = 'id',
  manualApiKey?: string
): Promise<string> => {
  const ai = getClient(manualApiKey);

  const systemInstruction = `Peran: Kamu adalah seorang Script Editor untuk Voice Over.

Tugas:
1. Analisis Teks: Baca dan pahami konteks serta emosi dari teks yang diberikan.
2. Tambahkan Keterangan Emosi: Sisipkan sound cues (keterangan suara) TEPAT SEBELUM frasa atau kata yang ingin diubah suaranya.
   - Gunakan HANYA list ini: [whisper], [sigh], [chuckle], [hesitate], [deadpan], [emphasize], [questioning], [trembling], [fast pace], [pause 2s].
   - PENTING: Sound cues harus tepat sesuai format list tersebut.
   - PENTING: Hindari meletakkan sound cue di akhir naskah.
   - BAHASA: Gunakan bahasa ${language === 'id' ? 'Indonesia' : 'Inggris'} untuk sound cues.
3. Penekanan Kata: Ubah kata-kata yang membutuhkan penekanan kuat atau emphasis menjadi HURUF KAPITAL SEMUA (ALL CAPS).
4. Output: Hanya berikan naskah hasil revisi tanpa pengantar atau penutup.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: text,
    config: {
      systemInstruction,
      temperature: 0.7,
    },
  });

  return response.text || text;
};

/**
 * Generates TTS audio from text using Gemini TTS model.
 */
export const generateTTS = async (
  text: string,
  voiceName: string,
  instruction: string,
  manualApiKey?: string
): Promise<{ data: string, mimeType: string }> => {
  const ai = getClient(manualApiKey);

  const prompt = instruction ? `${instruction}\n\nText to speak: ${text}` : text;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!inlineData?.data) {
    throw new Error("Failed to generate audio data from Gemini.");
  }

  return { data: inlineData.data, mimeType: inlineData.mimeType || 'audio/pcm;rate=24000' };
};

/**
 * Detects characters from the narrative and provides visual prompts for each.
 */
export const detectCharactersFromNarrative = async (
  context: string,
  narratorName: string = "Norman",
  styleSuffix: string = "Modern 2D webcomic style",
  language: 'id' | 'en' = 'id',
  manualApiKey?: string
): Promise<{ name: string; visualPrompt: string }[]> => {
  const ai = getClient(manualApiKey);

  // Create a character-specific style suffix with white background
  const charStyleSuffix = styleSuffix.replace(/pastel color background/gi, "pure white background");
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      characters: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Character name found in the narrative." },
            visualPrompt: { type: Type.STRING, description: "Visual description for image generation including characteristics, outfit, accessories, and style." }
          },
          required: ["name", "visualPrompt"]
        }
      }
    },
    required: ["characters"]
  };

  const promptContent = `
    Analyze the following narrative and detect all characters mentioned.
    For each character, provide their name and a detailed visual prompt for an AI image generator.
    
    Narrative: "${context}"
    
    RULES:
    1. Detect only characters that are actually mentioned or implied as active participants.
    2. If the narrator "${narratorName}" is mentioned or implied, include them.
    3. Character names MUST be 1-2 words only.
    4. Visual Prompt MUST include:
       - MANDATORY: Include the phrase "Fullbody Shot" to ensure the whole character is visible.
       - Character's physical characteristics (personality, vibe, signature pose).
       - Detailed outfit (clothing, style).
       - Accessories (hats, jewelry, tools, etc.).
       - Style Suffix: ${charStyleSuffix}
    5. Ensure the background is explicitly mentioned as "pure white background".
    6. Maximum 10 characters.
    7. Output in ${language === 'en' ? 'ENGLISH' : 'INDONESIAN'}.
    
    RETURN JSON FORMAT ONLY.
  `;

  console.log("Detecting characters with model: gemini-3.1-flash-lite-preview");
  try {
    const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: promptContent,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    }));

    console.log("Gemini response received for character detection");
    const text = cleanJsonString(response.text || "{}");
    console.log("Cleaned JSON text:", text);
    const data = JSON.parse(text);
    return data.characters || [];
  } catch (error: any) {
    console.error("Error in detectCharactersFromNarrative:", error);
    throw new Error(`Character detection failed: ${error.message}`);
  }
};

/**
 * Generates a visual prompt for a single character name.
 */
export const generateCharacterPrompt = async (
  name: string,
  context: string,
  narratorName: string = "Norman",
  styleSuffix: string = "Modern 2D webcomic style",
  language: 'id' | 'en' = 'id',
  manualApiKey?: string
): Promise<string> => {
  const ai = getClient(manualApiKey);

  // Create a character-specific style suffix with white background
  const charStyleSuffix = styleSuffix.replace(/pastel color background/gi, "pure white background");

  const promptContent = `
    Generate a detailed visual prompt for the character named "${name}" based on the following context.
    
    Context: "${context}"
    
    RULES:
    1. Visual Prompt MUST include:
       - MANDATORY: Include the phrase "Fullbody Shot" to ensure the whole character is visible.
       - Character's physical characteristics (personality, vibe, signature pose).
       - Detailed outfit (clothing, style).
       - Accessories (hats, jewelry, tools, etc.).
       - Style Suffix: ${charStyleSuffix}
    2. Ensure the background is explicitly mentioned as "pure white background".
    3. Output in ${language === 'en' ? 'ENGLISH' : 'INDONESIAN'}.
    
    RETURN ONLY THE PROMPT TEXT.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: promptContent,
    });

    return response.text.trim();
  } catch (error: any) {
    throw new Error(`Character prompt generation failed: ${error.message}`);
  }
};

/**
 * Generates an image using Gemini 2.5 Flash Image
 */
export const generateSceneImage = async (
  visualPrompt: string,
  refImages: ReferenceImage[],
  previousImage?: string,
  narratorName: string = "Norman",
  styleSuffix: string = "Modern 2D webcomic style",
  negativePrompt: string = "",
  manualApiKey?: string
): Promise<string> => {
  const ai = getClient(manualApiKey);
  
  // Construct the prompt parts
  const parts: any[] = [];
  let combinedText = "";

  let finalVisualPrompt = visualPrompt;

  // Filter Banned Words from Prompt (Client-side safety)
  if (negativePrompt.trim()) {
      const bannedList = negativePrompt.split(',').map(w => w.trim()).filter(w => w);
      bannedList.forEach(word => {
          const regex = new RegExp(word, 'gi');
          finalVisualPrompt = finalVisualPrompt.replace(regex, "");
      });
  }

  // V2.13: INTELLIGENT FALLBACK OBSERVER LOGIC
  if (refImages.length === 1 && refImages[0].name.toLowerCase().includes(narratorName.toLowerCase())) {
      if (!finalVisualPrompt.toLowerCase().includes(narratorName.toLowerCase())) {
           finalVisualPrompt += ` . ${narratorName} is standing in the scene, observing quietly (Half-Body Shot).`;
      }
  }

  // 1. Add Reference Images
  if (refImages.length > 0) {
      refImages.forEach((img, index) => {
          const mimeType = img.data.split(';')[0].split(':')[1] || "image/jpeg";
          parts.push({
              inlineData: {
                  mimeType: mimeType, 
                  data: img.data.split(',')[1] 
              }
          });
          combinedText += `Reference image ${index + 1} represents character: ${img.name}.\n`;
      });
  }

  // FALLBACK STYLE INSTRUCTION (Always applied, even if no ref)
  combinedText += `STYLE REFERENCE (MANDATORY):
  Use the defined Modern 2D Webcomic Style.
  Characteristics: Pastel background, bold clean lines, cel-shading, cinematic lighting.
  DO NOT draw the specific character "${narratorName}" UNLESS explicitly requested in the prompt or if no other character is present.\n`;

  // 2. Add Previous Image for Sequence Consistency
  if (previousImage) {
      const mimeType = previousImage.split(';')[0].split(':')[1] || "image/jpeg";
      parts.push({
          inlineData: {
              mimeType: mimeType, 
              data: previousImage.split(',')[1]
          }
      });
      combinedText += `PREVIOUS FRAME (Reference for continuity): Use this image as the starting point. Modify it based on the prompt below.\n`;
  }

  // 3. Add the Visual Prompt
  const finalRequestPrompt = `
    Generate a scene based on this prompt: "${finalVisualPrompt}".
    Style Description: ${styleSuffix}.
    ${refImages.length > 0 ? "Use the provided reference images for character consistency." : `Use '${narratorName}' ART STYLE (Flat colors, thick outlines).`}
    ${previousImage ? "EDIT/MODIFY the Previous Frame to match the new action/description. Keep style consistent." : ""}
    IMPORTANT: If the prompt asks for 'Text Overlay' or 'Teks besar', ensure the text is rendered clearly and legibly.
    CRITICAL: For Multi-Panel or Split Screen images, DO NOT use black lines, borders, or frames to separate the panels.
    ${styleSuffix.includes("pure white background") 
      ? "FRAMING REQUIREMENT: full body shot. Ensure the entire character is visible from head to toe (Full Body Shot). Do not crop the head or feet. The character must be centered."
      : "FRAMING REQUIREMENT: Ensure the character is visible from at least the waist up (Half-Body Shot). Do not crop the head. Do not make it an extreme close-up of objects/hands only."}
    ${negativePrompt ? `NEGATIVE PROMPT (DO NOT INCLUDE): ${negativePrompt}` : ""}
  `;
  
  combinedText += finalRequestPrompt;
  parts.push({ text: combinedText });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
        parts: parts
    },
    config: {
        imageConfig: {
            aspectRatio: "16:9"
        }
    }
  });

  let responseText = "";
  for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
      }
      if (part.text) {
          responseText += part.text;
      }
  }

  const finishReason = response.candidates?.[0]?.finishReason;
  throw new Error(`No image generated. Finish Reason: ${finishReason}. Response: ${responseText}`);
};