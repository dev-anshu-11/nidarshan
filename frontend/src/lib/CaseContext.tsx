import React, { createContext, useContext, useState, useCallback } from 'react';

// ── Types matching backend responses ──────────────────────────────────
export interface AnalysisEntity {
  id: string;
  value: string;
  type: string;
  sourceFiles: string[];
  score: number;
  tier: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  reasons: string[];
}

export interface AnalysisLink {
  id: string;
  from: string;
  to: string;
  linkType: string;
  weight: number;
  sources: string[];
}

export interface AnalysisTimeline {
  file: string;
  timestamp: string;
  summary: string;
}

export interface UploadedFile {
  id: string;
  originalName: string;
  format: string;
  sizeBytes: number;
  sha256: string;
  rowCount: number;
  entities: { type: string; value: string; confidence: number }[];
  textSummary: string;
}

export interface AnalysisData {
  entities: AnalysisEntity[];
  links: AnalysisLink[];
  timeline: AnalysisTimeline[];
  fileCount: number;
  entityCount: number;
  linkCount: number;
}

export interface CaseState {
  caseNumber: string;
  caseName: string;
  status: 'idle' | 'uploading' | 'processing' | 'ready' | 'error';
  uploadedFiles: UploadedFile[];
  analysis: AnalysisData | null;
  error: string | null;
}

interface CaseContextValue extends CaseState {
  setCaseNumber: (caseNumber: string) => void;
  setCaseName: (name: string) => void;
  setStatus: (status: CaseState['status']) => void;
  setUploadedFiles: (files: UploadedFile[]) => void;
  setAnalysis: (data: AnalysisData) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: CaseState = {
  caseNumber: '',
  caseName: '',
  status: 'idle',
  uploadedFiles: [],
  analysis: null,
  error: null,
};

const CaseContext = createContext<CaseContextValue | null>(null);

export function CaseProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CaseState>(initialState);

  const setCaseNumber = useCallback((caseNumber: string) => setState(s => ({ ...s, caseNumber })), []);
  const setCaseName = useCallback((caseName: string) => setState(s => ({ ...s, caseName })), []);
  const setStatus = useCallback((status: CaseState['status']) => setState(s => ({ ...s, status })), []);
  const setUploadedFiles = useCallback((uploadedFiles: UploadedFile[]) => setState(s => ({ ...s, uploadedFiles })), []);
  const setAnalysis = useCallback((analysis: AnalysisData) => setState(s => ({ ...s, analysis, status: 'ready' as const })), []);
  const setError = useCallback((error: string | null) => setState(s => ({ ...s, error, status: error ? 'error' as const : s.status })), []);
  const reset = useCallback(() => setState(initialState), []);

  return (
    <CaseContext.Provider value={{ ...state, setCaseNumber, setCaseName, setStatus, setUploadedFiles, setAnalysis, setError, reset }}>
      {children}
    </CaseContext.Provider>
  );
}

export function useCase(): CaseContextValue {
  const ctx = useContext(CaseContext);
  if (!ctx) throw new Error('useCase must be used inside <CaseProvider>');
  return ctx;
}
