import React, { useState } from 'react';

function App() {
  const [step, setStep] = useState(0); // 0 = starter page, 1-9 = character creation, 10 = character card, 11+ = game events
  const [gameStage, setGameStage] = useState('character'); // 'character', 'game', 'ending'
  const [showInfo, setShowInfo] = useState(false); // Show info page
  const [character, setCharacter] = useState({
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
  const [playerStats, setPlayerStats] = useState({
    knowledge: 1,
    courage: 1,
    luck: 1
  });
  const [currentEvent, setCurrentEvent] = useState(null);
  const [eventHistory, setEventHistory] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [usedEventIds, setUsedEventIds] = useState(new Set());
  const [studentCourseType, setStudentCourseType] = useState('');
  const [endings, setEndings] = useState([]);
  const [selectedEnding, setSelectedEnding] = useState(null);
  const [currentRoute, setCurrentRoute] = useState('');
  const [eventCount, setEventCount] = useState(0);
  const [routePath, setRoutePath] = useState([]);
  const [globalUsedEvents, setGlobalUsedEvents] = useState(new Set());

  const handleInputChange = (field: string, value: any) => {
    setCharacter(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    // Skip work-related questions if no work experience
    if (step === 5 && character.workExperience === 0) {
      setStep(step + 3); // Skip steps 6 and 7
    } else {
      setStep(step + 1);
    }
  };

  const initializeGame = async () => {
    // Calculate initial stats based on character choices
    let knowledge = 1;
    let courage = 1;
    let luck = 1;

    // Apply stat bonuses from character creation
    if (character.title === 'bachelor') knowledge += 2;
    if (character.title === 'master') knowledge += 3;
    if (character.title === 'phd') knowledge += 4;
    
    if (character.species === 'business') courage += 1;
    if (character.species === 'arts') luck += 1;
    if (character.species === 'science') knowledge += 1;
    
    if (character.englishLevel === 'basic') courage += 1;
    if (character.englishLevel === 'strong') knowledge += 1;
    if (character.englishLevel === 'excellent') knowledge += 1;

    setPlayerStats({ knowledge, courage, luck });
    
    // Set up route
    const route = character.status === 'student' ? 'STU' : 
                  character.status === 'whv' ? 'WHV' :
                  character.status === 'graduate' ? 'GRA' : 'OVS';
    
    setCurrentRoute(route);
    setRoutePath([route]);
    setEventCount(0);
    
    // Generate first event
    await generateEvent();
  };

  const loadEventsFromCSV = async () => {
    try {
      // Load common events
      const commonResponse = await fetch('/data/02_Events_Common.csv');
      const commonText = await commonResponse.text();
      const commonEvents = parseCSV(commonText);
      
      // Load route-specific events based on selected route
      let routeEvents = [];
      if (selectedRoute === 'student') {
        const routeResponse = await fetch('/data/03_Events_STD.csv');
        const routeText = await routeResponse.text();
        routeEvents = parseCSV(routeText);
      } else if (selectedRoute === 'whv') {
        const routeResponse = await fetch('/data/04_Events_WHV.csv');
        const routeText = await routeResponse.text();
        routeEvents = parseCSV(routeText);
      } else if (selectedRoute === 'graduate') {
        const routeResponse = await fetch('/data/05_Events_PSW.csv');
        const routeText = await routeResponse.text();
        routeEvents = parseCSV(routeText);
      } else if (selectedRoute === 'outside') {
        const routeResponse = await fetch('/data/06_Events_OVS.csv');
        const routeText = await routeResponse.text();
        routeEvents = parseCSV(routeText);
      }
      
      // Load fun events
      const funResponse = await fetch('/data/09_Events_Fun.csv');
      const funText = await funResponse.text();
      const funEvents = parseCSV(funText);
      
      return { commonEvents, routeEvents, funEvents };
    } catch (error) {
      console.error('Error loading events:', error);
      return { commonEvents: [], routeEvents: [], funEvents: [] };
    }
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const events = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length >= 9) {
        events.push({
          id: values[0],
          title: values[1],
          description: values[2],
          options: [
            { text: values[3], effect: values[4] },
            { text: values[5], effect: values[6] },
            { text: values[7], effect: values[8] }
          ],
          courseType: values[9] || 'All',
          tags: values[10] ? values[10].split(',') : [],
          category: values[11] || 'Route',
          priority: parseInt(values[12]) || 1
        });
      }
    }
    
    return events;
  };

  const parseCSVLine = (line: string) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    
    // Remove quotes from the beginning and end of each field
    return result.map(field => {
      if (field.startsWith('"') && field.endsWith('"')) {
        return field.slice(1, -1);
      }
      return field;
    });
  };

  const loadEndingsFromCSV = async () => {
    try {
      const response = await fetch('/data/07_Endings.csv');
      const text = await response.text();
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) return [];
      
      const endings = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length >= 8) {
          endings.push({
            id: values[0],
            title: values[1],
            description: values[2],
            statCondition: values[3],
            statType: values[4],
            route: values[5],
            priority: parseInt(values[6]) || 1,
            cta: values[7]
          });
        }
      }
      
      return endings;
    } catch (error) {
      console.error('Error loading endings:', error);
      return [];
    }
  };

  const selectEnding = async (stats, route) => {
    const endings = await loadEndingsFromCSV();
    if (endings.length === 0) return null;

    // Filter endings by route (All or specific route)
    const routeEndings = endings.filter(ending => 
      ending.route === 'All' || ending.route === route
    );

    // Sort by priority (lower number = higher priority)
    routeEndings.sort((a, b) => a.priority - b.priority);

    // Find the first ending that matches the stat condition
    for (const ending of routeEndings) {
      if (evaluateStatCondition(ending.statCondition, stats)) {
        return ending;
      }
    }

    // Fallback to first ending if none match
    return routeEndings[0] || endings[0];
  };

  const evaluateStatCondition = (condition, stats) => {
    const { knowledge, courage, luck } = stats;
    
    // Handle different condition formats
    if (condition.includes('Knowledge >= Courage AND Knowledge >= Luck')) {
      return knowledge >= courage && knowledge >= luck;
    }
    if (condition.includes('Courage >= Knowledge AND Courage >= Luck')) {
      return courage >= knowledge && courage >= luck;
    }
    if (condition.includes('Luck >= Knowledge AND Luck >= Courage')) {
      return luck >= knowledge && luck >= courage;
    }
    if (condition.includes('Balanced')) {
      const max = Math.max(knowledge, courage, luck);
      const min = Math.min(knowledge, courage, luck);
      return max - min <= 1;
    }
    if (condition.includes('Knowledge > Courage + 1 AND Knowledge > Luck + 1')) {
      return knowledge > courage + 1 && knowledge > luck + 1;
    }
    if (condition.includes('Courage > Knowledge + 1 AND Courage > Luck + 1')) {
      return courage > knowledge + 1 && courage > luck + 1;
    }
    if (condition.includes('Luck > Knowledge + 1 AND Luck > Courage + 1')) {
      return luck > knowledge + 1 && luck > courage + 1;
    }
    if (condition.includes('Knowledge >= 4')) {
      return knowledge >= 4;
    }
    if (condition.includes('Courage >= 4')) {
      return courage >= 4;
    }
    if (condition.includes('Luck >= 4')) {
      return luck >= 4;
    }
    
    return false;
  };

  const generateEvent = async () => {
    const { commonEvents, routeEvents, funEvents } = await loadEventsFromCSV();
    
    let selectedEvents = [];
    
    // Route structure: 2 common + 1 fun + 3 route-specific + 1 route ending
    if (eventCount < 2) {
      // First 2 events: Common events (use global tracking to avoid duplicates across routes)
      selectedEvents = commonEvents.filter(event => !globalUsedEvents.has(event.id));
    } else if (eventCount === 2) {
      // 3rd event: Fun event (use global tracking)
      selectedEvents = funEvents.filter(event => !globalUsedEvents.has(event.id));
    } else if (eventCount < 6) {
      // Events 4-6: Route-specific events (use local tracking)
      selectedEvents = routeEvents.filter(event => !usedEventIds.has(event.id));
    } else {
      // Event 7: Route ending (transition or final)
      selectedEvents = routeEvents.filter(event => event.category === 'Local');
    }
    
    if (selectedEvents.length === 0) {
      console.error('No events available for this stage');
      return;
    }

    // Select random event
    const randomEvent = selectedEvents[Math.floor(Math.random() * selectedEvents.length)];
    setCurrentEvent(randomEvent);
    
    // Track usage based on event type
    if (eventCount < 3) {
      // Common and fun events: track globally
      setGlobalUsedEvents(prev => new Set([...prev, randomEvent.id]));
    } else {
      // Route-specific events: track locally
      setUsedEventIds(prev => new Set([...prev, randomEvent.id]));
    }
  };

  const handleEventChoice = async (choiceIndex: number) => {
    if (!currentEvent) return;

    const choice = currentEvent.options[choiceIndex];
    const effect = choice.effect;

    // Apply stat effect
    if (effect === 'K+1') {
      setPlayerStats(prev => ({ ...prev, knowledge: Math.min(prev.knowledge + 1, 6) }));
    } else if (effect === 'C+1') {
      setPlayerStats(prev => ({ ...prev, courage: Math.min(prev.courage + 1, 6) }));
    } else if (effect === 'L+1') {
      setPlayerStats(prev => ({ ...prev, luck: Math.min(prev.luck + 1, 6) }));
    }

    // Add to event history
    setEventHistory(prev => [...prev, { event: currentEvent, choice: choiceIndex }]);
    
    // Increment event count
    const newEventCount = eventCount + 1;
    setEventCount(newEventCount);

    // Check if this is a local ending event
    if (currentEvent.category === 'Local') {
      // This is a local ending - show route transition options
      setGameStage('routeTransition');
      setStep(15);
    } else if (newEventCount >= 7) {
      // Route completed - check for transitions or end
      if (currentRoute === 'GRA') {
        // Graduate route is final
        const ending = await selectEnding(playerStats, currentRoute);
        setSelectedEnding(ending);
        setGameStage('ending');
        setStep(20);
      } else {
        // Show route transition options
        setGameStage('routeTransition');
        setStep(15);
      }
    } else {
      await generateEvent();
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            🎮 SOLution
          </h1>
                <p className="text-lg text-blue-200">
                  Australian Education/Migration Quest
                </p>
          <p className="text-sm text-blue-300 mt-1">
            Create Your Adventurer
          </p>
        </header>
        
        <main>
          {step === 0 && (
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  Welcome to SOLution
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Create your adventurer and begin your Australian education/migration quest!
                </p>
                <div className="space-y-4">
                  <button
                    onClick={() => setStep(1)}
                    className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xl font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                  >
                    🚀 Start Your Adventure
                  </button>
                  <button
                    onClick={() => setShowInfo(true)}
                    className="w-full px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-lg font-semibold rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg"
                  >
                    ℹ️ Game Info & Gallery
                  </button>
                </div>
              </div>
            </div>
          )}

          {showInfo && (
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Game Info & Gallery</h2>
                <button
                  onClick={() => setShowInfo(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
                >
                  ✕ Close
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Game Concept */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">🎮 Game Concept</h3>
                  <p className="text-gray-700 mb-3">
                    SOLution is an interactive RPG-style game that simulates the Australian education and migration journey. 
                    Players create unique characters and navigate through realistic scenarios based on their chosen pathway.
                    At the end of their journey, players receive personalized guidance and are connected with real migration agencies.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">🎭 Character Creation</h4>
                      <ul className="text-gray-600 space-y-1">
                        <li>• RPG-style species based on education</li>
                        <li>• Work experience and guild selection</li>
                        <li>• English proficiency levels</li>
                        <li>• Current visa status</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">🗺️ Journey Paths</h4>
                      <ul className="text-gray-600 space-y-1">
                        <li>• Student Visa Route</li>
                        <li>• Working Holiday Route</li>
                        <li>• Graduate Route</li>
                        <li>• Offshore Planning Route</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Current Features */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">✅ Current Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">🎯 Gameplay</h4>
                      <ul className="text-gray-600 space-y-1">
                        <li>• 9-step character creation</li>
                        <li>• 7-event journey per route</li>
                        <li>• K/C/L stat system</li>
                        <li>• 27 different endings</li>
                        <li>• Route progression logic</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">📱 Technical</h4>
                      <ul className="text-gray-600 space-y-1">
                        <li>• Mobile-optimized (9:16)</li>
                        <li>• CSV-driven content</li>
                        <li>• Real-time stat tracking</li>
                        <li>• Event deduplication</li>
                        <li>• Responsive design</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Agency Integration */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">🏢 Agency Integration</h3>
                  <p className="text-gray-700 mb-4">
                    SOLution connects players with real migration agencies to turn their virtual journey into real-world opportunities.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">🎯 Player Guidance</h4>
                      <ul className="text-gray-600 space-y-1">
                        <li>• Personalized ending recommendations</li>
                        <li>• Direct agency contact information</li>
                        <li>• Route-specific guidance</li>
                        <li>• Real-world pathway mapping</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">📊 Data Export</h4>
                      <ul className="text-gray-600 space-y-1">
                        <li>• Complete player profile</li>
                        <li>• Journey choices & stats</li>
                        <li>• Route progression history</li>
                        <li>• Agency-ready insights</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                    <p className="text-blue-800 text-sm font-medium">
                      💡 <strong>How it works:</strong> After completing your journey, you'll receive a personalized report 
                      with agency recommendations based on your choices, stats, and preferred pathway.
                    </p>
                  </div>
                </div>

                {/* Future Art Gallery */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">🎨 Art Gallery</h3>
                  <p className="text-gray-700 mb-4">
                    Beautiful pixel art that brings the Australian migration journey to life!
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Starter Page Art */}
                    <div className="bg-white rounded-lg p-4 shadow-md">
                      <div className="w-full h-32 bg-gradient-to-br from-orange-400 via-yellow-300 to-blue-500 rounded-lg mb-3 flex items-center justify-center text-white text-sm font-bold relative overflow-hidden">
                        <img 
                          src="/assets/ui/starter_page.png" 
                          alt="Starter Page Art"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold" style={{display: 'none'}}>
                          🎮 STARTER
                        </div>
                      </div>
                      <h4 className="font-semibold text-gray-800 text-sm mb-1">Starter Page</h4>
                      <p className="text-gray-600 text-xs">Boy dreaming of Australia</p>
                    </div>
                    
                    {/* Student Route */}
                    <div className="bg-white rounded-lg p-4 shadow-md">
                      <div className="w-full h-32 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg mb-3 flex items-center justify-center text-white text-sm font-bold relative overflow-hidden">
                        <img 
                          src="/assets/backgrounds/student_route.png" 
                          alt="Student Route"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold" style={{display: 'none'}}>
                          🎓 STUDENT
                        </div>
                      </div>
                      <h4 className="font-semibold text-gray-800 text-sm mb-1">Student Route</h4>
                      <p className="text-gray-600 text-xs">Educational hub & graduation</p>
                    </div>
                    
                    {/* Working Holiday Route */}
                    <div className="bg-white rounded-lg p-4 shadow-md">
                      <div className="w-full h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg mb-3 flex items-center justify-center text-white text-sm font-bold relative overflow-hidden">
                        <img 
                          src="/assets/backgrounds/working_holiday_route.png" 
                          alt="Working Holiday Route"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold" style={{display: 'none'}}>
                          🎒 WHV
                        </div>
                      </div>
                      <h4 className="font-semibold text-gray-800 text-sm mb-1">Working Holiday</h4>
                      <p className="text-gray-600 text-xs">Backpackers hostel & cafe</p>
                    </div>
                    
                    {/* Graduate Route */}
                    <div className="bg-white rounded-lg p-4 shadow-md">
                      <div className="w-full h-32 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg mb-3 flex items-center justify-center text-white text-sm font-bold relative overflow-hidden">
                        <img 
                          src="/assets/backgrounds/graduate_route.png" 
                          alt="Graduate Route"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold" style={{display: 'none'}}>
                          🎓 GRADUATE
                        </div>
                      </div>
                      <h4 className="font-semibold text-gray-800 text-sm mb-1">Graduate Route</h4>
                      <p className="text-gray-600 text-xs">Crossroads & city skyline</p>
                    </div>
                    
                    {/* Offshore Route */}
                    <div className="bg-white rounded-lg p-4 shadow-md">
                      <div className="w-full h-32 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg mb-3 flex items-center justify-center text-white text-sm font-bold relative overflow-hidden">
                        <img 
                          src="/assets/backgrounds/offshore_route.png" 
                          alt="Offshore Route"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold" style={{display: 'none'}}>
                          ✈️ OFFSHORE
                        </div>
                      </div>
                      <h4 className="font-semibold text-gray-800 text-sm mb-1">Offshore Route</h4>
                      <p className="text-gray-600 text-xs">Journey from plane to offer</p>
                    </div>
                    
                    {/* Character Creation Art */}
                    <div className="bg-white rounded-lg p-4 shadow-md">
                      <div className="w-full h-32 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg mb-3 flex items-center justify-center text-white text-sm font-bold relative overflow-hidden">
                        <img 
                          src="/assets/characters/elf_admin_sales_unrelated.png" 
                          alt="Character Creation Art"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold" style={{display: 'none'}}>
                          🌿 ELF
                        </div>
                      </div>
                      <h4 className="font-semibold text-gray-800 text-sm mb-1">Character Creation</h4>
                      <p className="text-gray-600 text-xs">Elf + Admin/Sales example</p>
                    </div>
                    
                    {/* Ending Art Placeholder */}
                    <div className="bg-gray-200 rounded-lg p-4 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg mx-auto mb-2 flex items-center justify-center text-white text-2xl">
                        🏆
                      </div>
                      <h4 className="font-semibold text-gray-800 text-sm">Ending Art</h4>
                      <p className="text-gray-600 text-xs">15 unique endings</p>
                    </div>
                    
                    {/* NPC Art - Male 01 */}
                    <div className="bg-white rounded-lg p-4 shadow-md">
                      <div className="w-full h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg mb-3 flex items-center justify-center text-white text-sm font-bold relative overflow-hidden">
                        <img 
                          src="/assets/npcs/npc_male_01.png" 
                          alt="NPC Male 01"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold" style={{display: 'none'}}>
                          👨‍💼 MALE 01
                        </div>
                      </div>
                      <h4 className="font-semibold text-gray-800 text-sm mb-1">NPC Male 01</h4>
                      <p className="text-gray-600 text-xs">Sample NPC character</p>
                    </div>
                    
                    {/* NPC Art - Male 02 */}
                    <div className="bg-white rounded-lg p-4 shadow-md">
                      <div className="w-full h-32 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg mb-3 flex items-center justify-center text-white text-sm font-bold relative overflow-hidden">
                        <img 
                          src="/assets/npcs/npc_male_02.png" 
                          alt="NPC Male 02"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold" style={{display: 'none'}}>
                          👨‍💼 MALE 02
                        </div>
                      </div>
                      <h4 className="font-semibold text-gray-800 text-sm mb-1">NPC Male 02</h4>
                      <p className="text-gray-600 text-xs">Sample NPC character</p>
                    </div>
                    
                    {/* Coming Soon */}
                    <div className="bg-gray-200 rounded-lg p-4 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg mx-auto mb-2 flex items-center justify-center text-white text-2xl">
                        ⭐
                      </div>
                      <h4 className="font-semibold text-gray-800 text-sm">More Coming</h4>
                      <p className="text-gray-600 text-xs">Surprises ahead!</p>
                    </div>
                  </div>
                  
                  {/* Art Details */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">🎨 Current Art Collection</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                      <div>
                        <strong>Starter Page:</strong> Retro pixel art with boy dreaming of Australia
                      </div>
                      <div>
                        <strong>Student Route:</strong> Multi-tiered educational hub with graduation ceremony
                      </div>
                      <div>
                        <strong>Working Holiday:</strong> Backpackers hostel with cafe and Australian elements
                      </div>
                      <div>
                        <strong>Graduate Route:</strong> Graduate at crossroads with city skyline
                      </div>
                      <div>
                        <strong>Offshore Route:</strong> Three-panel journey from airplane to offer letter
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Overview */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">📊 Game Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">27</div>
                      <div className="text-sm text-gray-600">Total Endings</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">4</div>
                      <div className="text-sm text-gray-600">Route Types</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">81</div>
                      <div className="text-sm text-gray-600">Character Combos</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">100+</div>
                      <div className="text-sm text-gray-600">Events Total</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-cyan-600">8</div>
                      <div className="text-sm text-gray-600">Art Samples</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step > 0 && (
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  Create Your Adventurer
                </h2>
              </div>

            {step === 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What is your name?
                </label>
                <input
                  type="text"
                  value={character.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your name"
                />
              </div>
            )}

             {step === 2 && (
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   What is your level (age)?
                 </label>
                 <input
                   type="number"
                   value={character.level}
                   onChange={(e) => handleInputChange('level', parseInt(e.target.value) || 18)}
                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   min="1"
                   max="100"
                 />
               </div>
             )}

             {step === 3 && (
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   What is your title (highest education level)?
                 </label>
                 <div className="grid grid-cols-1 gap-3">
                   {[
                     { id: 'high_school', text: 'High School — Apprentice' },
                     { id: 'diploma', text: 'Vocational (VET) — Craftsman' },
                     { id: 'bachelor', text: "Bachelor's — Scholar" },
                     { id: 'master', text: "Master's — Sage" },
                     { id: 'phd', text: 'PhD — Sage' }
                   ].map((option) => (
                     <button
                       key={option.id}
                       onClick={() => handleInputChange('title', option.id)}
                       className={`p-4 text-left border-2 rounded-lg transition-all ${
                         character.title === option.id
                           ? 'border-blue-500 bg-blue-50'
                           : 'border-gray-200 hover:border-gray-300'
                       }`}
                     >
                       <div className="font-medium text-gray-800">{option.text}</div>
                     </button>
                   ))}
                 </div>
               </div>
             )}

             {step === 4 && (
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   What is your species (educational background)?
                 </label>
                 <div className="grid grid-cols-1 gap-3">
                   {[
                     { id: 'business', text: 'Griffin (Business / Law)' },
                     { id: 'engineering', text: 'Dwarf (Engineering / Mechanics)' },
                     { id: 'it', text: 'Mech (IT / Computer Science)' },
                     { id: 'arts', text: 'Elf (Creative Arts / Design)' },
                     { id: 'music', text: 'Siren (Music / Performance)' },
                     { id: 'health', text: 'Druid (Healthcare / Nursing)' },
                     { id: 'education', text: 'Owlkin (Education / Social Science)' },
                     { id: 'science', text: 'Golem (Science / Research)' },
                     { id: 'other', text: 'Mystic (Other)' }
                   ].map((option) => (
                     <button
                       key={option.id}
                       onClick={() => handleInputChange('species', option.id)}
                       className={`p-4 text-left border-2 rounded-lg transition-all ${
                         character.species === option.id
                           ? 'border-blue-500 bg-blue-50'
                           : 'border-gray-200 hover:border-gray-300'
                       }`}
                     >
                       <div className="font-medium text-gray-800">{option.text}</div>
                     </button>
                   ))}
                 </div>
               </div>
             )}

             {step === 5 && (
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   How many years of work experience do you have?
                 </label>
                 <input
                   type="number"
                   value={character.workExperience}
                   onChange={(e) => handleInputChange('workExperience', parseInt(e.target.value) || 0)}
                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   min="0"
                   max="50"
                 />
               </div>
             )}

             {step === 6 && character.workExperience > 0 && (
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Is your work experience related to your educational background?
                 </label>
                 <div className="space-y-2">
                   <label className="flex items-center space-x-3">
                     <input
                       type="radio"
                       name="workRelated"
                       checked={character.workRelated === true}
                       onChange={() => handleInputChange('workRelated', true)}
                       className="w-4 h-4 text-blue-600"
                     />
                     <span>Yes</span>
                   </label>
                   <label className="flex items-center space-x-3">
                     <input
                       type="radio"
                       name="workRelated"
                       checked={character.workRelated === false}
                       onChange={() => handleInputChange('workRelated', false)}
                       className="w-4 h-4 text-blue-600"
                     />
                     <span>No</span>
                   </label>
                 </div>
               </div>
             )}

             {step === 7 && character.workExperience > 0 && !character.workRelated && (
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   What guild (field) is your work experience in?
                 </label>
                 <div className="space-y-3">
                   {[
                     { id: 'admin_sales', text: 'Admin/Sales Guild' },
                     { id: 'healthcare', text: 'Healthcare Guild' },
                     { id: 'engineering', text: 'Engineering Guild' },
                     { id: 'retail', text: 'Retail Guild' },
                     { id: 'hospitality', text: 'Hospitality Guild' },
                     { id: 'teaching', text: 'Teaching Guild' },
                     { id: 'government', text: 'Government Guild' },
                     { id: 'other', text: 'Other Guild' }
                   ].map((option) => (
                     <button
                       key={option.id}
                       onClick={() => handleInputChange('guild', option.id)}
                       className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                         character.guild === option.id
                           ? 'border-blue-500 bg-blue-50'
                           : 'border-gray-200 hover:border-gray-300'
                       }`}
                     >
                       <div className="font-medium text-gray-800">{option.text}</div>
                     </button>
                   ))}
                 </div>
               </div>
             )}

             {step === 8 && (
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   What is your current status?
                 </label>
                 <div className="grid grid-cols-1 gap-3">
                   {[
                     { id: 'outside', text: 'Outside Australia (Offshore Route)' },
                     { id: 'student', text: 'Student in Australia (Student Route)' },
                     { id: 'whv', text: 'Working Holiday in Australia (WHV Route)' },
                     { id: 'graduate', text: 'Graduate visa in Australia (Graduate Route)' }
                   ].map((option) => (
                     <button
                       key={option.id}
                       onClick={() => handleInputChange('status', option.id)}
                       className={`p-4 text-left border-2 rounded-lg transition-all ${
                         character.status === option.id
                           ? 'border-blue-500 bg-blue-50'
                           : 'border-gray-200 hover:border-gray-300'
                       }`}
                     >
                       <div className="font-medium text-gray-800">{option.text}</div>
                     </button>
                   ))}
                 </div>
               </div>
             )}

             {step === 9 && (
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Do you have an inventory scroll (English test result)?
                 </label>
                 <div className="grid grid-cols-1 gap-3">
                   {[
                     { id: 'none', text: 'None yet — Empty Scroll' },
                     { id: 'basic', text: 'Basic (IELTS5 / PTE35) — Faded Scroll' },
                     { id: 'strong', text: 'Strong (IELTS6 / PTE50) — Refined Scroll' },
                     { id: 'excellent', text: 'Excellent (IELTS7 / PTE65+) — Arcane Scroll' }
                   ].map((option) => (
                     <button
                       key={option.id}
                       onClick={() => handleInputChange('englishLevel', option.id)}
                       className={`p-4 text-left border-2 rounded-lg transition-all ${
                         character.englishLevel === option.id
                           ? 'border-blue-500 bg-blue-50'
                           : 'border-gray-200 hover:border-gray-300'
                       }`}
                     >
                       <div className="font-medium text-gray-800">{option.text}</div>
                     </button>
                   ))}
                 </div>
               </div>
             )}


            {step === 10 && (
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">🎉 Character Created! 🎉</h3>
                
                {/* Character Art Placeholder */}
                <div className="mb-6">
                  <div className="bg-gray-100 rounded-lg p-8 border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <div className="text-6xl mb-4">
                        {character.species === 'business' ? '🦅' :
                         character.species === 'engineering' ? '⛏️' :
                         character.species === 'it' ? '⚙️' :
                         character.species === 'arts' ? '🌿' :
                         character.species === 'music' ? '🎶' :
                         character.species === 'health' ? '🌳' :
                         character.species === 'education' ? '🦉' :
                         character.species === 'science' ? '🪨' : '🌟'}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">
                        Character Art Placeholder
                      </p>
                      <p className="text-gray-500 text-xs">
                        Art file: {character.species}_{character.guild || 'no_guild'}_{character.workRelated ? 'related' : 'unrelated'}.png
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6 border border-blue-200">
                  <h4 className="text-lg font-semibold text-gray-700 mb-4">Your Adventurer Profile</h4>
                  <div className="space-y-3 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Adventurer Name:</span>
                      <span className="font-bold text-lg text-gray-800">{character.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Age:</span>
                      <span className="font-medium">{character.level} years old</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Rank:</span>
                      <span className="font-medium">
                        {character.level <= 20 ? '🥉 Bronze Adventurer' :
                         character.level <= 25 ? '🥈 Silver Explorer' :
                         character.level <= 30 ? '🥇 Gold Pathfinder' :
                         character.level <= 35 ? '💎 Platinum Challenger' : '💠 Diamond Voyager'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Title:</span>
                      <span className="font-medium">
                        {character.title === 'high_school' ? '📚 Apprentice' :
                         character.title === 'diploma' ? '🔨 Craftsman/Artisan' :
                         character.title === 'bachelor' ? '📖 Scholar' :
                         character.title === 'master' ? '🧙 Sage' : '🧙‍♂️ Sage'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Species:</span>
                      <span className="font-medium">
                        {character.species === 'business' ? '🦅 Griffin' :
                         character.species === 'engineering' ? '⛏️ Dwarf' :
                         character.species === 'it' ? '⚙️ Mech' :
                         character.species === 'arts' ? '🌿 Elf' :
                         character.species === 'music' ? '🎶 Siren' :
                         character.species === 'health' ? '🌳 Druid' :
                         character.species === 'education' ? '🦉 Owlkin' :
                         character.species === 'science' ? '🪨 Golem' : '🌟 Mystic'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Experience:</span>
                      <span className="font-medium">{character.workExperience} years</span>
                    </div>
                    {character.guild && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Guild:</span>
                        <span className="font-medium">
                          {character.guild === 'admin_sales' ? '💼 Admin/Sales Guild' :
                           character.guild === 'healthcare' ? '🏥 Healthcare Guild' :
                           character.guild === 'engineering' ? '🔨 Engineering Guild' :
                           character.guild === 'retail' ? '🛍️ Retail Guild' :
                           character.guild === 'hospitality' ? '🍽️ Hospitality Guild' :
                           character.guild === 'teaching' ? '📚 Teaching Guild' :
                           character.guild === 'government' ? '🏛️ Government Guild' : '🌟 Other Guild'}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Quest Status:</span>
                      <span className="font-medium">
                        {character.status === 'outside' ? '✈️ Outside Australia' :
                         character.status === 'student' ? '🎓 Student in Australia' :
                         character.status === 'whv' ? '🎒 Working Holiday in Australia' : '💼 Graduate visa in Australia'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Language Scroll:</span>
                      <span className="font-medium">
                        {character.englishLevel === 'none' ? '📜 Empty Scroll' :
                         character.englishLevel === 'basic' ? '📜 Faded Scroll' :
                         character.englishLevel === 'strong' ? '📜 Refined Scroll' : '📜 Arcane Scroll of Fluency'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                    <h5 className="text-md font-semibold text-gray-700 mb-3">Adventurer Description</h5>
                    <div className="text-sm text-gray-600 space-y-2">
                      <p>
                        <strong>{character.name}</strong> is a {character.level <= 20 ? 'young dreamer just beginning their quest' :
                         character.level <= 25 ? 'eager traveler discovering new worlds' :
                         character.level <= 30 ? 'determined adventurer balancing skill and will' :
                         character.level <= 35 ? 'seasoned wanderer taking bold new turns' : 'veteran adventurer seeking a second horizon'}.
                      </p>
                      <p>
                        As a {character.title === 'high_school' ? 'Apprentice learning the basics of the craft' :
                         character.title === 'diploma' ? 'Craftsman/Artisan skilled in forging tools for the journey' :
                         character.title === 'bachelor' ? 'Scholar exploring ideas and knowledge' :
                         character.title === 'master' ? 'Sage seeking wisdom and mastery' : 'Sage seeking wisdom and mastery'}, 
                        they embody the spirit of a {character.species === 'business' ? 'Griffin with leadership & strategy - noble, balanced between power and reason' :
                         character.species === 'engineering' ? 'Dwarf with craftsmanship & endurance - practical builders with precise minds' :
                         character.species === 'it' ? 'Mech with logic & invention - mechanized thinkers fluent in code and creation' :
                         character.species === 'arts' ? 'Elf with creativity & perception - expressive and attuned to beauty' :
                         character.species === 'music' ? 'Siren with charisma & empathy - persuasive and emotional communicators' :
                         character.species === 'health' ? 'Druid with healing & compassion - protectors and caretakers' :
                         character.species === 'education' ? 'Owlkin with wisdom & guidance - mentors and knowledge keepers' :
                         character.species === 'science' ? 'Golem with rationality & stability - grounded, methodical explorers of truth' : 'Mystic with adaptability & mystery - unique pathfinder with hidden potential'}.
                      </p>
                      <p>
                        With {character.workExperience === 0 ? 'fresh adventurer spirit, ready to learn' :
                         character.workExperience === 1 ? 'one season of experience gained' :
                         character.workExperience === 2 ? 'two seasons of growing skill' :
                         character.workExperience === 3 ? 'three seasons of proven experience' :
                         character.workExperience === 5 ? 'five seasons of mastery' : 'ten seasons of legendary skill'}{character.guild ? ` in the ${character.guild === 'admin_sales' ? 'Admin/Sales Guild - masters of organization and influence' :
                         character.guild === 'healthcare' ? 'Healthcare Guild - guardians of life and wellness' :
                         character.guild === 'engineering' ? 'Engineering Guild - crafters of stone and steel' :
                         character.guild === 'retail' ? 'Retail Guild - connectors of goods and people' :
                         character.guild === 'hospitality' ? 'Hospitality Guild - creators of comfort and joy' :
                         character.guild === 'teaching' ? 'Teaching Guild - sharers of wisdom and knowledge' :
                         character.guild === 'government' ? 'Government Guild - stewards of order and justice' : 'Other Guild - unique pathfinders with diverse skills'}` : ''}, 
                        they are {character.status === 'outside' ? 'planning their journey from afar' :
                         character.status === 'student' ? 'currently studying in the realm' :
                         character.status === 'whv' ? 'exploring while working in the realm' : 'completed studies, seeking new paths'}.
                      </p>
                      <p>
                        Their language mastery is represented by a {character.englishLevel === 'none' ? 'Empty Scroll - potential waiting to be written' :
                         character.englishLevel === 'basic' ? 'Faded Scroll - the first words of understanding appear' :
                         character.englishLevel === 'strong' ? 'Refined Scroll - clear and confident communication flows' : 'Arcane Scroll of Fluency - language becomes their power'}.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <button
                    onClick={async () => {
                      setGameStage('game');
                      setStep(11);
                      setSelectedRoute(character.status);
                      await initializeGame();
                    }}
                    className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white text-xl font-bold rounded-lg hover:from-green-700 hover:to-blue-700 transition-all shadow-lg"
                  >
                    🚀 Start Your Journey
                  </button>
                  
                  <button
                    onClick={() => {
                      setStep(0);
                      setCharacter({
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
                    }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all font-medium shadow-lg"
                  >
                    🎮 Create Another Adventurer
                  </button>
                </div>
              </div>
            )}

            {/* Course Type Question for Student Route */}
            {gameStage === 'game' && character.status === 'student' && !studentCourseType && step === 11 && (
              <div className="bg-white rounded-2xl shadow-2xl p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Choose Your Study Path</h2>
                <p className="text-gray-600 mb-6">What type of course are you taking?</p>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: 'elicos', text: 'ELICOS — English Language Course' },
                    { id: 'vet', text: 'VET — Vocational Education & Training' },
                    { id: 'he', text: 'Higher Education — University Degree' }
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={async () => {
                        setStudentCourseType(option.id);
                        setStep(12);
                        await generateEvent();
                      }}
                      className="p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                    >
                      <div className="font-medium text-gray-800">{option.text}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Route Transition Section */}
            {gameStage === 'routeTransition' && (
              <div className="bg-white rounded-2xl shadow-2xl p-6 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Chapter Complete!</h2>
                
                {/* Local Ending Summary */}
                {currentEvent && currentEvent.category === 'Local' && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">{currentEvent.title}</h3>
                    <p className="text-gray-600 text-sm">{currentEvent.description}</p>
                  </div>
                )}
                
                 <p className="text-gray-600 mb-6">
                   You've completed your {currentRoute === 'OVS' ? 'planning' : 
                   currentRoute === 'STU' ? (studentCourseType === 'elicos' ? 'ELICOS English' : 
                   studentCourseType === 'vet' ? 'VET Vocational' : 
                   studentCourseType === 'he' ? 'Higher Education' : 'student') :
                   currentRoute === 'WHV' ? 'working holiday' : 'graduate'} journey.
                 </p>
                
                <div className="space-y-4">
                  {currentRoute === 'OVS' && (
                    <>
                      <button
                        onClick={async () => {
                          setCurrentRoute('STU');
                          setRoutePath(prev => [...prev, 'STU']);
                          setEventCount(0);
                          setUsedEventIds(new Set());
                          setGameStage('game');
                          await generateEvent();
                        }}
                        className="w-full p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                      >
                        🎓 Continue as Student
                      </button>
                      <button
                        onClick={async () => {
                          setCurrentRoute('WHV');
                          setRoutePath(prev => [...prev, 'WHV']);
                          setEventCount(0);
                          setUsedEventIds(new Set());
                          setGameStage('game');
                          await generateEvent();
                        }}
                        className="w-full p-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all"
                      >
                        🌏 Continue as Working Holiday
                      </button>
                    </>
                  )}
                  
                  {currentRoute === 'STU' && studentCourseType !== 'elicos' && (
                    <button
                      onClick={async () => {
                        setCurrentRoute('GRA');
                        setRoutePath(prev => [...prev, 'GRA']);
                        setEventCount(0);
                        setUsedEventIds(new Set());
                        setGameStage('game');
                        await generateEvent();
                      }}
                      className="w-full p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                    >
                      🎓 Continue as Graduate
                    </button>
                  )}
                  
                  {currentRoute === 'STU' && studentCourseType === 'elicos' && (
                    <>
                      <div className="w-full p-4 bg-blue-50 text-blue-800 rounded-lg border-2 border-blue-200">
                        <div className="text-center">
                          <div className="text-2xl mb-2">🎓</div>
                          <p className="text-sm font-medium mb-2">
                            Ready to advance your studies?
                          </p>
                          <p className="text-xs text-blue-600">
                            ELICOS completed! Choose your next educational path.
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={async () => {
                          setStudentCourseType('vet');
                          setCurrentRoute('STU');
                          setRoutePath(prev => [...prev, 'STU-VET']);
                          setEventCount(0);
                          setUsedEventIds(new Set());
                          setGameStage('game');
                          await generateEvent();
                        }}
                        className="w-full p-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all"
                      >
                        🔧 Continue as VET Student
                      </button>
                      
                      <button
                        onClick={async () => {
                          setStudentCourseType('he');
                          setCurrentRoute('STU');
                          setRoutePath(prev => [...prev, 'STU-HE']);
                          setEventCount(0);
                          setUsedEventIds(new Set());
                          setGameStage('game');
                          await generateEvent();
                        }}
                        className="w-full p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                      >
                        🎓 Continue as Higher Education Student
                      </button>
                    </>
                  )}
                  
                  {currentRoute === 'WHV' && (
                    <button
                      onClick={async () => {
                        setCurrentRoute('STU');
                        setRoutePath(prev => [...prev, 'STU']);
                        setEventCount(0);
                        setUsedEventIds(new Set());
                        setGameStage('game');
                        await generateEvent();
                      }}
                      className="w-full p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                    >
                      🎓 Continue as Student
                    </button>
                  )}
                  
                  <button
                    onClick={async () => {
                      const ending = await selectEnding(playerStats, currentRoute);
                      setSelectedEnding(ending);
                      setGameStage('ending');
                      setStep(20);
                    }}
                    className="w-full p-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all"
                  >
                    🏁 End Journey Here
                  </button>
                </div>
              </div>
            )}

            {/* Game Events Section */}
            {gameStage === 'game' && currentEvent && step >= 11 && !(character.status === 'student' && !studentCourseType) && (
              <div className="bg-white rounded-2xl shadow-2xl p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">
                    Your Journey Continues...
                  </h2>
                  

                  {/* Current Event */}
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="text-3xl font-bold text-gray-800 mb-4">{currentEvent.title}</h3>
                    <p className="text-base text-gray-600 mb-6">{currentEvent.description}</p>
                    
                    <div className="space-y-3">
                      {currentEvent.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleEventChoice(index)}
                          className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                        >
                          <span className="text-xl font-medium text-gray-800">{option.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Event Progress */}
                  <div className="text-center text-sm text-gray-600">
                    Event {eventCount + 1} of 7
                  </div>
                </div>
              </div>
            )}

            {/* Ending Section */}
            {gameStage === 'ending' && (
              <div className="bg-white rounded-2xl shadow-2xl p-6 text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">🎉 Journey Complete! 🎉</h2>
                
                {/* Ending Art Placeholder */}
                <div className="mb-6">
                  <div className="bg-gray-100 rounded-lg p-8 border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <div className="text-6xl mb-4">
                        {selectedEnding && selectedEnding.statType === 'Strategic' ? '🧠' :
                         selectedEnding && selectedEnding.statType === 'Adventurous' ? '⚔️' :
                         selectedEnding && selectedEnding.statType === 'Serendipity' ? '🍀' :
                         selectedEnding && selectedEnding.statType === 'Harmonious' ? '⚖️' : '🎯'}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">
                        Ending Art Placeholder
                      </p>
                      <p className="text-gray-500 text-xs">
                        Art file: ending_{selectedEnding ? selectedEnding.statType.toLowerCase() : 'default'}.png
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6 border border-blue-200">
                  <h3 className="text-xl font-semibold text-gray-700 mb-4">Final Stats</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="text-3xl font-bold text-blue-600">{playerStats.knowledge}</div>
                      <div className="text-sm text-gray-600">Knowledge</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="text-3xl font-bold text-red-600">{playerStats.courage}</div>
                      <div className="text-sm text-gray-600">Courage</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="text-3xl font-bold text-yellow-600">{playerStats.luck}</div>
                      <div className="text-sm text-gray-600">Luck</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-700 mb-4">
                    {selectedEnding ? selectedEnding.title : "Your Ending"}
                  </h4>
                  <p className="text-gray-600 mb-4">
                    {selectedEnding ? selectedEnding.description : "Your journey has come to an end."}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedEnding ? selectedEnding.cta : "🗺️ Talk to an agent to see how to turn your story into a real plan."}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setStep(0);
                    setGameStage('character');
                    setCharacter({
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
                    setPlayerStats({ knowledge: 1, courage: 1, luck: 1 });
                    setCurrentEvent(null);
                    setEventHistory([]);
                    setSelectedRoute('');
                    setUsedEventIds(new Set());
                    setStudentCourseType('');
                    setSelectedEnding(null);
                    setCurrentRoute('');
                    setEventCount(0);
                    setRoutePath([]);
                    setGlobalUsedEvents(new Set());
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg"
                >
                  🎮 Start New Adventure
                </button>
              </div>
            )}

              {gameStage === 'character' && step < 10 && (
                <div className="flex justify-end mt-8">
                  <button
                    onClick={handleNext}
                    disabled={
                      (step === 1 && !character.name) ||
                      (step === 2 && !character.level) ||
                      (step === 3 && !character.title) ||
                      (step === 4 && !character.species) ||
                      (step === 5 && character.workExperience < 0) ||
                      (step === 6 && character.workExperience > 0 && character.workRelated === null) ||
                      (step === 7 && character.workExperience > 0 && !character.workRelated && !character.guild) ||
                      (step === 8 && !character.status) ||
                      (step === 9 && !character.englishLevel)
                    }
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                  >
                    {step === 9 ? '✨ Complete Character' : 'Continue ➡️'}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

