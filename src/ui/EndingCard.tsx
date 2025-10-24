import React, { useState, useEffect } from 'react';
import { useGameStore } from '../state/gameStore';
import { gameEngine } from '../engine/gameEngine';
import { GameEnding } from '../state/gameStore';

const EndingCard: React.FC = () => {
  const { character, stats, currentRoute, resetGame } = useGameStore();
  const [ending, setEnding] = useState<GameEnding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEnding = async () => {
      try {
        await gameEngine.initialize();
        const determinedEnding = gameEngine.determineEnding(stats, currentRoute);
        setEnding(determinedEnding);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load ending:', error);
        setLoading(false);
      }
    };
    loadEnding();
  }, [stats, currentRoute]);

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

  const getEndingEmoji = (statType: string) => {
    const emojiMap: { [key: string]: string } = {
      'Strategic': '🧠',
      'Adventurous': '⚔️',
      'Serendipity': '🍀',
      'Harmonious': '⚖️'
    };
    return emojiMap[statType] || '🎯';
  };

  const getEndingColor = (statType: string) => {
    const colorMap: { [key: string]: string } = {
      'Strategic': 'from-blue-500 to-indigo-600',
      'Adventurous': 'from-red-500 to-pink-600',
      'Serendipity': 'from-yellow-500 to-orange-600',
      'Harmonious': 'from-green-500 to-teal-600'
    };
    return colorMap[statType] || 'from-gray-500 to-gray-600';
  };

  const getDominantStat = () => {
    const { knowledge, courage, luck } = stats;
    const max = Math.max(knowledge, courage, luck);
    
    if (knowledge === max) return { name: 'Knowledge', value: knowledge, emoji: '🧠' };
    if (courage === max) return { name: 'Courage', value: courage, emoji: '💪' };
    return { name: 'Luck', value: luck, emoji: '🍀' };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Determining your ending...</p>
      </div>
    );
  }

  if (!ending || !character) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <p className="text-gray-600">No ending data found.</p>
      </div>
    );
  }

  const dominantStat = getDominantStat();

  return (
    <div className="space-y-6">
      {/* Ending Card */}
      <div className={`bg-gradient-to-r ${getEndingColor(ending.statType)} rounded-lg shadow-lg p-8 text-white`}>
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">{getEndingEmoji(ending.statType)}</div>
          <h2 className="text-3xl font-bold mb-2">{ending.title}</h2>
          <p className="text-xl opacity-90">{ending.description}</p>
        </div>
      </div>

      {/* Character Summary */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Your Journey Summary</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Character Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-700">Character Profile</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{character.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Level:</span>
                <span className="font-medium">{character.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Education:</span>
                <span className="font-medium capitalize">{character.title.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Field:</span>
                <span className="font-medium capitalize">{character.species}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium capitalize">{character.status.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Final Stats */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-700">Final Attributes</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-600">🧠 Knowledge</span>
                  <span className={`font-bold ${getStatColor(stats.knowledge)}`}>
                    {stats.knowledge}/6
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getStatBarColor(stats.knowledge)}`}
                    style={{ width: `${(stats.knowledge / 6) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-600">💪 Courage</span>
                  <span className={`font-bold ${getStatColor(stats.courage)}`}>
                    {stats.courage}/6
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getStatBarColor(stats.courage)}`}
                    style={{ width: `${(stats.courage / 6) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-600">🍀 Luck</span>
                  <span className={`font-bold ${getStatColor(stats.luck)}`}>
                    {stats.luck}/6
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getStatBarColor(stats.luck)}`}
                    style={{ width: `${(stats.luck / 6) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dominant Stat Highlight */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
        <div className="text-center">
          <div className="text-4xl mb-2">{dominantStat.emoji}</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Your Dominant Trait: {dominantStat.name}
          </h3>
          <p className="text-gray-600">
            Your {dominantStat.name.toLowerCase()} of {dominantStat.value}/6 has shaped your journey and determined your ending.
          </p>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white text-center">
        <h3 className="text-2xl font-bold mb-4">Ready for the Real Journey?</h3>
        <p className="text-lg mb-6 opacity-90">{ending.cta}</p>
        <div className="space-y-4">
          <button
            onClick={resetGame}
            className="w-full md:w-auto px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default EndingCard;

