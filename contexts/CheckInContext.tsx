import React, { createContext, useContext, useState, useCallback } from 'react';

export interface CheckInDraft {
  mood_score: number;
  mood_label: string;
  activities: string[];
  social_context: string | null;
  physical_sensations: string[];
  latitude: number | null;
  longitude: number | null;
  location_label: string | null;
  use_location: boolean;
  notes: string;
  voice_note_uri: string | null;
}

const DEFAULT_DRAFT: CheckInDraft = {
  mood_score: 5,
  mood_label: 'Okay',
  activities: [],
  social_context: null,
  physical_sensations: [],
  latitude: null,
  longitude: null,
  location_label: null,
  use_location: true,
  notes: '',
  voice_note_uri: null,
};

interface CheckInContextType {
  draft: CheckInDraft;
  updateDraft: (updates: Partial<CheckInDraft>) => void;
  resetDraft: () => void;
}

const CheckInContext = createContext<CheckInContextType | null>(null);

export function CheckInProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<CheckInDraft>(DEFAULT_DRAFT);

  const updateDraft = useCallback((updates: Partial<CheckInDraft>) => {
    setDraft(prev => ({ ...prev, ...updates }));
  }, []);

  const resetDraft = useCallback(() => {
    setDraft(DEFAULT_DRAFT);
  }, []);

  return (
    <CheckInContext.Provider value={{ draft, updateDraft, resetDraft }}>
      {children}
    </CheckInContext.Provider>
  );
}

export function useCheckIn(): CheckInContextType {
  const ctx = useContext(CheckInContext);
  if (!ctx) throw new Error('useCheckIn must be used within CheckInProvider');
  return ctx;
}
