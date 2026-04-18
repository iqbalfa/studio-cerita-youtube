import React, { useRef, useState } from 'react';

// SVG Icons
const Icons = {
  save: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  ),
  load: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  eye: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  eyeOff: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ),
  check: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
  ),
  lock: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  layout: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  image: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  volume: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  ),
  grid: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  building: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  plus: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
    </svg>
  ),
};

export type TabId = 'story' | 'voice' | 'storyboard';

interface LayoutProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: React.ReactNode;
  isLoading: boolean;
  language: 'id' | 'en';
  onLanguageChange: (lang: 'id' | 'en') => void;
  onSaveProject: () => void;
  onLoadProject: (e: React.ChangeEvent<HTMLInputElement>) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  narratorName: string;
  stylePreset: string;
  onStylePresetChange: (preset: string) => void;
  statusLabel: string;
}

const TRANSLATIONS: Record<'id' | 'en', any> = {
  id: {
    appTitle: 'STUDIO CERITA',
    appSubtitle: 'Visual Storyboard Engine',
    workflow: 'Workflow',
    step1: 'Konteks & Karakter',
    step2: 'Voice & Audio',
    step3: 'Storyboard',
    session: 'Sesi',
    save: 'Simpan Proyek',
    load: 'Buka Proyek',
    apiKey: 'Gemini API Key',
    masterPreset: 'Master Preset',
    language: 'Bahasa Sistem',
    aiWorking: 'AI sedang memproses...',
    loading: 'Memuat...',
  },
  en: {
    appTitle: 'STUDIO CERITA',
    appSubtitle: 'Visual Storyboard Engine',
    workflow: 'Workflow',
    step1: 'Context & Characters',
    step2: 'Voice & Audio',
    step3: 'Storyboard',
    session: 'Session',
    save: 'Save Project',
    load: 'Load Project',
    apiKey: 'Gemini API Key',
    masterPreset: 'Master Preset',
    language: 'System Language',
    aiWorking: 'AI is processing...',
    loading: 'Loading...',
  }
};

const STEPS: { id: TabId; iconKey: keyof typeof Icons }[] = [
  { id: 'story', iconKey: 'image' },
  { id: 'voice', iconKey: 'volume' },
  { id: 'storyboard', iconKey: 'grid' },
];

const PRESETS = [
  { value: 'Ilmu Lidi', label: 'Ilmu Lidi' },
  { value: 'ILMU SURVIVAL', label: 'Ilmu Survival' },
  { value: 'ILMU NYANTUY', label: 'Ilmu Nyantuy' },
  { value: 'ILMU PSIKOLOGI', label: 'Ilmu Psikologi' },
  { value: 'Custom', label: 'Custom' },
];

export const Layout: React.FC<LayoutProps> = ({
  activeTab, onTabChange, children, isLoading,
  language, onLanguageChange, onSaveProject, onLoadProject,
  apiKey, onApiKeyChange, narratorName, stylePreset, onStylePresetChange,
  statusLabel,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  const t = TRANSLATIONS[language];
  const stepIndex = STEPS.findIndex(s => s.id === activeTab);
  const progressPercent = ((stepIndex + 1) / STEPS.length) * 100;

  const stepLabels: Record<TabId, string> = {
    story: t.step1,
    voice: t.step2,
    storyboard: t.step3,
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onLoadProject(e);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-sidebar text-sidebar-text flex-shrink-0 md:h-screen md:sticky md:top-0 overflow-y-auto shadow-xl z-20 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg font-bold tracking-tight text-primary">
              {t.appTitle}
            </h1>
            <span className="text-[10px] font-mono bg-gray-800 text-gray-500 px-2 py-0.5 rounded border border-gray-700">v2.20</span>
          </div>
          <p className="text-xs text-gray-400">{t.appSubtitle}</p>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-gray-500 mb-1.5">
              <span>Langkah {stepIndex + 1} dari {STEPS.length}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="step-progress">
              <div className="step-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          {/* Master Preset — Channel Selector */}
          <div className="mt-5">
            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              <Icons.building />
              {t.masterPreset}
            </label>
            <select
              value={stylePreset}
              onChange={(e) => onStylePresetChange(e.target.value)}
              className="w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-flat cursor-pointer"
            >
              {PRESETS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Language selector */}
          <div className="mt-5">
            <label className="block text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">
              {t.language}
            </label>
            <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
              <button
                onClick={() => onLanguageChange('id')}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-flat cursor-pointer ${
                  language === 'id'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                ID
              </button>
              <button
                onClick={() => onLanguageChange('en')}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-flat cursor-pointer ${
                  language === 'en'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          {/* API Key */}
          <div className="mt-5">
            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              <Icons.lock />
              {t.apiKey}
            </label>
            <div className="relative mt-2">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                placeholder="AIza..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring pr-9 transition-flat"
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-flat cursor-pointer"
                aria-label={showApiKey ? 'Hide API Key' : 'Show API Key'}
              >
                {showApiKey ? <Icons.eyeOff /> : <Icons.eye />}
              </button>
            </div>
            {apiKey ? (
              <p className="text-[10px] text-primary mt-1.5 flex items-center gap-1">
                <Icons.check /> API Key tersimpan
              </p>
            ) : (
              <p className="text-[10px] text-gray-600 mt-1.5">
                Dapatkan gratis di aistudio.google.com/apikey
              </p>
            )}
          </div>
        </div>

        {/* Steps navigation */}
        <nav className="p-4 space-y-1 flex-1">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-3 mb-2">{t.workflow}</p>
          {STEPS.map((step, idx) => {
            const isCurrent = activeTab === step.id;
            const Icon = Icons[step.iconKey];
            return (
              <button
                key={step.id}
                onClick={() => onTabChange(step.id)}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-flat cursor-pointer ${
                  isCurrent
                    ? 'bg-primary text-on-primary shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center text-[10px] font-bold transition-flat ${
                  isCurrent
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-800 text-gray-500'
                }`}>
                  {idx + 1}
                </div>
                <span className="truncate">{stepLabels[step.id]}</span>
              </button>
            );
          })}
        </nav>

        {/* Status bar */}
        <div className="px-4 pb-2">
          <div className={`w-full py-2 px-3 rounded-lg text-center font-bold text-[10px] uppercase tracking-widest ${
            stylePreset === 'Custom'
              ? 'bg-purple-900/40 text-purple-300 border border-purple-800/50'
              : 'bg-primary/10 text-primary border border-primary/20'
          }`}>
            {statusLabel}
          </div>
        </div>

        {/* Session Control */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">{t.session}</p>
          <button
            onClick={onSaveProject}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-medium text-gray-300 transition-flat border border-gray-700 cursor-pointer"
          >
            <Icons.save />
            {t.save}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-medium text-gray-300 transition-flat border border-gray-700 cursor-pointer"
          >
            <Icons.load />
            {t.load}
          </button>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-background">
        <div className="max-w-[1400px] mx-auto">
          {/* Loading overlay */}
          {isLoading && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm">
              <div className="bg-surface p-8 rounded-2xl shadow-2xl flex flex-col items-center border border-border">
                <div className="spinner mb-5" />
                <h3 className="text-base font-semibold text-foreground mb-1">{t.loading}</h3>
                <p className="text-xs text-gray-500">{t.aiWorking}</p>
              </div>
            </div>
          )}

          {/* Content card */}
          <div className="animate-fade-up bg-surface rounded-2xl shadow-sm border border-border min-h-[80vh] p-8 relative">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
