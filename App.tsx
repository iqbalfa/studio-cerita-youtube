import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppState, DEFAULT_SYSTEM_PROMPT, ReferenceImage, StoryScene, LLMProvider, ILMU_LIDI_STYLE, ILMU_SURVIVAL_STYLE, ILMU_NYANTUY_STYLE, ILMU_PSIKOLOGI_STYLE } from './types/types';
import { Layout, TabId } from './components/Layout';
import FileUpload from './components/FileUpload';
import StoryTable from './components/StoryTable';
import StoryTab from './components/StoryTab';
import VoiceTab from './components/VoiceTab';
import StoryboardTab from './components/StoryboardTab';
import AudioPlayer from './components/AudioPlayer';
import { Icons } from './utils/icons';
import { distributeItems, distributeText, enforceTTSWordRange } from './utils/textUtils';
import { createAudioBlob } from './utils/audioUtils';
import { TRANSLATIONS } from './i18n/translations';
import { 
  analyzeNarrativeToScenes, 
  generateSceneImage, 
  refineScenePrompt, 
  generatePromptsFromFrames,
  detectCharactersFromNarrative,
  generateCharacterPrompt,
  generateTTS
} from './services/geminiService';

// New structured TTS presets for Gemini 3.1 Flash TTS
// Each preset has: speakerProfile, scene, directorNotes
const TTS_PRESETS: Record<string, {
  speakerProfile: string;
  scene: string;
  directorNotes: string;
}> = {
  'Ilmu Lidi': {
    speakerProfile: "A 20-something Indonesian guy doing YouTube narration. Internal monologue is permanently amused — he narrates facts while internally going 'bro, that's insane', 'are you serious', 'nah no way'. The contrast between his calm delivery and absurd content is what makes it funny. Uses casual 'gue/gua' style. Treats subscribers like close friends.",
    scene: "Recording in a home studio setup. You can hear the mic and the energy of someone who's been editing all day.",
    directorNotes: "TEMPO: Normal speed throughout the entire paragraph. Do not speed up, do not slow down. PITCH: Neutral and consistent from start to finish. Do not go higher, do not go lower. Deliver each sentence at the same steady pace. The humor comes from what you say and the personality in your words, not from vocal variation."
  },
  'Ilmu Survival': {
    speakerProfile: "A tough, experienced survival expert in his 30s. Voice is deep, steady, and authoritative — like someone who's been through real situations. Speaks with quiet confidence, not arrogance.",
    scene: "Standing in a dense forest at dawn, surrounded by tall trees and morning mist. Quiet except for distant bird calls.",
    directorNotes: "Read this paragraph with serious, grounded energy. Use dramatic pauses before critical survival tips — let tension build. When mentioning dangers, drop your pitch slightly. Sound like someone who wants to make sure you survive."
  },
  'Ilmu Nyantuy': {
    speakerProfile: "A playful, witty Indonesian guy in his 20s. Voice is light, energetic, and infectious with natural comedic timing. Speaks like your funniest friend who knows when to be serious.",
    scene: "In a casual living room, lounging on a couch, relaxed and cozy. Occasional background sounds of daily life.",
    directorNotes: "Deliver with playful energy and deadpan humor. Use comedic timing — pause before punchlines. Mix excitement with casual sarcasm. When something's funny, let it show in your voice. Keep the vibe light but still get the point across."
  },
  'Ilmu Psikologi': {
    speakerProfile: "A warm, empathetic Indonesian psychologist in her 30s. Voice is soft, clear, and genuinely caring — like someone who truly understands human struggles. Speaks with quiet confidence and real empathy.",
    scene: "In a quiet, comfortable consultation room with soft lighting and warm tones. Peaceful and private.",
    directorNotes: "Speak with calm, measured warmth. Slow down for complex concepts — give listeners time to absorb. Show genuine empathy, especially for sensitive topics. Use subtle upward intonation for insights. Sound like a trusted friend who's also an expert."
  }
};

const App: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<AppState>({
    contextNarrative: '',
    targetParagraph: '',
    // characterList removed, derived from refImages
    customPrompt: DEFAULT_SYSTEM_PROMPT,
    refImages: [], 
    scenes: [],
    isAnalyzing: false,
    analysisError: undefined,
    narratorName: 'Ilmu Lidi',
    narratorSuffix: '',
    stylePreset: 'Ilmu Lidi',
    styleSuffix: ILMU_LIDI_STYLE,
    easterEggCount: 1,
    easterEggTypes: ['pop culture'],
    negativePrompt: '',
    language: 'id',
    geminiApiKey: '',
    isDetectingCharacters: false,
    globalSourceRefs: [],
    voiceDirectorVersion: '',
    ttsVoice: 'Iapetus',
    ttsPreset: 'Ilmu Lidi',
    ttsSpeakerProfile: TTS_PRESETS['Ilmu Lidi'].speakerProfile,
    ttsScene: TTS_PRESETS['Ilmu Lidi'].scene,
    ttsDirectorNotes: TTS_PRESETS['Ilmu Lidi'].directorNotes
  });

  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  const [generatedAudioUrls, setGeneratedAudioUrls] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'story' | 'voice' | 'storyboard'>('story');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generateAllProgress, setGenerateAllProgress] = useState("");
  const cancelGenerationRef = useRef(false);

  const t = TRANSLATIONS[state.language];

  // Load API key from localStorage on mount
  React.useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
        setState(p => ({ ...p, geminiApiKey: savedKey }));
    }
  }, []);

  // Save API key to localStorage when it changes
  React.useEffect(() => {
    if (state.geminiApiKey) {
        localStorage.setItem('gemini_api_key', state.geminiApiKey);
    }
  }, [state.geminiApiKey]);

  const handleConnectKey = async () => {
    await (window as any).aistudio.openSelectKey();
    setState(p => ({ ...p, hasApiKey: true }));
  };

  const handleContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState(prev => ({ ...prev, contextNarrative: e.target.value }));
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState(prev => ({ ...prev, targetParagraph: e.target.value }));
  };

  const handleGenerateTTS = async () => {
    if (!state.voiceDirectorVersion.trim()) return;

    setIsGeneratingTTS(true);
    setGeneratedAudioUrls([]);

    try {
        const preset = TTS_PRESETS[state.ttsPreset];
        const speakerProfile = state.ttsPreset === 'Custom' ? state.ttsSpeakerProfile : preset.speakerProfile;
        const scene = state.ttsPreset === 'Custom' ? state.ttsScene : preset.scene;
        const directorNotes = state.ttsPreset === 'Custom' ? state.ttsDirectorNotes : preset.directorNotes;

        const textToSpeak = state.voiceDirectorVersion;

        const result = await generateTTS(
            textToSpeak,
            state.ttsVoice,
            speakerProfile,
            scene,
            directorNotes,
            state.geminiApiKey
        );

        const blob = createAudioBlob(result.data, result.mimeType);
        setGeneratedAudioUrls([URL.createObjectURL(blob)]);
    } catch (error: any) {
        alert("TTS Error: " + error.message);
    } finally {
        setIsGeneratingTTS(false);
    }
  };

  const handleRefImagesChange = (images: ReferenceImage[]) => {
    setState(prev => ({ ...prev, refImages: images }));
  };

  const handleDeleteImage = (id: string) => {
    setState(prev => ({
      ...prev,
      refImages: prev.refImages.filter(img => img.id !== id)
    }));
  };

  const handleGenerateCharacters = async () => {
    console.log("handleGenerateCharacters clicked");
    if (!state.contextNarrative.trim()) {
        console.log("Context narrative is empty");
        alert("Mohon isi Konteks Narasi terlebih dahulu.");
        return;
    }


    console.log("Starting character detection...");
    setState(prev => ({ ...prev, isDetectingCharacters: true }));

    try {
        console.log("Detecting characters from narrative...");
        const detected = await detectCharactersFromNarrative(
            state.contextNarrative,
            state.narratorName || 'Norman',
            state.styleSuffix,
            state.language,
            state.geminiApiKey
        );
        console.log("Detected characters:", detected);

        if (detected.length === 0) {
            alert("Tidak ada karakter baru yang terdeteksi dalam narasi.");
        }

        const newRefImages: ReferenceImage[] = detected.map((char, idx) => ({
            id: `gen-char-${Date.now()}-${idx}`,
            name: char.name,
            visualPrompt: char.visualPrompt,
            data: '', // No image yet
            isGenerating: false
        }));

        setState(prev => {
            const combined = [...prev.refImages];
            console.log("Current refImages count:", combined.length);
            // Add only if not already exists by name
            newRefImages.forEach(newImg => {
                if (!combined.some(existing => existing.name.toLowerCase() === newImg.name.toLowerCase())) {
                    if (combined.length < 10) {
                        console.log("Adding new character:", newImg.name);
                        combined.push(newImg);
                    } else {
                        console.log("Max characters reached, skipping:", newImg.name);
                    }
                } else {
                    console.log("Character already exists, skipping:", newImg.name);
                }
            });
            return { ...prev, refImages: combined, isDetectingCharacters: false };
        });
    } catch (error: any) {
        console.error("Error in handleGenerateCharacters:", error);
        alert("Gagal mendeteksi karakter: " + error.message);
        setState(prev => ({ ...prev, isDetectingCharacters: false }));
    }
  };

  const handleAddCharacter = () => {
    if (state.refImages.length >= 10) {
        alert("Batas maksimum 10 karakter tercapai.");
        return;
    }
    const newChar: ReferenceImage = {
        id: `manual-char-${Date.now()}`,
        name: '',
        visualPrompt: '',
        data: '',
        isGenerating: false
    };
    setState(prev => ({ ...prev, refImages: [...prev.refImages, newChar] }));
  };

  const handleGenerateCharacterPrompt = async (id: string) => {
    const char = state.refImages.find(img => img.id === id);
    if (!char || !char.name.trim()) return;

    setState(prev => ({
        ...prev,
        refImages: prev.refImages.map(img => img.id === id ? { ...img, isGenerating: true } : img)
    }));

    try {
        const prompt = await generateCharacterPrompt(
            char.name,
            state.contextNarrative,
            state.narratorName,
            state.styleSuffix,
            state.language,
            state.geminiApiKey
        );

        setState(prev => ({
            ...prev,
            refImages: prev.refImages.map(img => img.id === id ? { ...img, isGenerating: false, visualPrompt: prompt } : img)
        }));
    } catch (error: any) {
        alert("Gagal generate prompt karakter: " + error.message);
        setState(prev => ({
            ...prev,
            refImages: prev.refImages.map(img => img.id === id ? { ...img, isGenerating: false } : img)
        }));
    }
  };

  const handleGenerateCharacterImage = async (id: string) => {
    const char = state.refImages.find(img => img.id === id);
    if (!char || !char.visualPrompt) return;

    setState(prev => ({
        ...prev,
        refImages: prev.refImages.map(img => img.id === id ? { ...img, isGenerating: true } : img)
    }));

    try {
        // Create a character-specific style suffix with white background
        const charStyleSuffix = state.styleSuffix.replace(/pastel color background/gi, "pure white background");

        // Map globalSourceRefs to ReferenceImage format for generateSceneImage
        const sourceRefsAsImages: ReferenceImage[] = state.globalSourceRefs.map((data, idx) => ({
            id: `source-ref-${idx}`,
            name: `Reference ${idx + 1}`,
            data: data
        }));

        const imageUrl = await generateSceneImage(
            char.visualPrompt,
            sourceRefsAsImages,
            undefined,
            state.narratorName,
            charStyleSuffix,
            state.negativePrompt,
            state.geminiApiKey
        );

        setState(prev => ({
            ...prev,
            refImages: prev.refImages.map(img => img.id === id ? { ...img, isGenerating: false, data: imageUrl } : img)
        }));
    } catch (error: any) {
        alert("Gagal generate gambar karakter: " + error.message);
        setState(prev => ({
            ...prev,
            refImages: prev.refImages.map(img => img.id === id ? { ...img, isGenerating: false } : img)
        }));
    }
  };

  const handleCharacterPromptChange = (id: string, newPrompt: string) => {
    setState(prev => ({
        ...prev,
        refImages: prev.refImages.map(img => img.id === id ? { ...img, visualPrompt: newPrompt } : img)
    }));
  };

  const handleGlobalSourceRefsChange = (refs: string[]) => {
    setState(prev => ({
        ...prev,
        globalSourceRefs: refs
    }));
  };

  const handleRefineCharacterPrompt = async (id: string, instruction: string) => {
    const char = state.refImages.find(img => img.id === id);
    if (!char || !char.visualPrompt || !instruction.trim()) return;

    setState(prev => ({
        ...prev,
        refImages: prev.refImages.map(img => img.id === id ? { ...img, isGenerating: true } : img)
    }));

    try {
        const refined = await refineScenePrompt(
            state.contextNarrative,
            state.refImages.map(r => r.name).join(", "),
            char.name,
            char.visualPrompt,
            instruction,
            state.customPrompt,
            state.narratorName,
            state.narratorSuffix,
            state.styleSuffix,
            state.easterEggCount,
            state.easterEggTypes,
            state.negativePrompt,
            state.language,
            state.geminiApiKey,
            true // isCharacter
        );

        setState(prev => ({
            ...prev,
            refImages: prev.refImages.map(img => img.id === id ? { ...img, isGenerating: false, visualPrompt: refined } : img)
        }));
    } catch (error: any) {
        alert("Gagal refine prompt: " + error.message);
        setState(prev => ({
            ...prev,
            refImages: prev.refImages.map(img => img.id === id ? { ...img, isGenerating: false } : img)
        }));
    }
  };

  const getCharacterListString = () => {
      return state.refImages.map(img => img.name).join(', ') || t.noChar;
  };

  const handleAnalyzeStory = async () => {
    if (!state.targetParagraph.trim()) {
        alert(t.alertTarget);
        return;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, analysisError: undefined, scenes: [] }));

    try {
      const derivedCharList = getCharacterListString();

      const scenes = await analyzeNarrativeToScenes(
        state.contextNarrative,
        state.targetParagraph,
        derivedCharList,
        state.customPrompt,
        state.narratorName,
        state.narratorSuffix,
        state.styleSuffix,
        state.easterEggCount,
        state.easterEggTypes,
        state.negativePrompt,
        state.language,
        state.geminiApiKey
      );

      // Column 1: narrativeText = voiceDirectorVersion stripped of sound cues, per-scene chunk
      // Column 2: splitText = sub-distribution from Column 1 of the SAME scene (not cross-scene)
      const voiceText = state.voiceDirectorVersion.trim().replace(/\[[\s\w]+\]/g, '').trim();
      const distributed = voiceText ? distributeText(voiceText, scenes.length) : [];

      const enforceChunk = (s: string): string => {
        const sWords = s.split(/\s+/).filter(w => w);
        if (sWords.length <= 15) return s;
        const breakpoints = [',', 'dan', 'atau', 'tetapi', 'karena', 'jadi', 'bahwa', 'jika', 'meski', 'namun', '&', '-'];
        const allTokens = s.split(/(\s+)/);
        const result: string[] = [];
        let current: string[] = [];
        let wordCount = 0;

        for (let i = 0; i < allTokens.length; i++) {
          const token = allTokens[i];
          if (token.trim() === '') { current.push(token); continue; }
          wordCount++;
          current.push(token);
          const isBp = breakpoints.some(bp => token.toLowerCase().replace(/[.,;!?]*$/, '') === bp);
          if ((isBp || wordCount >= 10) && wordCount <= 15) {
            if (isBp || wordCount === 15 || i === allTokens.length - 1) {
              const last = current[current.length - 1];
              if (last && !last.endsWith('.')) {
                current[current.length - 1] = last.replace(/[,;!?]*$/, '') + '.';
              }
              result.push(current.join('').trim());
              current = [];
              wordCount = 0;
            }
          }
        }
        if (current.length > 0) {
          const joined = current.join('').trim();
          const last = current[current.length - 1] || '';
          if (last && !last.endsWith('.')) {
            result.push(joined.replace(/[,;!?]*$/, '') + '.');
          } else {
            result.push(joined);
          }
        }
        return result.join(' ');
      };

      const scenesWithSplitText = scenes.map((scene, idx) => {
        // Column 1 = its own distributed chunk (enforced ~15 words)
        const sceneText = distributed[idx] || scene.narrativeText;
        const enforcedText = enforceChunk(sceneText);

        // Column 2 = sub-distribution of ITS OWN Column 1 text into its own frames
        const subDistributed = distributeText(enforcedText, scene.frames.length);

        return {
          ...scene,
          narrativeText: enforcedText,
          frames: scene.frames.map((frame, frameIdx) => ({
            ...frame,
            splitText: [subDistributed[frameIdx] || subDistributed[0] || enforcedText]
          }))
        };
      });

      setState(prev => ({ ...prev, scenes: scenesWithSplitText, isAnalyzing: false }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        analysisError: error.message || "Failed to analyze story" 
      }));
    }
  };

  const handleSaveNarrative = useCallback((sceneId: string, newText: string) => {
    setState(prev => ({
        ...prev,
        scenes: prev.scenes.map(scene => {
            if (scene.id !== sceneId) return scene;

            // Strip sound cues from edited text (Column 1)
            const sourceText = newText.replace(/\[[\s\w]+\]/g, '').trim();

            // Determine number of splits from frame count (set by format in handleFormatChange)
            let targetPartsCount = scene.frames.length;
            if (targetPartsCount === 1) {
                const fmt = scene.frames[0]?.format || 'Single Panel';
                if (fmt.includes('Multi') || fmt.includes('Sequence')) {
                    const match = fmt.match(/\((\d+)\)/);
                    targetPartsCount = match ? parseInt(match[1]) : 2;
                }
            }

            // Distribute text into frame count chunks
            const distributed = distributeText(sourceText, targetPartsCount);

            // Enforce max 15 words per chunk
            const enforcedSplitTexts = distributed.map(s => {
                const sWords = s.split(/\s+/).filter(w => w);
                if (sWords.length <= 15) return s;
                const breakpoints = [',', 'dan', 'atau', 'tetapi', 'karena', 'jadi', 'bahwa', 'jika', 'meski', 'namun', '&', '-'];
                const allTokens = s.split(/(\s+)/);
                const result: string[] = [];
                let current: string[] = [];
                let wordCount = 0;

                for (let i = 0; i < allTokens.length; i++) {
                    const token = allTokens[i];
                    if (token.trim() === '') { current.push(token); continue; }
                    wordCount++;
                    current.push(token);
                    const isBp = breakpoints.some(bp => token.toLowerCase().replace(/[.,;!?]*$/, '') === bp);
                    if ((isBp || wordCount >= 10) && wordCount <= 15) {
                        if (isBp || wordCount === 15 || i === allTokens.length - 1) {
                            const last = current[current.length - 1];
                            if (last && !last.endsWith('.')) {
                                current[current.length - 1] = last.replace(/[,;!?]*$/, '') + '.';
                            }
                            result.push(current.join('').trim());
                            current = [];
                            wordCount = 0;
                        }
                    }
                }
                if (current.length > 0) {
                    const joined = current.join('').trim();
                    const last = current[current.length - 1] || '';
                    if (last && !last.endsWith('.')) {
                        result.push(joined.replace(/[,;!?]*$/, '') + '.');
                    } else {
                        result.push(joined);
                    }
                }
                return result.join(' ');
            });

            // Update frames: each frame gets 1 splitText slot (multi/single) or multiple (sequence)
            const updatedFrames = scene.frames.map((frame, idx) => {
                if (scene.frames.length > 1) {
                    return { ...frame, splitText: [enforcedSplitTexts[idx] || enforcedSplitTexts[enforcedSplitTexts.length - 1]] };
                } else {
                    return { ...frame, splitText: enforcedSplitTexts };
                }
            });

            return {
                ...scene,
                narrativeText: newText,
                frames: updatedFrames
            };
        })
    }));
  }, []);

  const handleAddScene = useCallback((indexToInsertAfter?: number) => {
    const newScene: StoryScene = {
        id: `scene-${Date.now()}`,
        narrativeText: t.newSceneText,
        frames: [{
            id: `frame-${Date.now()}`,
            format: "Single Panel",
            visualPrompt: "", 
            splitText: [t.newSceneText],
            isGenerating: false
        }],
        isRestructuring: false
    };

    setState(prev => {
        const newScenes = [...prev.scenes];
        if (typeof indexToInsertAfter === 'number') {
            newScenes.splice(indexToInsertAfter + 1, 0, newScene);
        } else {
            newScenes.push(newScene);
        }
        return { ...prev, scenes: newScenes };
    });
  }, []);

  const handleDeleteScene = useCallback((sceneId: string) => {
    if (window.confirm(t.confirmDelete)) {
        setState(prev => ({
            ...prev,
            scenes: prev.scenes.filter(s => s.id !== sceneId)
        }));
    }
  }, [t.confirmDelete]);

  const handleFormatChange = useCallback(async (sceneId: string, format: "Single Panel" | "Multi Panel" | "Sequence", count: number) => {
    setState(prev => ({
        ...prev,
        scenes: prev.scenes.map(scene => {
            if (scene.id !== sceneId) return scene;

            const targetPartsCount = format === 'Single Panel' ? 1 : count;
            const textParts = distributeText(scene.narrativeText, targetPartsCount);

            if (format === 'Sequence') {
                const targetCount = count;
                let existingFrames = [...scene.frames];
                const resultFrames = [];

                for (let i = 0; i < targetCount; i++) {
                    const formatLabel = `Sequence ${i + 1}/${targetCount}`;
                    const splitTextForFrame = [textParts[i]];
                    const initialPrompt = i === 0 ? "" : "Referensi dari Gambar sebelumnya, tapi... ";

                    if (i < existingFrames.length) {
                        resultFrames.push({
                            ...existingFrames[i],
                            format: formatLabel,
                            splitText: splitTextForFrame
                        });
                    } else {
                        resultFrames.push({
                            id: `frame-${Date.now()}-${i}`,
                            format: formatLabel,
                            visualPrompt: initialPrompt,
                            splitText: splitTextForFrame,
                            isGenerating: false
                        });
                    }
                }
                return { ...scene, frames: resultFrames };

            } else {
                const formatLabel = format === 'Single Panel' ? 'Single Panel' : `Multi Panel (${count})`;
                const existingFrame = scene.frames[0];
                
                const newFrame = {
                    ...existingFrame,
                    format: formatLabel,
                    splitText: textParts
                };
                
                return { ...scene, frames: [newFrame] };
            }
        })
    }));
  }, []);

  const handleGeneratePrompts = useCallback(async (sceneId: string) => {
      const scene = state.scenes.find(s => s.id === sceneId);
      if (!scene) return;


      setState(prev => ({
          ...prev,
          scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, isGeneratingPrompts: true } : s)
      }));

      try {
          const derivedCharList = getCharacterListString();
          
          const prompts = await generatePromptsFromFrames(
              state.contextNarrative,
              derivedCharList,
              scene.narrativeText,
              scene.frames,
              state.customPrompt,
              state.narratorName,
              state.narratorSuffix,
              state.styleSuffix,
              state.easterEggCount,
              state.easterEggTypes,
              state.negativePrompt,
              state.language,
              state.geminiApiKey
          );

          // Post-process: ensure every prompt has style suffix + easter egg
          const validatedPrompts = prompts.map((p, i) => {
              let fixed = p.trim();
              if (!fixed.toLowerCase().includes("easter_egg")) {
                  fixed += " easter_egg:心头一震 emoji";
              }
              // Check if prompt ENDS with styleSuffix (not just contains "white background")
              if (!fixed.endsWith(state.styleSuffix.trim())) {
                  fixed += " " + state.styleSuffix;
              }
              return fixed;
          });

          setState(prev => ({
              ...prev,
              scenes: prev.scenes.map(s => s.id === sceneId ? { 
                  ...s, 
                  isGeneratingPrompts: false,
                  frames: s.frames.map((f, i) => ({
                      ...f,
                      visualPrompt: validatedPrompts[i] || f.visualPrompt // Fallback
                  }))
              } : s)
          }));

      } catch (error: any) {
          setState(prev => ({
              ...prev,
              scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, isGeneratingPrompts: false } : s)
          }));
          alert("Gagal membuat prompt: " + error.message);
      }
  }, [state.scenes, state.contextNarrative, state.refImages, state.customPrompt, state.narratorName, state.styleSuffix, state.easterEggCount, state.easterEggTypes, state.negativePrompt, state.language, state.hasApiKey]);

  const handleUpdatePrompt = useCallback((sceneId: string, frameId: string, newPrompt: string) => {
    setState(prev => ({
      ...prev,
      scenes: prev.scenes.map(scene => {
        if (scene.id !== sceneId) return scene;
        return {
          ...scene,
          frames: scene.frames.map(frame => 
            frame.id === frameId ? { ...frame, visualPrompt: newPrompt } : frame
          )
        };
      })
    }));
  }, []);

  const handleUpdateSplitText = useCallback((sceneId: string, frameId: string, newSplitText: string[]) => {
    setState(prev => ({
      ...prev,
      scenes: prev.scenes.map(scene => {
        if (scene.id !== sceneId) return scene;
        return {
          ...scene,
          frames: scene.frames.map(frame => 
            frame.id === frameId ? { ...frame, splitText: newSplitText } : frame
          )
        };
      })
    }));
  }, []);


  const handleRefinePrompt = useCallback(async (sceneId: string, frameId: string, instruction: string) => {
    if (!instruction.trim()) return;


    setState(prev => ({
      ...prev,
      scenes: prev.scenes.map(s => s.id === sceneId ? {
        ...s,
        frames: s.frames.map(f => f.id === frameId ? { ...f, isRefining: true } : f)
      } : s)
    }));

    const scene = state.scenes.find(s => s.id === sceneId);
    if (!scene) return;
    const frame = scene.frames.find(f => f.id === frameId);
    if (!frame) return;

    try {
        const derivedCharList = getCharacterListString();

        const newPrompt = await refineScenePrompt(
            state.contextNarrative,
            derivedCharList,
            scene.narrativeText,
            frame.visualPrompt,
            instruction,
            state.customPrompt,
            state.narratorName,
            state.narratorSuffix,
            state.styleSuffix,
            state.easterEggCount,
            state.easterEggTypes,
            state.negativePrompt,
            state.language,
            state.geminiApiKey,
            false // isCharacter
        );

        setState(prev => ({
            ...prev,
            scenes: prev.scenes.map(s => s.id === sceneId ? {
                ...s,
                frames: s.frames.map(f => f.id === frameId ? { ...f, isRefining: false, visualPrompt: newPrompt } : f)
            } : s)
        }));

    } catch (error: any) {
        setState(prev => ({
            ...prev,
            scenes: prev.scenes.map(s => s.id === sceneId ? {
                ...s,
                frames: s.frames.map(f => f.id === frameId ? { ...f, isRefining: false } : f)
            } : s)
        }));
        alert("Gagal merevisi prompt: " + error.message);
    }
  }, [state.scenes, state.contextNarrative, state.refImages, state.customPrompt, state.narratorName, state.styleSuffix, state.easterEggCount, state.easterEggTypes, state.negativePrompt, state.language, state.hasApiKey]);

  const handleGenerateImage = useCallback(async (sceneId: string, frameId: string, overridePreviousImage?: string) => {
    const scene = state.scenes.find(s => s.id === sceneId);
    if (!scene) return;
    
    const frameIndex = scene.frames.findIndex(f => f.id === frameId);
    if (frameIndex === -1) return;
    const frame = scene.frames[frameIndex];

    let previousImage: string | undefined = undefined;
    
    if (overridePreviousImage) {
        previousImage = overridePreviousImage;
    } else if (frameIndex > 0) {
        const prevFrame = scene.frames[frameIndex - 1];
        if (prevFrame.imageUrl) {
            previousImage = prevFrame.imageUrl;
        }
    }

    const currentPromptLower = frame.visualPrompt.toLowerCase();
    
    let relevantRefs = state.refImages.filter(img => 
        img.data && currentPromptLower.includes(img.name.toLowerCase())
    );

    if (previousImage && frameIndex > 0) {
        const prevFrame = scene.frames[frameIndex - 1];
        const prevPromptLower = prevFrame.visualPrompt.toLowerCase();
        
        relevantRefs = state.refImages.filter(img => {
            const inCurrent = img.data && currentPromptLower.includes(img.name.toLowerCase());
            const inPrevious = prevPromptLower.includes(img.name.toLowerCase());
            return inCurrent && !inPrevious;
        });
    }

    // V2.17 Update: Force Narrator ref if no character is detected
    if (relevantRefs.length === 0) {
        const narratorRef = state.refImages.find(img => img.data && img.name.toLowerCase().trim() === state.narratorName.toLowerCase().trim());
        if (narratorRef) {
            relevantRefs = [narratorRef];
        }
    }

    setState(prev => ({
      ...prev,
      scenes: prev.scenes.map(s => s.id === sceneId ? {
        ...s,
        frames: s.frames.map(f => f.id === frameId ? { ...f, isGenerating: true, error: undefined } : f)
      } : s)
    }));

    try {
      const imageUrl = await generateSceneImage(
          frame.visualPrompt, 
          relevantRefs, 
          previousImage,
          state.narratorName,
          state.styleSuffix,
          state.negativePrompt,
          state.geminiApiKey
      );
      
      setState(prev => ({
        ...prev,
        scenes: prev.scenes.map(s => s.id === sceneId ? {
            ...s,
            frames: s.frames.map(f => f.id === frameId ? { ...f, isGenerating: false, imageUrl } : f)
        } : s)
      }));
      
      return imageUrl; 
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        scenes: prev.scenes.map(s => s.id === sceneId ? {
            ...s,
            frames: s.frames.map(f => f.id === frameId ? { ...f, isGenerating: false, error: "GenAI Error: " + error.message } : f)
        } : s)
      }));
      throw error;
    }
  }, [state.scenes, state.refImages]);

  const handleGenerateSequence = useCallback(async (sceneId: string) => {
      const scene = state.scenes.find(s => s.id === sceneId);
      if (!scene) return;
      if (scene.frames.length < 2) return;

      setState(prev => ({
          ...prev,
          scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, isGeneratingSequence: true } : s)
      }));

      let lastGeneratedImage: string | undefined = undefined;

      for (let i = 0; i < scene.frames.length; i++) {
          const frame = scene.frames[i];
          try {
              const imageUrl = await handleGenerateImage(sceneId, frame.id, lastGeneratedImage);
              if (imageUrl) {
                  lastGeneratedImage = imageUrl;
              }
              
          } catch (e) {
              console.error(`Sequence generation failed at frame ${i}`, e);
              break; 
          }
      }

      setState(prev => ({
        ...prev,
        scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, isGeneratingSequence: false } : s)
      }));

  }, [state.scenes, handleGenerateImage]);

  const handleGenerateAllImages = useCallback(async () => {
      cancelGenerationRef.current = false;
      setIsGeneratingAll(true);
      setGenerateAllProgress("Starting...");

      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

      try {
          const pendingPromises: Promise<void>[] = [];
          let lastRequestTime = 0;

          for (let sIdx = 0; sIdx < state.scenes.length; sIdx++) {
              const scene = state.scenes[sIdx];
              let lastGeneratedImage: string | undefined = undefined;

              for (let fIdx = 0; fIdx < scene.frames.length; fIdx++) {
                  if (cancelGenerationRef.current) {
                      setGenerateAllProgress("Cancelled.");
                      setIsGeneratingAll(false);
                      return;
                  }

                  const frame = scene.frames[fIdx];
                  
                  if (frame.imageUrl) {
                      if (scene.type === 'sequence') {
                          lastGeneratedImage = frame.imageUrl;
                      }
                      continue; 
                  }

                  // Enforce 6 seconds between TRIGGERS to respect 10 RPM limit
                  const now = Date.now();
                  const timeSinceLastRequest = now - lastRequestTime;
                  if (lastRequestTime > 0 && timeSinceLastRequest < 6000) {
                      const waitTime = 6000 - timeSinceLastRequest;
                      setGenerateAllProgress(`Waiting ${Math.ceil(waitTime/1000)}s...`);
                      await delay(waitTime);
                  }
                  
                  if (cancelGenerationRef.current) {
                      setGenerateAllProgress("Cancelled.");
                      setIsGeneratingAll(false);
                      return;
                  }

                  setGenerateAllProgress(`Triggering Scene ${sIdx + 1}, Frame ${fIdx + 1}...`);
                  lastRequestTime = Date.now();

                  if (scene.type === 'sequence') {
                      // Sequential MUST await because next frame depends on this image
                      try {
                          const imageUrl = await handleGenerateImage(scene.id, frame.id, lastGeneratedImage);
                          if (imageUrl) {
                              lastGeneratedImage = imageUrl;
                          }
                      } catch (e) {
                          console.error(`Failed to generate image for Scene ${sIdx + 1}, Frame ${fIdx + 1}`, e);
                      }
                  } else {
                      // Non-sequential can run in parallel background
                      const p = handleGenerateImage(scene.id, frame.id).catch(e => {
                          console.error(`Failed to generate image for Scene ${sIdx + 1}, Frame ${fIdx + 1}`, e);
                      });
                      pendingPromises.push(p);
                  }
              }
          }
          
          if (pendingPromises.length > 0 && !cancelGenerationRef.current) {
              setGenerateAllProgress("Waiting for remaining images to complete...");
              await Promise.all(pendingPromises);
          }

          if (!cancelGenerationRef.current) {
              setGenerateAllProgress("Completed!");
          }
      } finally {
          setIsGeneratingAll(false);
      }
  }, [state.scenes, handleGenerateImage]);

  const handleCancelGenerateAll = useCallback(() => {
      cancelGenerationRef.current = true;
      setGenerateAllProgress("Cancelling...");
  }, []);

  const handleSaveProject = useCallback(() => {
    const projectData = {
        version: "2.18",
        timestamp: Date.now(),
        state: {
            contextNarrative: state.contextNarrative,
            targetParagraph: state.targetParagraph,
            customPrompt: state.customPrompt,
            refImages: state.refImages,
            scenes: state.scenes,
            narratorName: state.narratorName,
            narratorSuffix: state.narratorSuffix,
            stylePreset: state.stylePreset,
            styleSuffix: state.styleSuffix,
            easterEggCount: state.easterEggCount,
            easterEggTypes: state.easterEggTypes,
            negativePrompt: state.negativePrompt,
            language: state.language
        }
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `storyboard-norman-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [state]);

  const handleLoadProject = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const result = event.target?.result as string;
            const parsed = JSON.parse(result);
            
            // Basic validation
            if (!parsed.state || !Array.isArray(parsed.state.scenes)) {
                throw new Error("Invalid project file format");
            }

            // Restore state
            setState(prev => ({
                ...prev,
                contextNarrative: parsed.state.contextNarrative || "",
                targetParagraph: parsed.state.targetParagraph || "",
                customPrompt: parsed.state.customPrompt || DEFAULT_SYSTEM_PROMPT,
                refImages: parsed.state.refImages || [],
                scenes: parsed.state.scenes || [],
                isAnalyzing: false,
                analysisError: undefined,
                narratorName: parsed.state.narratorName || 'Norman',
                narratorSuffix: parsed.state.narratorSuffix || '',
                stylePreset: parsed.state.stylePreset || 'Ilmu Lidi',
                styleSuffix: parsed.state.styleSuffix || ILMU_LIDI_STYLE,
                easterEggCount: parsed.state.easterEggCount !== undefined ? parsed.state.easterEggCount : 1,
                easterEggTypes: parsed.state.easterEggTypes || ['pop culture'],
                negativePrompt: parsed.state.negativePrompt || '',
                language: parsed.state.language || 'id'
            }));
            
            alert("Project loaded successfully!");
        } catch (error: any) {
            alert("Failed to load project: " + error.message);
        }
        
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    reader.readAsText(file);
  }, []);

  const getStatusLabel = () => {
    if (state.stylePreset === 'Custom') return '⚠ CUSTOM STYLE';
    return `ACTIVE: ${state.stylePreset}`;
  };

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      isLoading={state.isAnalyzing || state.isDetectingCharacters || isGeneratingAll}
      language={state.language}
      onLanguageChange={(lang) => setState(p => ({...p, language: lang}))}
      onSaveProject={handleSaveProject}
      onLoadProject={handleLoadProject}
      apiKey={state.geminiApiKey}
      onApiKeyChange={(key) => setState(p => ({...p, geminiApiKey: key}))}
      narratorName={state.narratorName}
      stylePreset={state.stylePreset}
      onStylePresetChange={(val) => {
        if (val === 'Ilmu Lidi') {
          setState(p => ({
            ...p,
            narratorName: 'Ilmu Lidi',
            stylePreset: 'Ilmu Lidi',
            styleSuffix: ILMU_LIDI_STYLE,
            easterEggCount: 1,
            easterEggTypes: ['pop culture'],
            ttsVoice: 'Iapetus',
            ttsPreset: 'Ilmu Lidi',
            ttsSpeakerProfile: TTS_PRESETS['Ilmu Lidi'].speakerProfile,
            ttsScene: TTS_PRESETS['Ilmu Lidi'].scene,
            ttsDirectorNotes: TTS_PRESETS['Ilmu Lidi'].directorNotes
          }));
        } else if (val === 'ILMU SURVIVAL') {
          setState(p => ({
            ...p,
            narratorName: 'Ilmu Survival',
            stylePreset: 'ILMU SURVIVAL',
            styleSuffix: ILMU_SURVIVAL_STYLE,
            easterEggCount: 2,
            easterEggTypes: ['pop culture', 'khas indonesia'],
            ttsVoice: 'Iapetus',
            ttsPreset: 'Ilmu Survival',
            ttsSpeakerProfile: TTS_PRESETS['Ilmu Survival'].speakerProfile,
            ttsScene: TTS_PRESETS['Ilmu Survival'].scene,
            ttsDirectorNotes: TTS_PRESETS['Ilmu Survival'].directorNotes
          }));
        } else if (val === 'ILMU NYANTUY') {
          setState(p => ({
            ...p,
            narratorName: 'Ilmu Nyantuy',
            stylePreset: 'ILMU NYANTUY',
            styleSuffix: ILMU_NYANTUY_STYLE,
            easterEggCount: 2,
            easterEggTypes: ['pop culture', 'khas indonesia'],
            ttsVoice: 'Iapetus',
            ttsPreset: 'Ilmu Nyantuy',
            ttsSpeakerProfile: TTS_PRESETS['Ilmu Nyantuy'].speakerProfile,
            ttsScene: TTS_PRESETS['Ilmu Nyantuy'].scene,
            ttsDirectorNotes: TTS_PRESETS['Ilmu Nyantuy'].directorNotes
          }));
        } else if (val === 'ILMU PSIKOLOGI') {
          setState(p => ({
            ...p,
            narratorName: 'Ilmu Psikologi',
            stylePreset: 'ILMU PSIKOLOGI',
            styleSuffix: ILMU_PSIKOLOGI_STYLE,
            easterEggCount: 1,
            easterEggTypes: ['pop culture'],
            ttsVoice: 'Iapetus',
            ttsPreset: 'Ilmu Psikologi',
            ttsSpeakerProfile: TTS_PRESETS['Ilmu Psikologi'].speakerProfile,
            ttsScene: TTS_PRESETS['Ilmu Psikologi'].scene,
            ttsDirectorNotes: TTS_PRESETS['Ilmu Psikologi'].directorNotes
          }));
        } else {
          setState(p => ({ ...p, stylePreset: 'Custom' }));
        }
      }}
      statusLabel={getStatusLabel()}
    >

      <AnimatePresence mode="wait">
        {activeTab === 'story' && (
          <StoryTab 
            state={state}
            setState={setState}
            t={t}
            isAdvancedOpen={isAdvancedOpen}
            setIsAdvancedOpen={setIsAdvancedOpen}
            handleContextChange={handleContextChange}
            handleGenerateCharacters={handleGenerateCharacters}
            handleRefImagesChange={handleRefImagesChange}
            handleGenerateCharacterImage={handleGenerateCharacterImage}
            handleCharacterPromptChange={handleCharacterPromptChange}
            handleGenerateCharacterPrompt={handleGenerateCharacterPrompt}
            handleGlobalSourceRefsChange={handleGlobalSourceRefsChange}
          />
        )}

          {activeTab === 'voice' && (
          <VoiceTab
            state={state}
            setState={setState}
            t={t}
            handleTargetChange={handleTargetChange}
            handleGenerateTTS={handleGenerateTTS}
            isGeneratingTTS={isGeneratingTTS}
            generatedAudioUrls={generatedAudioUrls}
          />
        )}

          {activeTab === 'storyboard' && (
          <StoryboardTab
            state={state}
            t={t}
            handleAnalyzeStory={handleAnalyzeStory}
            handleGenerateImage={handleGenerateImage}
            handleGenerateSequence={handleGenerateSequence}
            handleUpdatePrompt={handleUpdatePrompt}
            handleRefinePrompt={handleRefinePrompt}
            handleFormatChange={handleFormatChange}
            handleSaveNarrative={handleSaveNarrative}
            handleAddScene={handleAddScene}
            handleDeleteScene={handleDeleteScene}
            handleUpdateSplitText={handleUpdateSplitText}
            handleGeneratePrompts={handleGeneratePrompts}
            handleGenerateAllImages={handleGenerateAllImages}
            isGeneratingAll={isGeneratingAll}
            generateAllProgress={generateAllProgress}
            handleCancelGenerateAll={handleCancelGenerateAll}
          />
        )}
        </AnimatePresence>
    </Layout>
  );
};

export default App;