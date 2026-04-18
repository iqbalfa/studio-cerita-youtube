import React, { ChangeEvent, useState } from 'react';

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
import { motion, AnimatePresence } from 'motion/react';
import { ReferenceImage } from '../types';

interface FileUploadProps {
  label: string;
  onFilesChange: (images: ReferenceImage[]) => void;
  currentImages: ReferenceImage[];
  onGenerateImage?: (id: string) => Promise<void>;
  onPromptChange?: (id: string, prompt: string) => void;
  onGeneratePrompt?: (id: string) => Promise<void>;
  onAddCharacter?: () => void;
  globalSourceRefs: string[];
  onGlobalSourceRefsChange: (refs: string[]) => void;
  onRefinePrompt?: (id: string, instruction: string) => Promise<void>;
  t: any;
}

const CharacterRow: React.FC<{
    img: ReferenceImage;
    onRemove: (id: string) => void;
    onNameChange: (id: string, name: string) => void;
    onPromptChange?: (id: string, prompt: string) => void;
    onGeneratePrompt?: (id: string) => void;
    onGenerate?: (id: string) => void;
    onZoom?: (url: string) => void;
    onRefine?: (id: string, instruction: string) => void;
    t: any;
}> = ({ img, onRemove, onNameChange, onPromptChange, onGeneratePrompt, onGenerate, onZoom, onRefine, t }) => {
    const [refineInput, setRefineInput] = useState('');

    return (
        <motion.tr 
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="border-b border-border/50 hover:bg-surface/30 transition-colors group"
        >
            {/* Column 1: Nama Karakter */}
            <td className="p-4 align-top w-48">
                <div className="flex flex-col gap-2">
                    <input 
                        type="text" 
                        value={img.name}
                        onChange={(e) => onNameChange(img.id, e.target.value)}
                        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm font-bold text-foreground focus:border-blue-500 outline-none transition-all"
                        placeholder={t.charNamePlaceholder}
                    />
                    <button
                        onClick={() => onRemove(img.id)}
                        className="flex items-center gap-2 text-[10px] text-muted hover:text-red-400 transition-colors w-fit px-1"
                    >
                        <Icons.trash />
                        Remove
                    </button>
                </div>
            </td>

            {/* Column 2: Image Prompt & Refine */}
            <td className="p-4 align-top">
                <div className="flex flex-col gap-3">
                    <div className="relative">
                        <textarea 
                            value={img.visualPrompt || ''}
                            onChange={(e) => onPromptChange?.(img.id, e.target.value)}
                            className="w-full min-h-[80px] bg-surface border border-border rounded-lg p-3 text-xs text-muted focus:border-blue-500 outline-none transition-all resize-none leading-relaxed pr-10"
                            placeholder={t.charPromptPlaceholder}
                        />
                        <button
                            onClick={() => onGeneratePrompt?.(img.id)}
                            disabled={!img.name.trim() || img.isGenerating}
                            className="absolute right-2 top-2 p-1.5 bg-blue-500/10 hover:bg-primary-hover/20 text-primary rounded-md transition-all disabled:opacity-0"
                            title="Generate Prompt from Name"
                        >
                            <span className={`inline-block w-4 h-4 ${img.isGenerating ? 'animate-pulse' : ''}`} />
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <input 
                                type="text"
                                value={refineInput}
                                onChange={(e) => setRefineInput(e.target.value)}
                                placeholder={t.refinePlaceholder}
                                className="w-full bg-gray-50 border border-border rounded-lg pl-3 pr-10 py-2 text-[11px] text-foreground focus:border-blue-500 outline-none transition-all"
                            />
                            <button
                                onClick={() => {
                                    onRefine?.(img.id, refineInput);
                                    setRefineInput('');
                                }}
                                disabled={!refineInput.trim() || img.isGenerating}
                                className="absolute right-1 top-1 bottom-1 px-2 bg-blue-500/10 hover:bg-primary-hover/20 text-primary rounded-md transition-all disabled:opacity-0"
                            >
                                <Icons.sparkles />
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                onRefine?.(img.id, refineInput);
                                setRefineInput('');
                            }}
                            disabled={!refineInput.trim() || img.isGenerating}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-foreground text-[11px] font-bold rounded-lg border border-border transition-all flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                        >
                            <span className={`w-3 h-3 inline-block ${img.isGenerating ? 'animate-spin' : ''}`}><Icons.sparkles /></span>
                            {t.refinePrompt}
                        </button>
                    </div>
                </div>
            </td>

            {/* Column 3: Gambar Karakter */}
            <td className="p-4 align-top w-64">
                <div className="relative aspect-video rounded-xl bg-gray-50 border border-border overflow-hidden flex items-center justify-center group/img shadow-inner">
                    {img.data ? (
                        <>
                            <img 
                                src={img.data} 
                                alt={img.name} 
                                className="w-full h-full object-contain transition-transform duration-700 group-hover/img:scale-105 cursor-zoom-in" 
                                onClick={() => onZoom?.(img.data)}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                <button
                                    onClick={() => onZoom?.(img.data)}
                                    className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-foreground rounded-full border border-white/20 transition-all"
                                    title="Zoom"
                                >
                                    <Icons.zoomIn />
                                </button>
                                <button
                                    onClick={() => onGenerate?.(img.id)}
                                    disabled={img.isGenerating}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-foreground text-xs font-bold rounded-xl border border-white/20 transition-all flex items-center gap-2"
                                >
                                    <span className={`w-3.5 h-3.5 inline-block ${img.isGenerating ? 'animate-spin' : ''}`}><Icons.sparkles /></span>
                                    Regenerate
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-3 p-4 text-center">
                            <Icons.image />
                            <button
                                onClick={() => onGenerate?.(img.id)}
                                disabled={img.isGenerating}
                                className="px-5 py-2 bg-primary hover:bg-primary-hover text-foreground text-xs font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {img.isGenerating ? (
                                    <span className="animate-spin inline-block"><Icons.refresh /></span>
                                ) : (
                                    <Icons.sparkles />
                                )}
                                {img.isGenerating ? '...' : t.generateCharImg}
                            </button>
                        </div>
                    )}
                </div>
            </td>
        </motion.tr>
    );
};

const FileUpload: React.FC<FileUploadProps> = ({ 
  label, 
  onFilesChange, 
  currentImages,
  onGenerateImage,
  onPromptChange,
  onGeneratePrompt,
  onAddCharacter,
  globalSourceRefs,
  onGlobalSourceRefsChange,
  onRefinePrompt,
  t
}) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const handleGlobalSourceRefUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = 2 - globalSourceRefs.length;
    if (remaining <= 0) {
        alert("Maksimal 2 referensi gambar global.");
        return;
    }

    const fileArray: File[] = (Array.from(files) as File[]).slice(0, remaining);
    const promises = fileArray.map((file: File) => {
        return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
    });

    Promise.all(promises).then(newRefs => {
        onGlobalSourceRefsChange([...globalSourceRefs, ...newRefs]);
    });
    e.target.value = '';
  };

  const removeGlobalSourceRef = (index: number) => {
    const newRefs = globalSourceRefs.filter((_, i) => i !== index);
    onGlobalSourceRefsChange(newRefs);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 10 - currentImages.length;
    
    if (remainingSlots <= 0) {
        alert("Batas maksimum 10 gambar tercapai.");
        e.target.value = '';
        return;
    }

    let fileArray: File[] = Array.from(files);

    if (fileArray.length > remainingSlots) {
        alert(`Hanya ${remainingSlots} gambar yang akan ditambahkan dari ${fileArray.length} gambar yang dipilih.`);
        fileArray = fileArray.slice(0, remainingSlots);
    }

    const filePromises = fileArray.map((file) => {
        return new Promise<ReferenceImage>((resolve) => {
            const fileName = file.name.split('.').slice(0, -1).join('.') || file.name;
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                resolve({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: fileName,
                    data: result,
                    isGenerating: false
                });
            };
            reader.readAsDataURL(file);
        });
    });

    const newImages = await Promise.all(filePromises);
    onFilesChange([...currentImages, ...newImages]);
    e.target.value = '';
  };

  const removeImage = (id: string) => {
    const newImages = currentImages.filter((img) => img.id !== id);
    onFilesChange(newImages);
  };

  const handleNameChange = (id: string, newName: string) => {
      const newImages = currentImages.map(img => 
          img.id === id ? { ...img, name: newName } : img
      );
      onFilesChange(newImages);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
            <thead>
                <tr className="bg-surface/50 border-b border-border">
                    <th className="p-4 text-left text-[10px] font-bold text-muted uppercase tracking-widest">{t.charName}</th>
                    <th className="p-4 text-left text-[10px] font-bold text-muted uppercase tracking-widest">{t.charPrompt}</th>
                    <th className="p-4 text-left text-[10px] font-bold text-muted uppercase tracking-widest">{t.charImage}</th>
                </tr>
            </thead>
            <tbody>
                <AnimatePresence mode="popLayout">
                    {currentImages.map((img) => (
                        <CharacterRow 
                            key={img.id}
                            img={img}
                            onRemove={removeImage}
                            onNameChange={handleNameChange}
                            onPromptChange={onPromptChange}
                            onGeneratePrompt={onGeneratePrompt}
                            onGenerate={onGenerateImage}
                            onZoom={(url) => setZoomedImage(url)}
                            onRefine={onRefinePrompt}
                            t={t}
                        />
                    ))}
                </AnimatePresence>
                
                {currentImages.length === 0 && (
                    <tr>
                        <td colSpan={3} className="p-20 text-center">
                            <div className="flex flex-col items-center gap-4 opacity-30">
                                <Icons.image />
                                <p className="text-sm font-medium">Belum ada karakter yang dideteksi atau diunggah.</p>
                            </div>
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>

      <div className="p-4 bg-surface/30 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-foreground text-xs font-bold rounded-xl border border-border transition-all cursor-pointer">
                    <Icons.plus />
                    {t.uploadBtn}
                    <input 
                        type="file" 
                        accept="image/*"
                        multiple 
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </label>
                <button
                    onClick={onAddCharacter}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-foreground text-xs font-bold rounded-xl border border-border transition-all"
                >
                    <Icons.plus />
                    {t.addCharBtn}
                </button>
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{currentImages.length}/10 {t.filled}</span>
            </div>

            {/* Global Source Refs */}
            <div className="flex items-center gap-3 border-l border-border pl-6">
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Global Refs (Max 2):</span>
                <div className="flex gap-2">
                    {globalSourceRefs.map((ref, idx) => (
                        <div key={idx} className="relative w-10 h-10 rounded-lg border border-border overflow-hidden group/ref">
                            <img src={ref} className="w-full h-full object-cover" />
                            <button 
                                onClick={() => removeGlobalSourceRef(idx)}
                                className="absolute inset-0 bg-red-500/80 opacity-0 group-hover/ref:opacity-100 flex items-center justify-center transition-opacity"
                            >
                                <Icons.x />
                            </button>
                        </div>
                    ))}
                    {globalSourceRefs.length < 2 && (
                        <label className="w-10 h-10 rounded-lg border-2 border-dashed border-border hover:border-blue-500/50 flex items-center justify-center cursor-pointer transition-colors">
                            <Icons.plus />
                            <input type="file" accept="image/*" multiple className="hidden" onChange={handleGlobalSourceRefUpload} />
                        </label>
                    )}
                </div>
            </div>
        </div>
        <p className="text-[10px] text-muted max-w-md text-right leading-relaxed">
            {t.uploadHint}
        </p>
      </div>

      {/* Zoom Modal */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 cursor-zoom-out"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-full max-h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={zoomedImage} 
                className="max-w-full max-h-[90vh] rounded-lg shadow-md object-contain border border-white/10" 
                alt="Zoomed Character"
              />
              <button 
                onClick={() => setZoomedImage(null)}
                className="absolute -top-12 right-0 p-2 text-foreground/70 hover:text-foreground transition-colors"
              >
                <Icons.x />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUpload;
