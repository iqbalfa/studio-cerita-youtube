import { motion } from 'framer-motion';
import React from 'react';
import { AppState } from '../types/types';
import StoryTable from './StoryTable';
import { Icons } from '../utils/icons';

interface StoryboardTabProps {
  state: AppState;
  t: Record<string, string>;
  handleAnalyzeStory: () => void;
  handleGenerateImage: (sceneId: string, frameId: string, overridePreviousImage?: string) => void;
  handleGenerateSequence: (sceneId: string) => void;
  handleUpdatePrompt: (sceneId: string, frameId: string, newPrompt: string) => void;
  handleRefinePrompt: (sceneId: string, frameId: string, instruction: string) => void;
  handleFormatChange: (sceneId: string, format: "Single Panel" | "Multi Panel" | "Sequence", count: number) => void;
  handleSaveNarrative: (sceneId: string, newText: string) => void;
  handleAddScene: (indexToInsertAfter?: number) => void;
  handleDeleteScene: (sceneId: string) => void;
  handleUpdateSplitText: (sceneId: string, frameId: string, newSplitText: string[]) => void;
  handleGeneratePrompts: (sceneId: string) => void;
  handleGenerateAllImages: () => void;
  isGeneratingAll: boolean;
  generateAllProgress: { current: number; total: number; currentScene?: string };
  handleCancelGenerateAll: () => void;
}

const StoryboardTab: React.FC<StoryboardTabProps> = ({
  state,
  t,
  handleAnalyzeStory,
  handleGenerateImage,
  handleGenerateSequence,
  handleUpdatePrompt,
  handleRefinePrompt,
  handleFormatChange,
  handleSaveNarrative,
  handleAddScene,
  handleDeleteScene,
  handleUpdateSplitText,
  handleGeneratePrompts,
  handleGenerateAllImages,
  isGeneratingAll,
  generateAllProgress,
  handleCancelGenerateAll,
}) => {
  return (
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
  );
};

export default StoryboardTab;