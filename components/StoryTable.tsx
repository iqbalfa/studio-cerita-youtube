import React, { useState } from 'react';

// SVG Icons
const Icons = {
  plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>,
  image: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  sparkles: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  refresh: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  x: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>,
  zoomIn: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>,
  edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  settings2: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>,
  download: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  maximize: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>,
  check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>,
  clock: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  lock: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  chevronRight: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>,
  zap: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  square: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>,
  play: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};
import { motion, AnimatePresence } from 'framer-motion';
import { StoryScene, ReferenceImage } from '../types/types';

interface StoryTableProps {
  scenes: StoryScene[];
  refImages: ReferenceImage[];
  onGenerateImage: (sceneId: string, frameId: string) => void;
  onGenerateSequence: (sceneId: string) => void;
  onUpdatePrompt: (sceneId: string, frameId: string, newPrompt: string) => void;
  onRefinePrompt: (sceneId: string, frameId: string, instruction: string) => Promise<void>; // Updated to Promise
  onFormatChange: (sceneId: string, format: "Single Panel" | "Multi Panel" | "Sequence", count: number) => void;
  onSaveNarrative: (sceneId: string, newText: string) => void;
  onAddScene: (index?: number) => void;
  onDeleteScene: (sceneId: string) => void;
  onUpdateSplitText: (sceneId: string, frameId: string, newSplitText: string[]) => void;
  onGeneratePrompts: (sceneId: string) => void;
  onGenerateAllImages?: () => void;
  isGeneratingAll?: boolean;
  generateAllProgress?: string;
  onCancelGenerateAll?: () => void;
  language: 'id' | 'en';
}

const TRANSLATIONS = {
  id: {
    changeFormat: "Ubah Format",
    count: "Jumlah:",
    cancel: "Batal",
    apply: "Terapkan",
    noStoryboard: "Belum ada storyboard. Masukkan paragraf target dan klik 'Buat Storyboard' atau tambah manual.",
    addManual: "+ Tambah Baris Manual",
    col1: "1. Text dan Format",
    col2: "2. Pembagian Kata",
    col3: "3. Text-to-Image Prompt",
    col4: "4. REF",
    col5: "5. Visual Result",
    save: "Simpan",
    editPrompt: "Instruksi revisi (Enter)",
    refine: "Refine",
    generating: "Membuat...",
    generatePrompts: "Generate Prompts",
    generateAll: "Generate All Images (10 RPM)",
    stopGenerateAll: "Stop",
    readyToGenerate: "Ready to Generate",
    waitFor: "Wait for #",
    regenerate: "Regenerate",
    generate: "Generate",
    generateSequence: "Generate Sequence",
    generatingSequence: "Generating Sequence...",
    addNewRow: "+ Tambah Baris Baru",
    close: "Close",
    singlePanel: "Single Panel",
    multiPanel: "Multi Panel",
    sequence: "Sequence",
    locked: "Locked",
    ready: "Ready"
  },
  en: {
    changeFormat: "Change Format",
    count: "Count:",
    cancel: "Cancel",
    apply: "Apply",
    noStoryboard: "No storyboard yet. Enter target paragraph and click 'Generate Storyboard' or add manually.",
    addManual: "+ Add Row Manually",
    col1: "1. Text and Format",
    col2: "2. Text Breakdown",
    col3: "3. Text-to-Image Prompt",
    col4: "4. REF",
    col5: "5. Visual Result",
    save: "Save",
    editPrompt: "Revision instruction (Enter)",
    refine: "Refine",
    generating: "Generating...",
    generatePrompts: "Generate Prompts",
    generateAll: "Generate All Images (10 RPM)",
    stopGenerateAll: "Stop",
    readyToGenerate: "Ready to Generate",
    waitFor: "Wait for #",
    regenerate: "Regenerate",
    generate: "Generate",
    generateSequence: "Generate Sequence",
    generatingSequence: "Generating Sequence...",
    addNewRow: "+ Add New Row",
    close: "Close",
    singlePanel: "Single Panel",
    multiPanel: "Multi Panel",
    sequence: "Sequence",
    locked: "Locked",
    ready: "Ready"
  }
};

const FormatEditor: React.FC<{ 
    sceneId: string; 
    onClose: () => void; 
    onApply: (format: "Single Panel" | "Multi Panel" | "Sequence", count: number) => void; 
    language?: 'id' | 'en';
}> = ({ sceneId, onClose, onApply, language = 'id' }) => {
    const t = TRANSLATIONS[language] || TRANSLATIONS['id'];
    const [format, setFormat] = useState<"Single Panel" | "Multi Panel" | "Sequence">("Single Panel");
    const [count, setCount] = useState<number>(2);

    return (
        <div className="absolute left-0 bottom-full mb-2 bg-gray-100 border border-slate-600 rounded-lg shadow-sm p-3 w-64 z-50">
            <h4 className="text-xs font-semibold text-foreground mb-2">{t.changeFormat}</h4>
            <div className="flex flex-col gap-2">
                <select 
                    value={format} 
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="bg-surface border border-slate-600 text-xs rounded p-1 text-foreground"
                >
                    <option value="Single Panel">{t.singlePanel}</option>
                    <option value="Multi Panel">{t.multiPanel}</option>
                    <option value="Sequence">{t.sequence}</option>
                </select>

                {format !== "Single Panel" && (
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted">{t.count}</span>
                        <input 
                            type="number" 
                            min={2} 
                            max={5} 
                            value={count} 
                            onChange={(e) => setCount(parseInt(e.target.value))}
                            className="w-16 bg-surface border border-slate-600 text-xs rounded p-1 text-foreground"
                        />
                     </div>
                )}

                <div className="flex justify-end gap-2 mt-2">
                    <button onClick={onClose} className="text-[10px] text-muted hover:text-foreground">{t.cancel}</button>
                    <button 
                        onClick={() => onApply(format, count)}
                        className="text-[10px] bg-primary hover:bg-primary-hover text-foreground px-2 py-1 rounded"
                    >
                        {t.apply}
                    </button>
                </div>
            </div>
            <div className="absolute bottom-[-5px] left-4 w-2 h-2 bg-gray-100 border-b border-r border-slate-600 rotate-45"></div>
        </div>
    );
};

const StoryTable: React.FC<StoryTableProps> = ({ 
  scenes, 
  refImages, 
  onGenerateImage,
  onGenerateSequence,
  onUpdatePrompt,
  onRefinePrompt,
  onFormatChange,
  onSaveNarrative,
  onAddScene,
  onDeleteScene,
  onUpdateSplitText,
  onGeneratePrompts,
  onGenerateAllImages,
  isGeneratingAll,
  generateAllProgress,
  onCancelGenerateAll,
  language = 'id'
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS['id'];
  const [instructions, setInstructions] = useState<{[key: string]: string}>({});
  const [editingFormatId, setEditingFormatId] = useState<string | null>(null);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [tempNarrativeText, setTempNarrativeText] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleInstructionChange = (id: string, value: string) => {
    setInstructions(prev => ({ ...prev, [id]: value }));
  };

  const handleRefineClick = async (sceneId: string, frameId: string) => {
      const instruction = instructions[frameId];
      if (!instruction) return;
      
      await onRefinePrompt(sceneId, frameId, instruction);
      setInstructions(prev => ({ ...prev, [frameId]: '' }));
  };

  const handleKeyDownRefine = (e: React.KeyboardEvent<HTMLInputElement>, sceneId: string, frameId: string) => {
      if (e.key === 'Enter') {
          handleRefineClick(sceneId, frameId);
      }
  };

  const startEditing = (sceneId: string, text: string) => {
      setEditingSceneId(sceneId);
      setTempNarrativeText(text);
  };

  const cancelEditing = () => {
      setEditingSceneId(null);
      setTempNarrativeText("");
  };

  const saveEditing = (sceneId: string) => {
      onSaveNarrative(sceneId, tempNarrativeText);
      setEditingSceneId(null);
      setTempNarrativeText("");
  };

  const handleSplitTextChange = (sceneId: string, frameId: string, index: number, newValue: string, currentArray: string[]) => {
      const newArray = [...currentArray];
      newArray[index] = newValue;
      onUpdateSplitText(sceneId, frameId, newArray);
  };

  const handleDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to determine Scene Format Label for Column 1
  const getSceneFormatLabel = (scene: StoryScene) => {
      // 1. Multiple frame objects always mean sequence
      if (scene.frames.length > 1) {
          return `Sequence (${scene.frames.length} Frame)`;
      }

      // 2. Single frame object analysis
      const frame = scene.frames[0];
      if (!frame) return "Single Panel";
      
      const fmt = frame.format || "";
      const splitTextCount = frame.splitText?.length || 0;

      // 3. IF split text is > 1, it CANNOT be Single Panel.
      // If the stored format is incorrect (still "Single Panel"), we force a label.
      if (splitTextCount > 1) {
           const fmtLower = fmt.toLowerCase();
           if (!fmtLower.includes("multi") && !fmtLower.includes("sequence")) {
               // Fallback: Use Sequence as default for multiple texts if unlabeled
               return `Sequence (${splitTextCount} Frames)`; 
           }
      }

      return fmt || "Single Panel";
  };

  const getFormatBadgeStyle = (label: string) => {
      if (label.toLowerCase().includes("sequence")) return "bg-orange-900/50 text-orange-300 border-orange-800/50";
      if (label.toLowerCase().includes("multi")) return "bg-purple-900/50 text-purple-300 border-purple-800/50";
      return "bg-gray-100 text-muted border-slate-600";
  };

  // Helper to render text with newlines after periods
  const renderSplitText = (text: string) => {
      // Just replace dots with dot+newline for visual separation
      return text.replace(/\. /g, '.\n\n').replace(/\./g, '.');
  };

  return (
    <div className="flex flex-col gap-4 relative">
        {/* Lightbox Modal */}
        {selectedImage && (
            <div 
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200"
                onClick={() => setSelectedImage(null)}
            >
                <div className="relative max-w-full max-h-full">
                    <img 
                        src={selectedImage} 
                        alt="Enlarged view" 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-md border border-border"
                        onClick={(e) => e.stopPropagation()} 
                    />
                    <button 
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-12 right-0 text-foreground hover:text-foreground flex items-center gap-2 bg-gray-100/50 px-3 py-1 rounded-full border border-slate-600"
                    >
                        <span>{t.close}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        )}

        {scenes.length === 0 ? (
        <div className="text-center py-20 bg-gray-100/50 rounded-xl border border-dashed border-border">
            <p className="text-muted mb-4">{t.noStoryboard}</p>
            <button 
                onClick={() => onAddScene()}
                className="bg-primary/20 hover:bg-primary/30 text-primary text-xs px-3 py-2 rounded border border-blue-500/30 transition-colors"
            >
                {t.addManual}
            </button>
        </div>
        ) : (
        <div className="flex flex-col gap-4">
            {onGenerateAllImages && (
                <div className="flex justify-end">
                    {isGeneratingAll ? (
                        <button
                            onClick={onCancelGenerateAll}
                            className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-destructive border border-red-500/50 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                        >
                            <Icons.square />
                            {t.stopGenerateAll} ({generateAllProgress})
                        </button>
                    ) : (
                        <button
                            onClick={onGenerateAllImages}
                            className="flex items-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/50 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                        >
                            <Icons.play />
                            {t.generateAll}
                        </button>
                    )}
                </div>
            )}
            <div className="overflow-x-auto rounded-xl border border-border bg-surface/50 shadow-md pb-32">
            <table className="w-full text-left text-sm border-collapse table-fixed">
            <thead className="bg-gray-100 text-foreground uppercase tracking-wider font-semibold text-xs">
            <tr>
                <th className="p-4 w-[15%] border-r border-border">{t.col1}</th>
                <th className="p-4 w-[15%] border-r border-border">{t.col2}</th>
                <th className="p-4 w-[25%] border-r border-border">{t.col3}</th>
                <th className="p-4 w-[10%] text-center border-r border-border">{t.col4}</th>
                <th className="p-4 w-[35%] text-center">{t.col5}</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
            {scenes.map((scene, sceneIndex) => (
                <React.Fragment key={scene.id}>
                    {scene.frames.map((frame, frameIndex) => {
                        const isFirstFrame = frameIndex === 0;
                        const isLastFrame = frameIndex === scene.frames.length - 1;
                        const previousFrame = frameIndex > 0 ? scene.frames[frameIndex - 1] : null;
                        const isSequence = frameIndex > 0;
                        const canGenerate = !isSequence || (previousFrame && !!previousFrame.imageUrl);
                        
                        // Determine relevant references (Filtering Logic for Display)
                        const promptLower = frame.visualPrompt.toLowerCase();
                        let displayedRefs = refImages.filter(img => promptLower.includes(img.name.toLowerCase()));

                        // FALLBACK UI LOGIC v2.6: If no explicit ref, show "Ilmu Lidi" if it exists
                        if (displayedRefs.length === 0) {
                             const ilmuLidiRef = refImages.find(img => img.name.toLowerCase().trim() === "ilmu lidi");
                             if (ilmuLidiRef) {
                                 displayedRefs = [ilmuLidiRef];
                             }
                        }

                        // Calculate Format Label once
                        const sceneFormatLabel = getSceneFormatLabel(scene);

                        return (
                            <tr key={frame.id} className="hover:bg-gray-100/30 transition-colors">
                                {/* 1. Text dan Format Column (Spans Row) */}
                                {isFirstFrame && (
                                    <td 
                                        className="p-4 align-top text-foreground border-r border-border bg-surface/30 relative"
                                        rowSpan={scene.frames.length}
                                    >
                                        <div className="flex flex-col h-full min-h-[150px]">
                                            {editingSceneId === scene.id ? (
                                                <div className="flex flex-col gap-2 h-full">
                                                    <textarea
                                                        className="w-full h-32 bg-gray-100 border border-slate-600 rounded p-2 text-sm text-foreground outline-none resize-none"
                                                        value={tempNarrativeText}
                                                        onChange={(e) => setTempNarrativeText(e.target.value)}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button onClick={() => saveEditing(scene.id)} className="text-[10px] bg-green-600 text-foreground px-2 py-1 rounded">{t.save}</button>
                                                        <button onClick={cancelEditing} className="text-[10px] bg-slate-700 text-foreground px-2 py-1 rounded">{t.cancel}</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Action Buttons Centered */}
                                                    <div className="flex justify-center gap-2 mb-3 w-full border-b border-border/50 pb-3 relative z-20">
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); startEditing(scene.id, scene.narrativeText); }} 
                                                            className="p-2 rounded-lg bg-gray-100 hover:bg-primary/20 text-muted hover:text-primary border border-border transition-all shadow-sm"
                                                            title="Edit Teks"
                                                        >
                                                            <Icons.edit />
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); onDeleteScene(scene.id); }} 
                                                            className="p-2 rounded-lg bg-gray-100 hover:bg-red-600/20 text-muted hover:text-destructive border border-border transition-all shadow-sm"
                                                            title="Hapus Baris"
                                                        >
                                                            <Icons.trash />
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); onAddScene(sceneIndex); }} 
                                                            className="p-2 rounded-lg bg-gray-100 hover:bg-emerald-600/20 text-muted hover:text-emerald-400 border border-border transition-all shadow-sm"
                                                            title="Tambah Baris Dibawah"
                                                        >
                                                            <Icons.plus />
                                                        </button>
                                                    </div>

                                                    <div className="mb-4 flex flex-col gap-2 flex-grow">
                                                        {/* UNIFIED CONTAINER FOR TEXT SPLITS (One Textbox Logic) */}
                                                        <div className="bg-gray-50/40 rounded border border-border p-3 shadow-sm min-h-[80px] whitespace-pre-line leading-relaxed font-light text-xs text-foreground">
                                                            {renderSplitText(scene.narrativeText)}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="mt-auto pt-2">
                                                        {/* Format Badge moved here */}
                                                        <div className={`text-[10px] font-bold font-mono px-2 py-1 rounded border mb-2 text-center w-full ${getFormatBadgeStyle(sceneFormatLabel)}`}>
                                                            {sceneFormatLabel}
                                                        </div>

                                                        {scene.isRestructuring ? (
                                                            <span className="text-xs text-primary animate-pulse block text-center">Regenerating...</span>
                                                        ) : (
                                                            <div className="relative">
                                                                <button 
                                                                    onClick={() => setEditingFormatId(scene.id)}
                                                                    className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 hover:bg-gray-200 border border-border text-foreground px-3 py-2 rounded-lg flex items-center gap-2 w-full justify-center transition-all shadow-sm"
                                                                >
                                                                    <Icons.settings2 />
                                                                    {t.changeFormat}
                                                                </button>
                                                                {editingFormatId === scene.id && (
                                                                    <FormatEditor 
                                                                        sceneId={scene.id}
                                                                        onClose={() => setEditingFormatId(null)}
                                                                        onApply={(fmt, count) => {
                                                                            onFormatChange(scene.id, fmt, count);
                                                                            setEditingFormatId(null);
                                                                        }}
                                                                        language={language}
                                                                    />
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                )}

                                {/* 2. Split Text Column */}
                                <td className="p-4 align-top border-r border-border h-full">
                                    <div className="flex flex-col h-full">
                                        <div className="flex flex-col gap-2 mb-4 flex-1">
                                            {(frame.splitText || []).map((textSeg, segIdx) => (
                                                <div key={segIdx} className="relative group flex-1 flex flex-col">
                                                    <textarea
                                                        className="w-full h-full min-h-[100px] bg-gray-50 border border-border rounded p-2 text-xs text-foreground resize-none focus:border-blue-500 outline-none"
                                                        value={textSeg}
                                                        onChange={(e) => handleSplitTextChange(scene.id, frame.id, segIdx, e.target.value, frame.splitText)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Render Button in the last frame of the scene */}
                                        {isLastFrame && (
                                            <div className="mt-auto pt-2 border-t border-border">
                                                <button 
                                                    onClick={() => onGeneratePrompts(scene.id)}
                                                    disabled={scene.isGeneratingPrompts}
                                                    className={`w-full py-3 px-2 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-all shadow-lg flex items-center justify-center gap-2 ${
                                                        scene.isGeneratingPrompts 
                                                        ? 'bg-gray-100 border-border text-muted cursor-wait' 
                                                        : 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 hover:bg-indigo-600/30 hover:border-indigo-400'
                                                    }`}
                                                >
                                                    {scene.isGeneratingPrompts ? (
                                                        <>
                                                            <span className="animate-spin inline-block"><Icons.refresh /></span>
                                                            {t.generating}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Icons.sparkles />
                                                            {t.generatePrompts}
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>

                                {/* 3. Prompt Column */}
                                <td className="p-4 align-top border-r border-border">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-end">
                                            <span className="text-[10px] text-muted font-mono">#{frameIndex + 1}</span>
                                        </div>
                                        <textarea 
                                            className="w-full h-32 bg-gray-50/50 border border-border rounded p-2 text-[11px] text-foreground font-mono focus:ring-1 focus:ring-primary outline-none resize-y"
                                            value={frame.visualPrompt}
                                            onChange={(e) => onUpdatePrompt(scene.id, frame.id, e.target.value)}
                                            placeholder={language === 'en' ? "English Prompt..." : "Prompt Bahasa Indonesia..."}
                                        />
                                        <div className="flex gap-1">
                                            <input 
                                                type="text"
                                                placeholder={t.editPrompt}
                                                className="flex-1 bg-surface border border-slate-600 rounded px-2 py-1 text-[10px] text-foreground"
                                                value={instructions[frame.id] || ''}
                                                onChange={(e) => handleInstructionChange(frame.id, e.target.value)}
                                                onKeyDown={(e) => handleKeyDownRefine(e, scene.id, frame.id)}
                                                disabled={frame.isRefining}
                                            />
                                            <button
                                                onClick={() => handleRefineClick(scene.id, frame.id)}
                                                disabled={frame.isRefining || !instructions[frame.id]}
                                                className={`text-[10px] px-2 border rounded flex items-center gap-1 ${
                                                    frame.isRefining 
                                                    ? 'bg-gray-100 text-muted border-border cursor-wait' 
                                                    : 'bg-slate-700 hover:bg-slate-600 border-slate-500 text-foreground'
                                                }`}
                                            >
                                                {frame.isRefining ? (
                                                    <>
                                                        <span className="w-2 h-2 rounded-full border border-slate-400 border-t-transparent animate-spin"></span>
                                                        Refining...
                                                    </>
                                                ) : t.refine}
                                            </button>
                                        </div>
                                    </div>
                                </td>

                                {/* 4. REF Column (Filtered Display) */}
                                <td className="p-4 align-top border-r border-border bg-surface/20">
                                    <div className="flex flex-col items-center gap-2">
                                        {displayedRefs.length > 0 ? (
                                            <div className="flex flex-wrap justify-center gap-2">
                                                {displayedRefs.map((img) => (
                                                    <div key={img.id} className="group relative">
                                                        <img 
                                                            src={img.data} 
                                                            className="h-8 w-8 rounded-full ring-2 ring-primary/50 object-cover" 
                                                            alt={img.name}
                                                            title={img.name}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-muted italic">No Ref</span>
                                        )}
                                        {isSequence && (
                                            <div className={`text-[9px] text-center px-1 rounded border mt-1 w-full
                                                ${canGenerate ? 'text-green-400 bg-green-950/30 border-green-900/50' : 'text-destructive bg-red-950/30 border-red-900/50'}`}>
                                                {canGenerate ? t.ready : t.locked}
                                            </div>
                                        )}
                                    </div>
                                </td>

                                {/* 5. Result Column */}
                                <td className="p-4 align-top">
                                    <div className="flex flex-col gap-2">
                                        <div className="relative w-full aspect-video bg-gray-50 rounded-lg overflow-hidden border border-border flex items-center justify-center group/image">
                                            {frame.isGenerating ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                                    <span className="text-[10px] text-primary">Generating...</span>
                                                </div>
                                            ) : frame.imageUrl ? (
                                                <>
                                                    <img 
                                                        src={frame.imageUrl} 
                                                        alt="Result" 
                                                        className="w-full h-full object-contain cursor-zoom-in hover:scale-105 transition-transform duration-300"
                                                        onClick={() => setSelectedImage(frame.imageUrl!)}
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors pointer-events-none" />
                                                </>
                                            ) : (
                                                <span className="text-[10px] text-muted">
                                                    {canGenerate ? t.readyToGenerate : `${t.waitFor}${frameIndex}`}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Render Button Group */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onGenerateImage(scene.id, frame.id)}
                                                disabled={frame.isGenerating || !canGenerate || scene.isGeneratingSequence}
                                                className={`flex-1 py-2.5 px-4 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2
                                                    ${!canGenerate || scene.isGeneratingSequence
                                                        ? 'bg-gray-100 text-muted cursor-not-allowed opacity-50 border border-border' 
                                                        : 'bg-primary hover:bg-primary-hover text-foreground border border-white/10'
                                                    }`}
                                            >
                                                {frame.isGenerating ? (
                                                    <span className="animate-spin inline-block"><Icons.refresh /></span>
                                                ) : (
                                                    <Icons.sparkles />
                                                )}
                                                {frame.imageUrl ? 'Regenerate' : 'Generate'}
                                            </button>

                                            {frame.imageUrl && (
                                                <button
                                                    onClick={() => handleDownload(frame.imageUrl!, `scene-${sceneIndex}-frame-${frameIndex}.png`)}
                                                    className="py-2.5 px-3 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-foreground border border-border transition-all shadow-sm"
                                                    title="Download Image"
                                                >
                                                    <Icons.download />
                                                </button>
                                            )}
                                        </div>

                                        {/* Sequence: Generate All Button (Only on First Frame) */}
                                        {isFirstFrame && scene.frames.length > 1 && (
                                             <button
                                                onClick={() => onGenerateSequence(scene.id)}
                                                disabled={scene.isGeneratingSequence || scene.frames.some(f => f.isGenerating)}
                                                className={`w-full mt-1 py-1 px-3 rounded text-[10px] uppercase font-bold tracking-wider border transition-all
                                                    ${scene.isGeneratingSequence
                                                        ? 'bg-orange-900/30 text-orange-400 border-orange-800 animate-pulse'
                                                        : 'bg-orange-900/40 text-orange-300 border-orange-800 hover:bg-orange-800'
                                                    }`}
                                             >
                                                {scene.isGeneratingSequence ? (
                                                     <span className="animate-spin inline-block"><Icons.refresh /></span>
                                                 ) : (
                                                     <Icons.zap />
                                                 )}
                                                 {scene.isGeneratingSequence ? t.generatingSequence : t.generateSequence}
                                             </button>
                                        )}
                                        
                                        {frame.error && (
                                            <p className="text-destructive text-[9px] text-center bg-red-950/30 p-1 rounded">
                                                {frame.error}
                                            </p>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </React.Fragment>
            ))}
            </tbody>
        </table>
        </div>
        </div>
        )}
        
        <div className="flex justify-center">
             <button 
                onClick={() => onAddScene()}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-foreground hover:text-foreground px-4 py-2 rounded-full border border-slate-600 text-sm"
            >
                <Icons.plus />
                {t.addNewRow}
            </button>
        </div>
    </div>
  );
};

export default StoryTable;