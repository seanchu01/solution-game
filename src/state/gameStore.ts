import { create } from 'zustand';

export interface PlayerStats {
  knowledge: number;
  courage: number;
  luck: number;
}

export interface PlayerCharacter {
  name: string;
  level: number;
  title: string;
  species: string;
  workExperience: number;
  workRelated: boolean;
  guild?: string;
  status: string;
  englishLevel: string;
}

export interface GameEvent {
  eventID: string;
  title: string;
  description: string;
  choice1Text: string;
  choice1Effect: string;
  choice2Text: string;
  choice2Effect: string;
  choice3Text: string;
  choice3Effect: string;
  tags?: string;
  category?: string;
  courseType?: string;
}

export interface GameEnding {
  endingID: string;
  title: string;
  description: string;
  statCondition: string;
  statType: string;
  route: string;
  cta: string;
}

export type GameStage = 'character-creation' | 'main-game' | 'character-card' | 'ending';

interface GameState {
  // Game state
  currentStage: GameStage;
  currentRoute: string;
  currentEventIndex: number;
  completedEvents: string[];
  
  // Player data
  character: PlayerCharacter | null;
  stats: PlayerStats;
  
  // Game data
  events: GameEvent[];
  endings: GameEnding[];
  
  // Actions
  setStage: (stage: GameStage) => void;
  setCharacter: (character: PlayerCharacter) => void;
  updateStats: (effect: string) => void;
  setRoute: (route: string) => void;
  addEvent: (event: GameEvent) => void;
  addEnding: (ending: GameEnding) => void;
  completeEvent: (eventId: string) => void;
  nextEvent: () => void;
  resetGame: () => void;
}

const initialStats: PlayerStats = {
  knowledge: 1,
  courage: 1,
  luck: 1,
};

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  currentStage: 'character-creation',
  currentRoute: '',
  currentEventIndex: 0,
  completedEvents: [],
  character: null,
  stats: initialStats,
  events: [],
  endings: [],
  
  // Actions
  setStage: (stage) => set({ currentStage: stage }),
  
  setCharacter: (character) => set({ character }),
  
  updateStats: (effect) => {
    const { stats } = get();
    const newStats = { ...stats };
    
    // Parse effect string (e.g., "K+1", "C-1", "L+2")
    const match = effect.match(/([KCL])([+-])(\d+)/);
    if (match) {
      const [, stat, operator, value] = match;
      const change = parseInt(value) * (operator === '+' ? 1 : -1);
      
      switch (stat) {
        case 'K':
          newStats.knowledge = Math.max(1, Math.min(6, newStats.knowledge + change));
          break;
        case 'C':
          newStats.courage = Math.max(1, Math.min(6, newStats.courage + change));
          break;
        case 'L':
          newStats.luck = Math.max(1, Math.min(6, newStats.luck + change));
          break;
      }
    }
    
    set({ stats: newStats });
  },
  
  setRoute: (route) => set({ currentRoute: route }),
  
  addEvent: (event) => {
    const { events } = get();
    set({ events: [...events, event] });
  },
  
  addEnding: (ending) => {
    const { endings } = get();
    set({ endings: [...endings, ending] });
  },
  
  completeEvent: (eventId) => {
    const { completedEvents } = get();
    set({ completedEvents: [...completedEvents, eventId] });
  },
  
  nextEvent: () => {
    const { currentEventIndex } = get();
    set({ currentEventIndex: currentEventIndex + 1 });
  },
  
  resetGame: () => set({
    currentStage: 'character-creation',
    currentRoute: '',
    currentEventIndex: 0,
    completedEvents: [],
    character: null,
    stats: initialStats,
    events: [],
    endings: [],
  }),
}));

