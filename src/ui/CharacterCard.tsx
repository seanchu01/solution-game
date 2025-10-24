import React from 'react';
import { useGameStore } from '../state/gameStore';

const CharacterCard: React.FC = () => {
  const { character, stats, currentRoute, setStage } = useGameStore();

  if (!character) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <p className="text-gray-600">No character data found.</p>
      </div>
    );
  }

  const getSpeciesEmoji = (species: string) => {
    const emojiMap: { [key: string]: string } = {
      'business': '🦅',
      'engineering': '🐉',
      'arts': '🔥',
      'science': '🦉',
      'health': '🦄',
      'education': '🦉',
      'it': '🐉',
      'law': '🦅',
      'agriculture': '🌳'
    };
    return emojiMap[species] || '👤';
  };

  const getTitleEmoji = (title: string) => {
    const emojiMap: { [key: string]: string } = {
      'high_school': '📚',
      'diploma': '🎓',
      'bachelor': '🎓',
      'master': '🎓',
      'phd': '🎓'
    };
    return emojiMap[title] || '📚';
  };

  const getStatusEmoji = (status: string) => {
    const emojiMap: { [key: string]: string } = {
      'outside': '✈️',
      'student': '🎓',
      'whv': '🎒',
      'graduate': '💼'
    };
    return emojiMap[status] || '❓';
  };

  const getRouteName = (route: string) => {
    const routeMap: { [key: string]: string } = {
      'OVS': 'Offshore Planning',
      'STD': 'Student Visa',
      'WHV': 'Working Holiday',
      'PSW': 'Graduate Visa'
    };
    return routeMap[route] || route;
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Character Created!</h2>
        <p className="text-gray-600">Your Australian migration journey begins now</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Character Info */}
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Character Profile</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">👤</span>
                <div>
                  <div className="font-medium text-gray-800">{character.name}</div>
                  <div className="text-sm text-gray-600">Level {character.level}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getTitleEmoji(character.title)}</span>
                <div>
                  <div className="font-medium text-gray-800 capitalize">{character.title.replace('_', ' ')}</div>
                  <div className="text-sm text-gray-600">Education Level</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getSpeciesEmoji(character.species)}</span>
                <div>
                  <div className="font-medium text-gray-800 capitalize">{character.species}</div>
                  <div className="text-sm text-gray-600">Field of Study</div>
                </div>
              </div>

              {character.guild && (
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">⚔️</span>
                  <div>
                    <div className="font-medium text-gray-800 capitalize">{character.guild}</div>
                    <div className="text-sm text-gray-600">Work Guild</div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getStatusEmoji(character.status)}</span>
                <div>
                  <div className="font-medium text-gray-800 capitalize">{character.status.replace('_', ' ')}</div>
                  <div className="text-sm text-gray-600">Current Status</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Attributes</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">🧠 Knowledge</span>
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
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">💪 Courage</span>
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
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">🍀 Luck</span>
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

        {/* Journey Info */}
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Your Journey</h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🗺️</span>
                <div>
                  <div className="font-medium text-gray-800">{getRouteName(currentRoute)}</div>
                  <div className="text-sm text-gray-600">Selected Route</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-2xl">📚</span>
                <div>
                  <div className="font-medium text-gray-800 capitalize">{character.englishLevel}</div>
                  <div className="text-sm text-gray-600">English Proficiency</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-2xl">💼</span>
                <div>
                  <div className="font-medium text-gray-800">{character.workExperience} years</div>
                  <div className="text-sm text-gray-600">Work Experience</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-yellow-800 mb-2">Ready to Begin!</h3>
            <p className="text-yellow-700 text-sm mb-4">
              Your character is ready for the Australian migration journey. 
              You'll face 7 events that will test your knowledge, courage, and luck.
            </p>
            <button
              onClick={() => setStage('main-game')}
              className="w-full bg-yellow-600 text-white py-3 px-6 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
            >
              Start Your Journey
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterCard;

