import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState, DEFAULT_SYSTEM_PROMPT, ReferenceImage, StoryScene, LLMProvider, ILMU_LIDI_STYLE, ILMU_SURVIVAL_STYLE, ILMU_NYANTUY_STYLE, ILMU_PSIKOLOGI_STYLE } from './types';
import { Layout, TabId } from './components/Layout';
import FileUpload from './components/FileUpload';
import StoryTable from './components/StoryTable';
import AudioPlayer from './components/AudioPlayer';

// SVG Icons — no emoji (UI/UX Pro Max rule)
const Icons = {
  sparkles: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  alertCircle: () => <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  settings: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  image: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>,
  trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  chevronDown: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>,
  refresh: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  volume: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>,
  play: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  download: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  x: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>,
  grid: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  monitor: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  zap: () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>,
};
import { 
  analyzeNarrativeToScenes, 
  generateSceneImage, 
  refineScenePrompt, 
  generatePromptsFromFrames,
  detectCharactersFromNarrative,
  generateCharacterPrompt,
  transformToVoiceDirector,
  generateTTS
} from './services/geminiService';

// Helper to distribute items into buckets
const distributeItems = (items: string[], count: number, separator: string): string[] => {
    const result: string[] = new Array(count).fill("");
    const base = Math.floor(items.length / count);
    const extra = items.length % count;
    let current = 0;
    
    for (let i = 0; i < count; i++) {
        const take = base + (i < extra ? 1 : 0);
        const slice = items.slice(current, current + take);
        result[i] = slice.join(separator);
        current += take;
    }
    return result;
};

// Robust text distributor that falls back from Sentences -> Clauses -> Words
const distributeText = (text: string, count: number): string[] => {
    if (count <= 1) return [text];
    const cleanText = text.trim();
    if (!cleanText) return new Array(count).fill("");

    // Strategy 1: Split by Sentences
    const sentenceRegex = /[^.!?\n]+[.!?]+|[^.!?\n]+$/g;
    const sentences = cleanText.match(sentenceRegex)?.map(s => s.trim()).filter(s => s) || [cleanText];
    
    if (sentences.length >= count) {
        return distributeItems(sentences, count, " ");
    }

    // Strategy 2: Split by Clauses (Commas, Semicolons, Uppercase transitions)
    const clauseParts = cleanText.split(/([,;])/);
    const clauses: string[] = [];
    
    for (let i = 0; i < clauseParts.length; i += 2) {
        const part = clauseParts[i];
        const delim = clauseParts[i + 1] || "";
        const combined = (part + delim).trim();
        if (combined) {
            clauses.push(combined);
        }
    }
    
    if (clauses.length >= count) {
        return distributeItems(clauses, count, " ");
    }

    // Strategy 3: Split by Words (Fallback)
    const words = cleanText.split(/\s+/);
    return distributeItems(words, count, " ");
};

const TRANSLATIONS: Record<'id' | 'en', any> = {
  id: {
    configTitle: "Konfigurasi Produksi",
    textModel: "Text Model Provider",
    narratorName: "Nama Narator (Channel)",
    narratorSuffix: "Narrator Suffix",
    narratorSuffixPlaceholder: "Contoh: Mengenakan baju merah bertuliskan \"Ilmu Survival\"",
    narratorPlaceholder: "Contoh: Norman, Ilmu Lidi, dll",
    styleSuffix: "Visual Style Suffix",
    stylePlaceholder: "Masukkan prompt style suffix di sini...",
    easterEgg: "Easter Egg Configuration",
    negativePrompt: "Negative Prompt Keywords",
    negativePlaceholder: "Contoh: blur, distorted, low quality, batik, monas...",
    negativeHint: "Pisahkan dengan koma. Kata-kata ini akan dikecualikan saat pembuatan gambar.",
    contextNarrative: "1. Konteks Narasi (Lengkap)",
    contextPlaceholder: "Tempelkan cerita lengkap untuk konteks yang lebih baik...",
    refImages: "2. Referensi Gambar (1-10 Karakter)",
    targetParagraph: "3. Paragraf Target Visual",
    targetPlaceholder: "Paste paragraf spesifik yang ingin divisualisasikan menjadi storyboard...",
    analyzeBtn: "Buat Storyboard",
    analyzing: "Sedang Menganalisis...",
    resultTitle: "Visual Storyboard Result",
    systemReady: "System Ready",
    totalScenes: "Total Scenes",
    saveProject: "Simpan Proyek",
    loadProject: "Buka Proyek",
    aiEngine: "AI Engine",
    geminiKey: "Custom Gemini API Key",
    connectKey: "Masukkan API Key",
    keyConnected: "API Key Tersimpan",
    billingInfo: "Informasi Billing",
    nvidiaKey: "Nvidia API Key",
    sumopodKey: "SumoPod API Key",
    alertTarget: "Mohon isi Paragraf Target yang akan divisualisasikan.",
    alertNvidia: "Mohon masukkan Nvidia API Key.",
    alertSumopod: "Mohon masukkan SumoPod API Key.",
    noChar: "Tidak ada karakter spesifik",
    generateCharBtn: "Generate Karakter",
    generatingChar: "Mendeteksi Karakter...",
    generateCharImg: "Generate Gambar",
    newSceneText: "Tulis narasi baru di sini...",
    confirmDelete: "Apakah anda yakin ingin menghapus baris ini?",
    uploadBtn: "Upload",
    addCharBtn: "Tambah Karakter",
    charName: "Nama Karakter",
    charPrompt: "Prompt Visual",
    charImage: "Gambar Karakter",
    maxImages: "Maks 10 gambar",
    filled: "Terisi",
    charNamePlaceholder: "Nama Karakter",
    charPromptPlaceholder: "Prompt visual...",
    refinePlaceholder: "Instruksi revisi...",
    refinePrompt: "Revisi Prompt",
    uploadHint: "Upload 1-10 karakter. Gunakan 'Global Refs' untuk mengunggah referensi visual (max 2) yang akan digunakan untuk semua karakter.",
    voiceDirectorBtn: "Ubah ke Versi Voice Director",
    voiceDirectorLoading: "Mengolah Naskah...",
    voiceDirectorTitle: "4. Versi Voice Director",
    voiceDirectorPlaceholder: "Hasil naskah dengan sound cues akan muncul di sini...",
    generateTTS: "Generate TTS",
    generatingTTS: "Generating TTS...",
    ttsVoice: "Pilih Suara",
    ttsCopies: "Jumlah Copy",
    ttsPreset: "Preset Instruksi",
    ttsCustom: "Instruksi Kustom"
  },
  en: {
    configTitle: "Production Configuration",
    textModel: "Text Model Provider",
    narratorName: "Narrator Name (Channel)",
    narratorPlaceholder: "Example: Norman, Ilmu Lidi, etc",
    styleSuffix: "Visual Style Suffix",
    stylePlaceholder: "Enter style suffix prompt here...",
    easterEgg: "Easter Egg Configuration",
    negativePrompt: "Negative Prompt Keywords",
    negativePlaceholder: "Example: blur, distorted, low quality, batik, monas...",
    negativeHint: "Separate with commas. These words will be excluded during image generation.",
    contextNarrative: "1. Narrative Context (Full)",
    contextPlaceholder: "Paste full story for better context...",
    refImages: "2. Reference Images (1-10 Characters)",
    targetParagraph: "3. Visual Target Paragraph",
    targetPlaceholder: "Paste the specific paragraph you want to visualize into a storyboard...",
    analyzeBtn: "Generate Storyboard",
    analyzing: "Analyzing...",
    resultTitle: "Visual Storyboard Result",
    systemReady: "System Ready",
    totalScenes: "Total Scenes",
    saveProject: "Save Project",
    loadProject: "Load Project",
    aiEngine: "AI Engine",
    geminiKey: "Custom Gemini API Key",
    connectKey: "Enter API Key",
    keyConnected: "API Key Saved",
    billingInfo: "Billing Info",
    nvidiaKey: "Nvidia API Key",
    sumopodKey: "SumoPod API Key",
    alertTarget: "Please fill in the Target Paragraph to be visualized.",
    alertNvidia: "Please enter Nvidia API Key.",
    alertSumopod: "Please enter SumoPod API Key.",
    noChar: "No specific characters",
    generateCharBtn: "Generate Characters",
    generatingChar: "Detecting Characters...",
    generateCharImg: "Generate Image",
    newSceneText: "Write new narrative here...",
    confirmDelete: "Are you sure you want to delete this row?",
    uploadBtn: "Upload",
    addCharBtn: "Add Character",
    charName: "Character Name",
    charPrompt: "Visual Prompt",
    charImage: "Character Image",
    maxImages: "Max 10 images",
    filled: "Filled",
    charNamePlaceholder: "Character Name",
    charPromptPlaceholder: "Visual prompt...",
    refinePlaceholder: "Refine instruction...",
    refinePrompt: "Refine Prompt",
    uploadHint: "Upload 1-10 characters. Use 'Global Refs' to upload visual references (max 2) that will be used for all characters.",
    voiceDirectorBtn: "Convert to Voice Director Version",
    voiceDirectorLoading: "Processing Script...",
    voiceDirectorTitle: "4. Versi Voice Director",
    voiceDirectorPlaceholder: "Script with sound cues will appear here...",
    generateTTS: "Generate TTS",
    generatingTTS: "Generating TTS...",
    ttsVoice: "Select Voice",
    ttsCopies: "Copies",
    ttsPreset: "Instruction Preset",
    ttsCustom: "Custom Instruction"
  }
};

// Helper to convert base64 to Blob, auto-detecting format
const createAudioBlob = (base64: string, mimeType: string): Blob => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Check for RIFF header (WAV)
  if (bytes.length >= 4 && bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70) {
    return new Blob([bytes], { type: 'audio/wav' });
  }
  
  // Check for ID3 header or MP3 sync word
  if ((bytes.length >= 3 && bytes[0] === 73 && bytes[1] === 68 && bytes[2] === 51) || 
      (bytes.length >= 2 && bytes[0] === 255 && (bytes[1] & 224) === 224)) {
    return new Blob([bytes], { type: 'audio/mp3' });
  }

  // Otherwise, assume it's raw PCM and wrap it in a WAV header
  let sampleRate = 24000;
  if (mimeType && mimeType.includes('rate=')) {
    const match = mimeType.match(/rate=(\d+)/);
    if (match) sampleRate = parseInt(match[1], 10);
  }

  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);
  
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + bytes.length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, bytes.length, true);
  
  return new Blob([wavHeader, bytes], { type: 'audio/wav' });
};

// New structured TTS presets for Gemini 3.1 Flash TTS
// Each preset has: speakerProfile, scene, directorNotes
const TTS_PRESETS: Record<string, {
  speakerProfile: string;
  scene: string;
  directorNotes: string;
}> = {
  'Ilmu Lidi': {
    speakerProfile: "A 20-something Indonesian guy doing a YouTube narration. He's the type of YouTuber who edits his own videos — direct to camera energy, enthusiastic exposition, treats the audience like subscribers not strangers. Natural Indonesian speech, not a formal narrator.",
    scene: "Recording in a home studio setup. You can hear the mic and the energy of someone who's been editing all day.",
    directorNotes: "Speak like a YouTuber doing a voice-over — clear, engaging, direct. Project energy without screaming. Use 'gue'/'gua' style, not formal. Pause before key info reveals. Let excitement show in your tone — this is content you CARE about. Stay grounded, not theatrical."
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

  const [isTransformingVoice, setIsTransformingVoice] = useState(false);
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

  const handleTransformToVoiceDirector = async () => {
    if (!state.targetParagraph.trim()) return;

    setIsTransformingVoice(true);
    try {
        const result = await transformToVoiceDirector(
            state.targetParagraph,
            state.language,
            state.geminiApiKey
        );
        setState(prev => ({ ...prev, voiceDirectorVersion: result }));
    } catch (error: any) {
        alert("Error: " + error.message);
    } finally {
        setIsTransformingVoice(false);
    }
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
      setState(prev => ({ ...prev, scenes, isAnalyzing: false }));
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

            let partsCount = 1;
            if (scene.frames.length > 1) {
                partsCount = scene.frames.length;
            } else {
                const fmt = scene.frames[0].format;
                if (fmt.includes("Multi") || fmt.includes("Sequence")) {
                    const match = fmt.match(/\((\d+)\)/);
                    partsCount = match ? parseInt(match[1]) : 2;
                    // Fallback if regex fails but keyword exists
                    if (!match) partsCount = 2;
                }
            }

            const newSplitTexts = distributeText(newText, partsCount);

            const updatedFrames = scene.frames.map((frame, idx) => {
                if (scene.frames.length > 1) {
                    return { ...frame, splitText: [newSplitTexts[idx]] };
                } else {
                    return { ...frame, splitText: newSplitTexts };
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
      isLoading={state.isAnalyzing || isTransformingVoice || isGeneratingTTS || state.isDetectingCharacters || isGeneratingAll}
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
            <motion.div 
              key="story"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-6"
            >


              {/* Card 4: Story Context */}
              <div className="md:col-span-6 bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
                      <Icons.grid /> {t.contextNarrative}
                  </h3>
                  <textarea
                      className="w-full flex-1 min-h-[200px] bg-surface-hover border border-border rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none placeholder-gray-400 text-foreground leading-relaxed custom-scrollbar"
                      placeholder={t.contextPlaceholder}
                      value={state.contextNarrative}
                      onChange={handleContextChange}
                  />
                  <button
                      onClick={handleGenerateCharacters}
                      disabled={state.isDetectingCharacters}
                      className="w-full py-3 text-sm font-bold bg-primary hover:bg-primary-hover text-foreground rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                      <span className={state.isDetectingCharacters ? 'animate-spin inline-block' : 'inline-block'}><Icons.sparkles /></span>
                      {state.isDetectingCharacters ? t.generatingChar : t.generateCharBtn}
                  </button>
              </div>

              {/* Card 5: Character References */}
              <div className="md:col-span-6 bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
                      <Icons.image /> {t.refImages}
                  </h3>
                  <div className="bg-surface-hover border border-border rounded-xl p-1 flex-1 overflow-hidden">
                       <FileUpload 
                          label="" 
                          currentImages={state.refImages} 
                          onFilesChange={handleRefImagesChange}
                          onGenerateImage={handleGenerateCharacterImage}
                          onPromptChange={handleCharacterPromptChange}
                          onGeneratePrompt={handleGenerateCharacterPrompt}
                          globalSourceRefs={state.globalSourceRefs}
                          onGlobalSourceRefsChange={handleGlobalSourceRefsChange}
                          t={t}
                       />
                  </div>
              </div>

              {/* Advanced Settings Toggle */}
              <div className="md:col-span-12">
                  <button 
                      onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                      className="w-full flex items-center justify-between p-4 bg-gray-100 rounded-xl border border-border hover:bg-gray-100 transition-all"
                  >
                      <span className="text-sm font-bold text-foreground flex items-center gap-2">
                          <Icons.settings /> Advanced Settings
                      </span>
                      <Icons.chevronDown />
                  </button>
              </div>

              <AnimatePresence>
                  {isAdvancedOpen && (
                      <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="md:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-6"
                      >
                          {/* Card 2: Visual Style & Prompt */}
                          <div className="md:col-span-6 bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
                                  <Icons.image /> Visual Style & Prompts
                              </h3>
                              <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-bold text-muted uppercase tracking-wider">
                                      Active Preset: <span className={state.stylePreset === 'Custom' ? 'text-purple-600' : 'text-primary'}>{state.stylePreset}</span>
                                  </span>
                                  {state.stylePreset !== 'Custom' && (
                                      <span className="text-[10px] text-muted bg-gray-50 px-2 py-0.5 rounded border border-border">LOCKED</span>
                                  )}
                              </div>
                              <textarea 
                                  value={state.styleSuffix}
                                  onChange={(e) => setState(p => ({...p, styleSuffix: e.target.value, stylePreset: 'Custom'}))}
                                  placeholder={t.stylePlaceholder}
                                  className={`bg-gray-50 border ${state.stylePreset === 'Custom' ? 'border-purple-500/50' : 'border-border'} text-foreground text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full h-20 resize-none transition-all ${state.stylePreset !== 'Custom' ? 'opacity-60 cursor-not-allowed' : ''}`}
                                  readOnly={state.stylePreset !== 'Custom'}
                              />
                              <input 
                                  type="text" 
                                  value={state.negativePrompt}
                                  onChange={(e) => setState(p => ({...p, negativePrompt: e.target.value}))}
                                  placeholder={t.negativePlaceholder}
                                  className="bg-surface-hover border border-border text-foreground text-sm rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full"
                              />
                          </div>

                          {/* Card 3: Easter Egg */}
                          <div className="md:col-span-6 bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                              <div className="flex items-center justify-between mb-2">
                                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                      <Icons.zap /> {t.easterEgg}
                                  </h3>
                                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg border border-border">
                                      <span className="text-[10px] font-bold text-muted">COUNT</span>
                                      <input 
                                          type="number" 
                                          min="0" 
                                          max="5"
                                          value={state.easterEggCount}
                                          onChange={(e) => {
                                              const count = Math.max(0, Math.min(5, parseInt(e.target.value) || 0));
                                              setState(p => {
                                                  const currentTypes = [...p.easterEggTypes];
                                                  if (count > currentTypes.length) {
                                                      for (let i = currentTypes.length; i < count; i++) {
                                                          currentTypes.push('pop culture');
                                                      }
                                                  } else if (count < currentTypes.length) {
                                                      currentTypes.splice(count);
                                                  }
                                                  return { ...p, easterEggCount: count, easterEggTypes: currentTypes };
                                              });
                                          }}
                                          className="bg-transparent text-primary text-sm font-bold w-8 outline-none text-center"
                                      />
                                  </div>
                              </div>
                              
                              <AnimatePresence>
                                  {state.easterEggCount > 0 && (
                                      <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1 max-h-[140px]"
                                      >
                                          {state.easterEggTypes.map((type, idx) => (
                                              <motion.div 
                                                key={idx}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-border"
                                              >
                                                  <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[10px] font-bold text-muted">
                                                      {idx + 1}
                                                  </div>
                                                  <select 
                                                      value={type}
                                                      onChange={(e) => {
                                                          const newTypes = [...state.easterEggTypes];
                                                          newTypes[idx] = e.target.value;
                                                          setState(p => ({ ...p, easterEggTypes: newTypes }));
                                                      }}
                                                      className="bg-transparent text-foreground text-xs outline-none flex-1 cursor-pointer"
                                                  >
                                                      <option value="pop culture" className="bg-white text-foreground">Pop Culture</option>
                                                      <option value="internasional" className="bg-white text-foreground">Internasional</option>
                                                      <option value="khas indonesia" className="bg-white text-foreground">Khas Indonesia</option>
                                                  </select>
                                              </motion.div>
                                          ))}
                                      </motion.div>
                                  )}
                              </AnimatePresence>
                          </div>
                      </motion.div>
                  )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'voice' && (
            <motion.div 
              key="voice"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-8"
            >
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface border border-border rounded-2xl p-8 shadow-md w-full"
        >
            <div className="flex items-center justify-between mb-8 border-b border-border pb-6">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Icons.volume />
                  </div>
                  Voice Director & TTS
                </h2>
            </div>

            <div className="space-y-6 flex flex-col h-full">
                <div className="space-y-2 flex flex-col flex-1">
                    <label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                            <Icons.zap />
                            {t.targetParagraph}
                        </label>
                        <textarea
                            className="w-full flex-1 min-h-[120px] bg-surface-hover border border-border rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none scrollbar-thin placeholder-gray-400 text-foreground leading-relaxed"
                            placeholder={t.targetPlaceholder}
                            value={state.targetParagraph}
                            onChange={handleTargetChange}
                        />
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={handleTransformToVoiceDirector}
                            disabled={isTransformingVoice || !state.targetParagraph.trim()}
                            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all border
                                ${isTransformingVoice || !state.targetParagraph.trim()
                                    ? 'bg-gray-100 text-muted border-border cursor-not-allowed'
                                    : 'bg-blue-500/10 text-primary border-blue-500/30 hover:bg-primary-hover/20 shadow-lg shadow-blue-500/5'
                                }`}
                        >
                            {isTransformingVoice ? (
                                <span className="animate-spin inline-block"><Icons.refresh /></span>
                            ) : (
                                <Icons.monitor />
                            )}
                            {isTransformingVoice ? t.voiceDirectorLoading : t.voiceDirectorBtn}
                        </motion.button>
                    </div>

                    <div className="space-y-2 flex flex-col flex-1">
                        <label className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                            <Icons.monitor />
                            {t.voiceDirectorTitle}
                        </label>
                        <textarea
                            className="w-full flex-1 min-h-[120px] bg-surface-hover border border-border rounded-xl p-4 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none scrollbar-thin placeholder-gray-400 text-foreground leading-relaxed"
                            placeholder={t.voiceDirectorPlaceholder}
                            value={state.voiceDirectorVersion}
                            onChange={(e) => setState(prev => ({ ...prev, voiceDirectorVersion: e.target.value }))}
                        />

                        {/* TTS Controls - Redesigned for Gemini 3.1 Flash TTS */}
                        <div className="p-4 bg-surface-hover rounded-xl border border-border space-y-4">

                            {/* Preset Selector */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Voice Preset</label>
                                    <select
                                        value={state.ttsPreset}
                                        onChange={(e) => {
                                            const preset = TTS_PRESETS[e.target.value];
                                            if (preset) {
                                                setState(p => ({
                                                    ...p,
                                                    ttsPreset: e.target.value as any,
                                                    ttsSpeakerProfile: preset.speakerProfile,
                                                    ttsScene: preset.scene,
                                                    ttsDirectorNotes: preset.directorNotes
                                                }));
                                            } else {
                                                setState(p => ({ ...p, ttsPreset: 'Custom' }));
                                            }
                                        }}
                                        className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-purple-500"
                                    >
                                        <option value="Ilmu Lidi">Ilmu Lidi</option>
                                        <option value="Ilmu Survival">Ilmu Survival</option>
                                        <option value="Ilmu Nyantuy">Ilmu Nyantuy</option>
                                        <option value="Ilmu Psikologi">Ilmu Psikologi</option>
                                        <option value="Custom">Custom...</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest">{t.ttsVoice}</label>
                                    <select
                                        value={state.ttsVoice}
                                        onChange={(e) => setState(prev => ({ ...prev, ttsVoice: e.target.value }))}
                                        className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-purple-500"
                                    >
                                        <optgroup label="Male">
                                            <option value="Kore">Kore (Male, Balanced)</option>
                                            <option value="Fenrir">Fenrir (Male, Strong)</option>
                                            <option value="Zephyr">Zephyr (Male, Clear)</option>
                                            <option value="Iapetus">Iapetus (Male, Warm)</option>
                                            <option value="Puck">Puck (Male, Expressive)</option>
                                            <option value="Charon">Charon (Male, Deep)</option>
                                            <option value="Algenib">Algenib (Male, Gravelly)</option>
                                            <option value="Achenar">Achenar (Male, Authoritative)</option>
                                        </optgroup>
                                        <optgroup label="Female">
                                            <option value="OrUS">OrUS (Female, Clear)</option>
                                            <option value="Lami">Lami (Female, Warm)</option>
                                            <option value="Kore-F">Kore (Female, Balanced)</option>
                                        </optgroup>
                                    </select>
                                </div>
                            </div>

                            {/* Speaker Profile */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1">
                                    <span>🎭</span> Speaker Profile
                                </label>
                                <textarea
                                    value={state.ttsSpeakerProfile}
                                    onChange={(e) => setState(prev => ({ ...prev, ttsSpeakerProfile: e.target.value, ttsPreset: 'Custom' }))}
                                    className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-purple-500 min-h-[56px] resize-none transition-all"
                                    placeholder="Describe who the narrator is: age, personality, voice quality..."
                                />
                            </div>

                            {/* Scene / Setting */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1">
                                    <span>🎬</span> Scene / Setting
                                </label>
                                <textarea
                                    value={state.ttsScene}
                                    onChange={(e) => setState(prev => ({ ...prev, ttsScene: e.target.value, ttsPreset: 'Custom' }))}
                                    className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-purple-500 min-h-[56px] resize-none transition-all"
                                    placeholder="Describe where the narrator is: coffee shop, forest, living room..."
                                />
                            </div>

                            {/* Director's Notes */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-green-400 uppercase tracking-widest flex items-center gap-1">
                                    <span>🎬</span> Director's Notes
                                </label>
                                <textarea
                                    value={state.ttsDirectorNotes}
                                    onChange={(e) => setState(prev => ({ ...prev, ttsDirectorNotes: e.target.value, ttsPreset: 'Custom' }))}
                                    className="w-full bg-white border border-border rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-purple-500 min-h-[72px] resize-none transition-all"
                                    placeholder="How should the narrator speak: tempo, tone, emotion, pauses..."
                                />
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleGenerateTTS}
                                    disabled={isGeneratingTTS || !state.voiceDirectorVersion.trim()}
                                    className={`flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl text-xs font-bold transition-all shadow-lg
                                        ${isGeneratingTTS || !state.voiceDirectorVersion.trim()
                                            ? 'bg-gray-100 text-muted cursor-not-allowed'
                                            : 'bg-purple-500 hover:bg-purple-600 text-white shadow-purple-900/20'
                                        }`}
                                >
                                    {isGeneratingTTS ? (
                                        <span className="animate-spin inline-block"><Icons.refresh /></span>
                                    ) : (
                                        <Icons.volume />
                                    )}
                                    {isGeneratingTTS ? t.generatingTTS : t.generateTTS}
                                </motion.button>

                                {generatedAudioUrls.length > 0 && (
                                    <div className="flex flex-col gap-3 w-full mt-4">
                                        {generatedAudioUrls.map((url, idx) => (
                                            <AudioPlayer key={idx} url={url} index={idx} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
        </motion.div>
            </motion.div>
          )}

          {activeTab === 'storyboard' && (
            <motion.div 
              key="storyboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-8"
            >
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="w-full"
        >
            <div className="flex flex-col gap-4">
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleAnalyzeStory}
                    disabled={state.isAnalyzing || !state.targetParagraph}
                    className={`w-full py-5 rounded-2xl font-bold text-foreground transition-all shadow-sm flex items-center justify-center gap-3 text-lg
                    ${state.isAnalyzing || !state.targetParagraph
                        ? 'bg-gray-100 text-muted cursor-not-allowed border border-border'
                        : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:shadow-blue-500/25 border border-white/10'
                    }`}
                >
                    {state.isAnalyzing ? (
                        <>
                            <motion.div 
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                              className="w-6 h-6 rounded-full border-2 border-white/30 border-t-white"
                            />
                            {t.analyzing}
                        </>
                    ) : (
                        <>
                            <Icons.sparkles />
                            {t.analyzeBtn}
                        </>
                    )}
                </motion.button>

                {state.analysisError && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-900/20 border border-red-800/50 rounded-xl text-sm text-destructive flex items-start gap-3"
                    >
                        <Icons.alertCircle />
                        <p>{state.analysisError}</p>
                    </motion.div>
                )}
            </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface border border-border rounded-2xl p-8 shadow-md min-h-[600px] w-full"
        >
             <div className="flex items-center justify-between mb-8 border-b border-border pb-6">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Icons.grid />
                  </div>
                  {t.resultTitle}
                </h2>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-border">
                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{t.totalScenes}</span>
                        <span className="text-xs font-bold text-primary">{state.scenes.length}</span>
                    </div>
                </div>
             </div>

             <StoryTable 
                scenes={state.scenes} 
                refImages={state.refImages}
                onGenerateImage={handleGenerateImage}
                onGenerateSequence={handleGenerateSequence}
                onUpdatePrompt={handleUpdatePrompt}
                onRefinePrompt={handleRefinePrompt}
                onFormatChange={handleFormatChange}
                onSaveNarrative={handleSaveNarrative}
                onAddScene={handleAddScene}
                onDeleteScene={handleDeleteScene}
                onUpdateSplitText={handleUpdateSplitText}
                onGeneratePrompts={handleGeneratePrompts}
                onGenerateAllImages={handleGenerateAllImages}
                isGeneratingAll={isGeneratingAll}
                generateAllProgress={generateAllProgress}
                onCancelGenerateAll={handleCancelGenerateAll}
                language={state.language}
             />
        </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </Layout>
  );
};

export default App;