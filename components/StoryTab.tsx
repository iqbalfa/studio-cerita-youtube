import { motion } from 'framer-motion';
import React from 'react';
import { AppState } from '../types/types';
import FileUpload from './FileUpload';
import { Icons } from '../utils/icons';

interface StoryTabProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  t: Record<string, string>;
  isAdvancedOpen: boolean;
  setIsAdvancedOpen: (val: boolean) => void;
  handleContextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleGenerateCharacters: () => void;
  handleRefImagesChange: (images: any) => void;
  handleGenerateCharacterImage: (id: string) => void;
  handleCharacterPromptChange: (id: string, newPrompt: string) => void;
  handleGenerateCharacterPrompt: (id: string) => void;
  handleGlobalSourceRefsChange: (refs: string[]) => void;
}

const StoryTab: React.FC<StoryTabProps> = ({
  state,
  setState,
  t,
  isAdvancedOpen,
  setIsAdvancedOpen,
  handleContextChange,
  handleGenerateCharacters,
  handleRefImagesChange,
  handleGenerateCharacterImage,
  handleCharacterPromptChange,
  handleGenerateCharacterPrompt,
  handleGlobalSourceRefsChange,
}) => {
  return (
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
  );
};

export default StoryTab;