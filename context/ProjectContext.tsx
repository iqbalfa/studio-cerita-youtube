import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AppState } from '../types/types';
import { DEFAULT_SYSTEM_PROMPT, ILMU_LIDI_STYLE, ILMU_SURVIVAL_STYLE, ILMU_NYANTUY_STYLE, ILMU_PSIKOLOGI_STYLE } from '../types/types';

interface ProjectContextType {
  project: AppState;
  setProject: React.Dispatch<React.SetStateAction<AppState>>;
  resetProject: () => void;
}

const defaultProject: AppState = {
  contextNarrative: '',
  targetParagraph: '',
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
  ttsSpeakerProfile: '',
  ttsScene: '',
  ttsDirectorNotes: ''
};

const ProjectContext = createContext<ProjectContextType | null>(null);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [project, setProject] = useState<AppState>(defaultProject);
  
  const resetProject = useCallback(() => setProject(defaultProject), []);

  return (
    <ProjectContext.Provider value={{ project, setProject, resetProject }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
};
