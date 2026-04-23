import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ReferenceImage } from "../types";
import { getClient, processSystemInstruction, cleanJsonString, applyNarratorSuffix } from "./baseClient";

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
    
    ⚠️ STRICT LOCATION PROHIBITION (NON-NEGOTIABLE):
    - The visual prompt MUST NEVER contain any location, place, background, setting, indoor, outdoor, spatial context, or environmental description.
    - ONLY describe: (1) Character action/pose/expression, (2) Easter egg items.

    🚫 PROHIBITED EASTER EGG TYPES (DO NOT USE — COPYRIGHTS):
    - Star Wars, Iron Man, Spider-Man, or any Marvel/DC superhero characters
    - Any other copyrighted characters, brands, or IP-protected references
    - Use ONLY generic pop culture references or public domain items instead.

    CRITICAL: 
    - NEVER use "Karakter Utama" or "Main Character". 
    - ALWAYS use the specific character Name from the provided Characters list.
    ${isCharacter ? "- DESCRIBE clothing, physical appearance, and accessories in detail." : "- DO NOT describe clothing or physical appearance of the character (handled by style rules)."}
    - DO NOT use the word "Ilustrasi".
    - DO NOT include any location or background setting in the visual description.
    - MAINTAIN "easter_egg" if present.
    - ${isCharacter ? 'MANDATORY: Include the phrase "Fullbody Shot".' : 'STRICTLY FORCE "Half-Body Shot" or wider. No close-ups of just hands/feet.'}
    - ENSURE the background is explicitly mentioned as "pure white background".
    
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