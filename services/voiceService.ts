import { GoogleGenAI, Modality } from "@google/genai";
import { getClient } from "./baseClient";

/**
 * Generates TTS audio from text using Gemini 3.1 Flash TTS model.
 * Supports speaker profile, scene setting, director's notes, and inline audio tags.
 */
export const generateTTS = async (
  text: string,
  voiceName: string,
  speakerProfile: string,
  scene: string,
  directorNotes: string,
  manualApiKey?: string
): Promise<{ data: string, mimeType: string }> => {
  const ai = getClient(manualApiKey);

  // Build structured prompt following Gemini 3.1 TTS best practices
  let prompt = "";

  if (speakerProfile || scene || directorNotes) {
    prompt += "[Audio Profile]\n";
    if (speakerProfile) prompt += `${speakerProfile}\n`;
    if (scene) prompt += `Scene: ${scene}\n`;
    if (directorNotes) prompt += `[Director's Notes]\n${directorNotes}\n`;
    prompt += "\n";
  }

  prompt += `Text to speak:\n${text}`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
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