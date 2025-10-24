import Papa from 'papaparse';

export interface CSVData {
  [key: string]: any;
}

export class CSVLoader {
  private static instance: CSVLoader;
  private cache: Map<string, CSVData[]> = new Map();

  static getInstance(): CSVLoader {
    if (!CSVLoader.instance) {
      CSVLoader.instance = new CSVLoader();
    }
    return CSVLoader.instance;
  }

  async loadCSV<T = CSVData>(filename: string): Promise<T[]> {
    if (this.cache.has(filename)) {
      return this.cache.get(filename) as T[];
    }

    try {
      const response = await fetch(`/data/${filename}`);
      const csvText = await response.text();
      
      return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data as T[];
            this.cache.set(filename, data);
            resolve(data);
          },
          error: (error) => {
            console.error(`Error loading ${filename}:`, error);
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error(`Failed to load ${filename}:`, error);
      throw error;
    }
  }

  async loadGameData() {
    try {
      const [
        characterCreation,
        characterOptions,
        commonEvents,
        stdEvents,
        whvEvents,
        pswEvents,
        ovsEvents,
        endings,
        metadata,
        funEvents
      ] = await Promise.all([
        this.loadCSV('01_CharacterCreation.csv'),
        this.loadCSV('01a_CharacterOptions.csv'),
        this.loadCSV('02_Events_Common.csv'),
        this.loadCSV('03_Events_STD.csv'),
        this.loadCSV('04_Events_WHV.csv'),
        this.loadCSV('05_Events_PSW.csv'),
        this.loadCSV('06_Events_OVS.csv'),
        this.loadCSV('07_Endings.csv'),
        this.loadCSV('08_Metadata.csv'),
        this.loadCSV('09_Events_Fun.csv')
      ]);

      return {
        characterCreation,
        characterOptions,
        commonEvents,
        stdEvents,
        whvEvents,
        pswEvents,
        ovsEvents,
        endings,
        metadata,
        funEvents
      };
    } catch (error) {
      console.error('Failed to load game data:', error);
      throw error;
    }
  }
}

export const csvLoader = CSVLoader.getInstance();

