import { csvLoader } from '../data/csvLoader';
import { GameEvent, GameEnding, PlayerCharacter, PlayerStats } from '../state/gameStore';

export interface GameData {
  characterCreation: any[];
  characterOptions: any[];
  commonEvents: any[];
  stdEvents: any[];
  whvEvents: any[];
  pswEvents: any[];
  ovsEvents: any[];
  endings: any[];
  metadata: any[];
  funEvents: any[];
}

export class GameEngine {
  private static instance: GameEngine;
  private gameData: GameData | null = null;

  static getInstance(): GameEngine {
    if (!GameEngine.instance) {
      GameEngine.instance = new GameEngine();
    }
    return GameEngine.instance;
  }

  async initialize(): Promise<void> {
    if (!this.gameData) {
      this.gameData = await csvLoader.loadGameData();
    }
  }

  getCharacterCreationQuestions() {
    if (!this.gameData) throw new Error('Game not initialized');
    return this.gameData.characterCreation;
  }

  getCharacterOptions() {
    if (!this.gameData) throw new Error('Game not initialized');
    return this.gameData.characterOptions;
  }

  getOptionsByType(type: string) {
    if (!this.gameData) throw new Error('Game not initialized');
    return this.gameData.characterOptions.filter((option: any) => option.OptionType === type);
  }

  determineRoute(character: PlayerCharacter): string {
    // Map status to route
    const statusToRoute: { [key: string]: string } = {
      'outside': 'OVS',
      'student': 'STD',
      'whv': 'WHV',
      'graduate': 'PSW'
    };
    
    return statusToRoute[character.status] || 'OVS';
  }

  generateEvents(route: string, courseType?: string): GameEvent[] {
    if (!this.gameData) throw new Error('Game not initialized');
    
    const events: GameEvent[] = [];
    
    // Add one common event
    const commonEvent = this.getRandomEvent(this.gameData.commonEvents);
    if (commonEvent) events.push(this.convertToGameEvent(commonEvent));
    
    // Add three route-specific events
    const routeEvents = this.getRouteEvents(route);
    const selectedRouteEvents = this.getRandomEvents(routeEvents, 3);
    selectedRouteEvents.forEach(event => {
      if (event) events.push(this.convertToGameEvent(event));
    });
    
    // Add one fun event
    const funEvent = this.getRandomEvent(this.gameData.funEvents);
    if (funEvent) events.push(this.convertToGameEvent(funEvent));
    
    return events;
  }

  private getRouteEvents(route: string) {
    if (!this.gameData) return [];
    
    switch (route) {
      case 'STD': return this.gameData.stdEvents;
      case 'WHV': return this.gameData.whvEvents;
      case 'PSW': return this.gameData.pswEvents;
      case 'OVS': return this.gameData.ovsEvents;
      default: return [];
    }
  }

  private getRandomEvent(events: any[]): any {
    if (events.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * events.length);
    return events[randomIndex];
  }

  private getRandomEvents(events: any[], count: number): any[] {
    const shuffled = [...events].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private convertToGameEvent(data: any): GameEvent {
    return {
      eventID: data.EventID,
      title: data.Title,
      description: data.Description,
      choice1Text: data.Choice1Text,
      choice1Effect: data.Choice1Effect,
      choice2Text: data.Choice2Text,
      choice2Effect: data.Choice2Effect,
      choice3Text: data.Choice3Text,
      choice3Effect: data.Choice3Effect,
      tags: data.Tags,
      category: data.Category,
      courseType: data.CourseType
    };
  }

  determineEnding(stats: PlayerStats, route: string): GameEnding {
    if (!this.gameData) throw new Error('Game not initialized');
    
    const { knowledge, courage, luck } = stats;
    
    // Find the best matching ending based on stats
    let bestEnding = this.gameData.endings[0]; // fallback
    
    for (const ending of this.gameData.endings) {
      if (ending.Route === 'All' || ending.Route === route) {
        // Check if this ending matches the current stat distribution
        if (this.matchesStatCondition(ending.StatCondition, stats)) {
          bestEnding = ending;
          break;
        }
      }
    }
    
    return this.convertToGameEnding(bestEnding);
  }

  private matchesStatCondition(condition: string, stats: PlayerStats): boolean {
    const { knowledge, courage, luck } = stats;
    
    // Parse conditions like "Knowledge >= Courage AND Knowledge >= Luck"
    if (condition.includes('Knowledge >= Courage') && condition.includes('Knowledge >= Luck')) {
      return knowledge >= courage && knowledge >= luck;
    }
    if (condition.includes('Courage >= Knowledge') && condition.includes('Courage >= Luck')) {
      return courage >= knowledge && courage >= luck;
    }
    if (condition.includes('Luck >= Knowledge') && condition.includes('Luck >= Courage')) {
      return luck >= knowledge && luck >= courage;
    }
    if (condition.includes('Balanced')) {
      const max = Math.max(knowledge, courage, luck);
      const min = Math.min(knowledge, courage, luck);
      return max - min <= 1;
    }
    
    // Check for specific stat thresholds
    if (condition.includes('Knowledge >= 4')) {
      return knowledge >= 4;
    }
    if (condition.includes('Courage >= 4')) {
      return courage >= 4;
    }
    if (condition.includes('Luck >= 4')) {
      return luck >= 4;
    }
    
    return true; // fallback
  }

  private convertToGameEnding(data: any): GameEnding {
    return {
      endingID: data.EndingID,
      title: data.Title,
      description: data.Description,
      statCondition: data.StatCondition,
      statType: data.StatType,
      route: data.Route,
      cta: data.CTA
    };
  }
}

export const gameEngine = GameEngine.getInstance();

