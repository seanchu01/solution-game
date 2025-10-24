import React, { useState, useEffect } from 'react';
import { useGameStore } from '../state/gameStore';
import { gameEngine } from '../engine/gameEngine';

interface CharacterFormData {
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

const CharacterCreation: React.FC = () => {
  const { setCharacter, updateStats, setRoute, setStage } = useGameStore();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [formData, setFormData] = useState<CharacterFormData>({
    name: '',
    level: 18,
    title: '',
    species: '',
    workExperience: 0,
    workRelated: false,
    guild: '',
    status: '',
    englishLevel: ''
  });
  const [questions, setQuestions] = useState<any[]>([]);
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        await gameEngine.initialize();
        const questionsData = gameEngine.getCharacterCreationQuestions();
        const optionsData = gameEngine.getCharacterOptions();
        setQuestions(questionsData);
        setOptions(optionsData);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load character creation data:', error);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleInputChange = (field: keyof CharacterFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    // Apply stat modifiers from character creation
    const titleOption = options.find(opt => opt.OptionType === 'Title' && opt.OptionID === formData.title);
    const speciesOption = options.find(opt => opt.OptionType === 'Species' && opt.OptionID === formData.species);
    const guildOption = options.find(opt => opt.OptionType === 'Guild' && opt.OptionID === formData.guild);
    const englishOption = options.find(opt => opt.OptionType === 'English' && opt.OptionID === formData.englishLevel);

    if (titleOption?.StatModifier) updateStats(titleOption.StatModifier);
    if (speciesOption?.StatModifier) updateStats(speciesOption.StatModifier);
    if (guildOption?.StatModifier) updateStats(guildOption.StatModifier);
    if (englishOption?.StatModifier) updateStats(englishOption.StatModifier);

    setCharacter(formData);
    const route = gameEngine.determineRoute(formData);
    setRoute(route);
    setStage('character-card');
  };

  const getCurrentQuestion = () => {
    if (!questions[currentQuestion]) return null;
    return questions[currentQuestion];
  };

  const getOptionsForQuestion = (questionId: string) => {
    const question = questions.find(q => q.QuestionID === questionId);
    if (!question) return [];

    if (questionId === 'Q3a') {
      return options.filter(opt => opt.OptionType === 'Species');
    } else if (questionId === 'Q4b') {
      return options.filter(opt => opt.OptionType === 'Guild');
    } else if (questionId === 'Q5') {
      return options.filter(opt => opt.OptionType === 'Status');
    } else if (questionId === 'Q6') {
      return options.filter(opt => opt.OptionType === 'English');
    }
    
    return [];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading character creation...</p>
      </div>
    );
  }

  const question = getCurrentQuestion();
  if (!question) return null;

  const questionOptions = getOptionsForQuestion(question.QuestionID);

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {question.QuestionText}
          </h2>
          <span className="text-sm text-gray-500">
            {currentQuestion + 1} of {questions.length}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-4">
        {question.QuestionType === 'text' && (
          <input
            type="text"
            value={formData[question.QuestionID as keyof CharacterFormData] as string || ''}
            onChange={(e) => handleInputChange(question.QuestionID as keyof CharacterFormData, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Enter your ${question.QuestionText.toLowerCase()}`}
          />
        )}

        {question.QuestionType === 'number' && (
          <input
            type="number"
            value={formData[question.QuestionID as keyof CharacterFormData] as number || ''}
            onChange={(e) => handleInputChange(question.QuestionID as keyof CharacterFormData, parseInt(e.target.value) || 0)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="1"
            max="100"
          />
        )}

        {question.QuestionType === 'boolean' && (
          <div className="space-y-2">
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name={question.QuestionID}
                checked={formData[question.QuestionID as keyof CharacterFormData] === true}
                onChange={() => handleInputChange(question.QuestionID as keyof CharacterFormData, true)}
                className="w-4 h-4 text-blue-600"
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name={question.QuestionID}
                checked={formData[question.QuestionID as keyof CharacterFormData] === false}
                onChange={() => handleInputChange(question.QuestionID as keyof CharacterFormData, false)}
                className="w-4 h-4 text-blue-600"
              />
              <span>No</span>
            </label>
          </div>
        )}

        {question.QuestionType === 'select' && questionOptions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {questionOptions.map((option) => (
              <button
                key={option.OptionID}
                onClick={() => handleInputChange(question.QuestionID as keyof CharacterFormData, option.OptionID)}
                className={`p-4 text-left border-2 rounded-lg transition-all ${
                  formData[question.QuestionID as keyof CharacterFormData] === option.OptionID
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-800">{option.OptionText}</div>
                {option.Description && (
                  <div className="text-sm text-gray-600 mt-1">{option.Description}</div>
                )}
                {option.StatModifier && (
                  <div className="text-xs text-blue-600 mt-1">
                    {option.StatModifier}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <button
          onClick={handleNext}
          disabled={!formData[question.QuestionID as keyof CharacterFormData]}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentQuestion === questions.length - 1 ? 'Create Character' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default CharacterCreation;

