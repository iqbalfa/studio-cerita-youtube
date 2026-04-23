import { motion } from 'motion/react';
import React from 'react';
import { AppState } from '../types/types';
import AudioPlayer from './AudioPlayer';
import { Icons } from '../utils/icons';
import { TTS_PRESETS } from '../ttsPresets';

interface VoiceTabProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  t: Record<string, string>;
  handleTargetChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleGenerateTTS: () => void;
  isGeneratingTTS: boolean;
  generatedAudioUrls: string[];
}

const VoiceTab: React.FC<VoiceTabProps> = ({
  state,
  setState,
  t,
  handleTargetChange,
  handleGenerateTTS,
  isGeneratingTTS,
  generatedAudioUrls,
}) => {
  return (
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
                  </div>

                  <div className="space-y-2 flex flex-col flex-1">
                      <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => setState(prev => ({ ...prev, voiceDirectorVersion: prev.targetParagraph }))}
                          className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all border bg-blue-500/10 text-primary border-blue-500/30 hover:bg-primary-hover/20 shadow-lg shadow-blue-500/5"
                      >
                          <Icons.monitor />
                          {t.voiceDirectorBtn}
                      </motion.button>
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
  );
};

export default VoiceTab;