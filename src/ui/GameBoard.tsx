import React, { useState, useEffect } from 'react';
import { useGameStore } from '../state/gameStore';
import { gameEngine } from '../engine/gameEngine';
import { GameEvent } from '../state/gameStore';

const GameBoard: React.FC = () => {
  const { 
    character, 
    stats, 
    currentRoute, 
    events, 
    currentEventIndex, 
    addEvent, 
    updateStats, 
    completeEvent, 
    nextEvent, 
    setStage 
  } = useGameStore();
  
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const initializeGame = async () => {
      try {
        await gameEngine.initialize();
        const generatedEvents = gameEngine.generateEvents(currentRoute);
        setGameEvents(generatedEvents);
        setCurrentEvent(generatedEvents[0]);
        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize game:', error);
        setLoading(false);
      }
    };
    initializeGame();
  }, [currentRoute]);

  const handleChoice = (choiceEffect: string) => {
    if (!currentEvent) return;

    // Update stats based on choice
    updateStats(choiceEffect);
    
    // Mark event as completed
    completeEvent(currentEvent.eventID);
    
    // Move to next event or end game
    if (currentEventIndex < gameEvents.length - 1) {
      nextEvent();
      setCurrentEvent(gameEvents[currentEventIndex + 1]);
    } else {
      // Game completed, go to ending
      setStage('ending');
    }
  };

  const getStatColor = (stat: number) => {
    if (stat >= 5) return 'text-green-600';
    if (stat >= 4) return 'text-blue-600';
    if (stat >= 3) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getStatBarColor = (stat: number) => {
    if (stat >= 5) return 'bg-green-500';
    if (stat >= 4) return 'bg-blue-500';
    if (stat >= 3) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your journey...</p>
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <p className="text-gray-600">No events available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Your Journey Continues</h2>
          <button
            onClick={() => setShowStats(!showStats)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </button>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentEventIndex + 1) / gameEvents.length) * 100}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>Event {currentEventIndex + 1} of {gameEvents.length}</span>
          <span>{character?.name}</span>
        </div>
      </div>

      {/* Stats Display */}
      {showStats && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Current Stats</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl mb-2">🧠</div>
              <div className={`font-bold ${getStatColor(stats.knowledge)}`}>
                {stats.knowledge}/6
              </div>
              <div className="text-sm text-gray-600">Knowledge</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">💪</div>
              <div className={`font-bold ${getStatColor(stats.courage)}`}>
                {stats.courage}/6
              </div>
              <div className="text-sm text-gray-600">Courage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🍀</div>
              <div className={`font-bold ${getStatColor(stats.luck)}`}>
                {stats.luck}/6
              </div>
              <div className="text-sm text-gray-600">Luck</div>
            </div>
          </div>
        </div>
      )}

      {/* Event Card */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">{currentEvent.title}</h3>
          <p className="text-gray-700 text-lg leading-relaxed">{currentEvent.description}</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleChoice(currentEvent.choice1Effect)}
            className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="font-medium text-gray-800 group-hover:text-blue-800">
              {currentEvent.choice1Text}
            </div>
            {currentEvent.choice1Effect && (
              <div className="text-sm text-blue-600 mt-1">
                Effect: {currentEvent.choice1Effect}
              </div>
            )}
          </button>

          <button
            onClick={() => handleChoice(currentEvent.choice2Effect)}
            className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="font-medium text-gray-800 group-hover:text-blue-800">
              {currentEvent.choice2Text}
            </div>
            {currentEvent.choice2Effect && (
              <div className="text-sm text-blue-600 mt-1">
                Effect: {currentEvent.choice2Effect}
              </div>
            )}
          </button>

          <button
            onClick={() => handleChoice(currentEvent.choice3Effect)}
            className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="font-medium text-gray-800 group-hover:text-blue-800">
              {currentEvent.choice3Text}
            </div>
            {currentEvent.choice3Effect && (
              <div className="text-sm text-blue-600 mt-1">
                Effect: {currentEvent.choice3Effect}
              </div>
            )}
          </button>
        </div>

        {currentEvent.tags && (
          <div className="mt-6 flex flex-wrap gap-2">
            {currentEvent.tags.split(',').map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameBoard;

