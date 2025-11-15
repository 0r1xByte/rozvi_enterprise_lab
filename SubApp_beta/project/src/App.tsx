import { useState, useEffect } from 'react';
import { Plus, X, ChevronRight, ChevronLeft, Play, Pause, ArrowRight, Shuffle, RefreshCw } from 'lucide-react';

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];
const PRIMARY_COLOR = '#2563eb';
const ACCENT_COLOR = '#10b981';
const ORANGE_ACCENT = '#f97316';
const GRAY_LIGHT = '#94a3b8';
const GRAY_BORDER = '#475569';
const TEXT_COLOR_DARK = '#f1f5f9';
const TEXT_COLOR_LIGHT = '#cbd5e1';

interface Player {
  id: string;
  name: string;
  roles: string[];
}

interface Substitution {
  position: string;
  playerOutId: string;
  playerInId: string;
}

interface IntervalPlan {
  interval: number;
  subs: Substitution[];
}

type SetupStep = 'players' | 'roles' | 'starting' | 'game plan';

function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [customRoles, setCustomRoles] = useState<string[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [setupStep, setSetupStep] = useState<SetupStep>('players');
  const [startingFive, setStartingFive] = useState<string[]>([]);
  const [setupComplete, setSetupComplete] = useState(false);
  const [activePositions, setActivePositions] = useState<Record<string, Player>>({});
  const [playTime, setPlayTime] = useState<Record<string, number>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [currentHalf, setCurrentHalf] = useState(1);
  const [halfLength, setHalfLength] = useState(18);
  const [substitutionInterval, setSubstitutionInterval] = useState(150);
  const [currentSubIntervalIndex, setCurrentSubIntervalIndex] = useState(0);
  const [timeUntilNextSub, setTimeUntilNextSub] = useState(substitutionInterval);
  const [showSubPanel, setShowSubPanel] = useState(false);
  const [manualSubOut, setManualSubOut] = useState('');
  const [manualSubIn, setManualSubIn] = useState('');
  const [editingHalf, setEditingHalf] = useState(1);
  const [showPositions, setShowPositions] = useState(true);
  const [gamePlan, setGamePlan] = useState<Record<number, IntervalPlan[]>>({});

  const setupSteps: SetupStep[] = ['players', 'roles', 'starting', 'game plan'];
  const currentStepIndex = setupSteps.indexOf(setupStep);
  const numberOfSubIntervals = Math.floor((halfLength * 60) / substitutionInterval);

  useEffect(() => {
    const newPlan: Record<number, IntervalPlan[]> = {};
    [1, 2].forEach(half => {
      newPlan[half] = Array.from({ length: numberOfSubIntervals }, (_, i) => ({
        interval: i + 1,
        subs: []
      }));
    });
    setGamePlan(newPlan);
  }, [numberOfSubIntervals]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setPlayTime(prev => {
          const updated = { ...prev };
          Object.values(activePositions).forEach(player => {
            updated[player.id] = (updated[player.id] || 0) + 1;
          });
          return updated;
        });

        setTimeUntilNextSub(prev => {
          if (prev <= 1) {
            handleAutomaticSubstitution();
            return substitutionInterval;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, activePositions, currentSubIntervalIndex, currentHalf]);

  const addPlayer = () => {
    if (newPlayerName.trim() && players.length < 15) {
      setPlayers([...players, { id: Date.now().toString(), name: newPlayerName.trim(), roles: [] }]);
      setNewPlayerName('');
    }
  };

  const removePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
    setStartingFive(startingFive.filter(pid => pid !== id));
  };

  const addRole = () => {
    if (newRoleName.trim() && !customRoles.includes(newRoleName.trim())) {
      setCustomRoles([...customRoles, newRoleName.trim()]);
      setNewRoleName('');
    }
  };

  const removeRole = (role: string) => {
    setCustomRoles(customRoles.filter(r => r !== role));
    setPlayers(players.map(p => ({ ...p, roles: p.roles.filter(r => r !== role) })));
  };

  const togglePlayerRole = (playerId: string, role: string) => {
    setPlayers(players.map(p => {
      if (p.id === playerId) {
        const hasRole = p.roles.includes(role);
        return { ...p, roles: hasRole ? p.roles.filter(r => r !== role) : [...p.roles, role] };
      }
      return p;
    }));
  };

  const toggleStartingFive = (playerId: string) => {
    if (startingFive.includes(playerId)) {
      setStartingFive(startingFive.filter(id => id !== playerId));
    } else if (startingFive.length < POSITIONS.length) {
      setStartingFive([...startingFive, playerId]);
    }
  };

  const handlePlayerOutChange = (half: number, interval: number, position: string, playerOutId: string) => {
    setGamePlan(prev => {
      const updated = { ...prev };
      const intervalObj = updated[half].find(i => i.interval === interval);
      if (intervalObj) {
        const existingSub = intervalObj.subs.find(s => s.position === position);
        if (existingSub) {
          existingSub.playerOutId = playerOutId;
        } else {
          intervalObj.subs.push({ position, playerOutId, playerInId: '' });
        }
      }
      return updated;
    });
  };

  const handlePlayerInChange = (half: number, interval: number, position: string, playerInId: string) => {
    setGamePlan(prev => {
      const updated = { ...prev };
      const intervalObj = updated[half].find(i => i.interval === interval);
      if (intervalObj) {
        const existingSub = intervalObj.subs.find(s => s.position === position);
        if (existingSub) {
          existingSub.playerInId = playerInId;
        } else {
          intervalObj.subs.push({ position, playerOutId: '', playerInId });
        }
      }
      return updated;
    });
  };

  const removeSubFromPlan = (half: number, interval: number, position: string) => {
    setGamePlan(prev => {
      const updated = { ...prev };
      const intervalObj = updated[half].find(i => i.interval === interval);
      if (intervalObj) {
        intervalObj.subs = intervalObj.subs.filter(s => s.position !== position);
      }
      return updated;
    });
  };

  const startGame = () => {
    const initial: Record<string, Player> = {};
    startingFive.forEach((playerId, idx) => {
      const player = players.find(p => p.id === playerId);
      if (player) {
        initial[POSITIONS[idx]] = player;
      }
    });
    setActivePositions(initial);
    setSetupComplete(true);
    setTimeUntilNextSub(substitutionInterval);
  };

  const startClock = () => setIsRunning(true);
  const pauseClock = () => setIsRunning(false);

  const handleAutomaticSubstitution = () => {
    const nextInterval = currentSubIntervalIndex + 1;
    if (nextInterval < numberOfSubIntervals) {
      setCurrentSubIntervalIndex(nextInterval);

      const halfPlan = gamePlan[currentHalf];
      const intervalPlan = halfPlan?.[nextInterval];

      if (intervalPlan?.subs.length > 0) {
        setActivePositions(prev => {
          const updated = { ...prev };
          intervalPlan.subs.forEach(sub => {
            if (sub.playerInId && sub.playerOutId) {
              const playerIn = players.find(p => p.id === sub.playerInId);
              if (playerIn) {
                updated[sub.position] = playerIn;
              }
            }
          });
          return updated;
        });
      }
    }
  };

  const nextHalf = () => {
    setCurrentHalf(2);
    setCurrentSubIntervalIndex(0);
    setTimeUntilNextSub(substitutionInterval);
    setIsRunning(false);
  };

  const resetGame = () => {
    setSetupComplete(false);
    setCurrentHalf(1);
    setCurrentSubIntervalIndex(0);
    setIsRunning(false);
    setPlayTime({});
    setTimeUntilNextSub(substitutionInterval);
  };

  const executeManualSubstitution = () => {
    if (!manualSubOut || !manualSubIn) return;

    const playerOut = Object.values(activePositions).find(p => p.name === manualSubOut);
    const playerIn = players.find(p => p.name === manualSubIn);

    if (!playerOut || !playerIn) return;

    const position = Object.keys(activePositions).find(
      key => activePositions[key].id === playerOut.id
    );

    if (position) {
      setActivePositions(prev => ({
        ...prev,
        [position]: playerIn
      }));
    }

    setManualSubOut('');
    setManualSubIn('');
    setShowSubPanel(false);
  };

  const getBenchPlayers = () => {
    const onCourtIds = Object.values(activePositions).map(p => p.id);
    return players.filter(p => !onCourtIds.includes(p.id));
  };

  const getPlayerStats = () => {
    return players.map(player => ({
      ...player,
      timeFormatted: formatTime(playTime[player.id] || 0)
    })).sort((a, b) => (playTime[b.id] || 0) - (playTime[a.id] || 0));
  };

  const getPlayerById = (id: string) => players.find(p => p.id === id);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto p-6">
        {!setupComplete && (
          <div className="flex flex-col">
            <div className="bg-slate-900 shadow-sm border-b sticky top-0 z-10 px-4 py-3 -mx-6 -mt-6 mb-4" style={{ borderColor: GRAY_BORDER }}>
              <h1 className="text-3xl font-extrabold text-center" style={{ color: TEXT_COLOR_DARK }}>
                Basketball Rotation Manager
              </h1>
              <div className="flex items-center justify-center gap-2 mt-4">
                {setupSteps.map((step, index) => (
                  <div
                    key={step}
                    className={`h-3 w-3 rounded-full cursor-pointer transition-all`}
                    onClick={() => setSetupStep(step)}
                    style={{ backgroundColor: currentStepIndex >= index ? ACCENT_COLOR : GRAY_LIGHT }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-6 border-b" style={{ borderColor: GRAY_BORDER }}>
                {setupSteps.map((step) => (
                  <button
                    key={step}
                    className={`flex-1 py-3 text-base font-medium capitalize border-b-2 transition-all`}
                    onClick={() => setSetupStep(step)}
                    style={{
                      borderColor: setupStep === step ? ORANGE_ACCENT : 'transparent',
                      color: setupStep === step ? TEXT_COLOR_DARK : TEXT_COLOR_LIGHT,
                    }}
                  >
                    {step === 'starting' ? 'Starting Five' : step}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-auto py-4">
              {setupStep === 'players' && (
                <div className="space-y-6">
                  <div className="bg-slate-800 rounded-lg p-6 shadow-md border" style={{ borderColor: GRAY_BORDER }}>
                    <h2 className="text-xl font-bold mb-4" style={{ color: ORANGE_ACCENT }}>Game Settings & Players</h2>

                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1" style={{ color: TEXT_COLOR_LIGHT }}>
                        Half Length (minutes)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="30"
                        value={halfLength}
                        onChange={(e) => setHalfLength(parseInt(e.target.value) || 18)}
                        className="w-full px-4 py-2 rounded-md border focus:outline-none text-base bg-slate-700"
                        style={{ borderColor: GRAY_BORDER, color: TEXT_COLOR_DARK }}
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1" style={{ color: TEXT_COLOR_LIGHT }}>
                        Sub Interval (minutes)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        step="0.5"
                        value={substitutionInterval / 60}
                        onChange={(e) => setSubstitutionInterval(parseFloat(e.target.value) * 60 || 150)}
                        className="w-full px-4 py-2 rounded-md border focus:outline-none text-base bg-slate-700"
                        style={{ borderColor: GRAY_BORDER, color: TEXT_COLOR_DARK }}
                      />
                      <p className="text-xs mt-1" style={{ color: GRAY_LIGHT }}>Subs occur every {substitutionInterval / 60} minutes.</p>
                    </div>

                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                        placeholder="Player Name"
                        className="flex-1 px-4 py-2 rounded-md border focus:outline-none bg-slate-700"
                        style={{ borderColor: GRAY_BORDER, color: TEXT_COLOR_DARK }}
                      />
                      <button
                        onClick={addPlayer}
                        disabled={players.length >= 15}
                        className="p-3 rounded-md font-semibold text-white disabled:opacity-50 flex items-center justify-center transition-all"
                        style={{ backgroundColor: players.length >= 15 ? GRAY_LIGHT : PRIMARY_COLOR }}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="text-sm mb-3" style={{ color: TEXT_COLOR_LIGHT }}>
                      {players.length >= POSITIONS.length ? (
                        <span className="font-medium" style={{ color: ACCENT_COLOR }}>Ready to continue ({players.length} players)</span>
                      ) : (
                        <span>Need at least {POSITIONS.length} players ({players.length}/{POSITIONS.length})</span>
                      )}
                    </p>

                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2 bg-slate-900" style={{ borderColor: GRAY_BORDER }}>
                      {players.map(player => (
                        <div key={player.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-md border" style={{ borderColor: GRAY_BORDER }}>
                          <span className="font-medium text-base" style={{ color: TEXT_COLOR_DARK }}>{player.name}</span>
                          <button
                            onClick={() => removePlayer(player.id)}
                            className="p-1 rounded-full hover:bg-red-900 transition-all"
                            style={{ color: ORANGE_ACCENT }}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setSetupStep('roles')}
                    disabled={players.length < POSITIONS.length}
                    className="w-full py-3 rounded-md font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                    style={{ backgroundColor: players.length < POSITIONS.length ? GRAY_LIGHT : ACCENT_COLOR }}
                  >
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {setupStep === 'roles' && (
                <div className="space-y-6">
                  <div className="bg-slate-800 rounded-lg p-6 shadow-md border" style={{ borderColor: GRAY_BORDER }}>
                    <h2 className="text-xl font-bold mb-4" style={{ color: ORANGE_ACCENT }}>Player Roles (Optional)</h2>
                    <p className="text-sm mb-4" style={{ color: TEXT_COLOR_LIGHT }}>
                      Add custom roles like "Shooter" or "Rebounder" to help with decision-making.
                    </p>

                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addRole()}
                        placeholder="e.g., Playmaker"
                        className="flex-1 px-4 py-2 rounded-md border focus:outline-none bg-slate-700"
                        style={{ borderColor: GRAY_BORDER, color: TEXT_COLOR_DARK }}
                      />
                      <button
                        onClick={addRole}
                        className="p-3 rounded-md font-semibold text-white transition-all"
                        style={{ backgroundColor: PRIMARY_COLOR }}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    {customRoles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4 p-2 rounded-md border bg-slate-900" style={{ borderColor: GRAY_BORDER }}>
                        {customRoles.map(role => (
                          <span key={role} className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: PRIMARY_COLOR, color: TEXT_COLOR_DARK }}>
                            {role}
                            <button onClick={() => removeRole(role)} className="hover:opacity-70 transition-all" style={{ color: ORANGE_ACCENT }}>
                              <X className="w-4 h-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {customRoles.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-base" style={{ color: ORANGE_ACCENT }}>Assign Roles to Players</h3>
                        <div className="max-h-60 overflow-y-auto border rounded-md p-2 bg-slate-900" style={{ borderColor: GRAY_BORDER }}>
                          {players.map(player => (
                            <div key={player.id} className="p-3 bg-slate-800 rounded-md border mb-2 last:mb-0" style={{ borderColor: GRAY_BORDER }}>
                              <div className="font-medium mb-2 text-base" style={{ color: TEXT_COLOR_DARK }}>{player.name}</div>
                              <div className="flex flex-wrap gap-2">
                                {customRoles.map(role => (
                                  <button
                                    key={role}
                                    onClick={() => togglePlayerRole(player.id, role)}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all`}
                                    style={{
                                      backgroundColor: player.roles.includes(role) ? ACCENT_COLOR : 'transparent',
                                      color: player.roles.includes(role) ? TEXT_COLOR_DARK : TEXT_COLOR_LIGHT,
                                      border: `1px solid ${player.roles.includes(role) ? ACCENT_COLOR : GRAY_BORDER}`
                                    }}
                                  >
                                    {role}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setSetupStep('players')}
                      className="flex-1 py-3 rounded-md font-bold flex items-center justify-center gap-2 transition-all"
                      style={{ backgroundColor: GRAY_LIGHT, color: '#1a1d3a' }}
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Back
                    </button>
                    <button
                      onClick={() => setSetupStep('starting')}
                      className="flex-1 py-3 rounded-md font-bold text-white flex items-center justify-center gap-2 transition-all"
                      style={{ backgroundColor: ACCENT_COLOR }}
                    >
                      Continue
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {setupStep === 'starting' && (
                <div className="space-y-6">
                  <div className="bg-slate-800 rounded-lg p-6 shadow-md border" style={{ borderColor: GRAY_BORDER }}>
                    <h2 className="text-xl font-bold mb-3" style={{ color: ORANGE_ACCENT }}>Starting Five</h2>
                    <p className="text-sm mb-4" style={{ color: TEXT_COLOR_LIGHT }}>
                      Select {POSITIONS.length} players to start the game ({startingFive.length}/{POSITIONS.length})
                    </p>

                    <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2 bg-slate-900" style={{ borderColor: GRAY_BORDER }}>
                      {players.map(player => (
                        <button
                          key={player.id}
                          onClick={() => toggleStartingFive(player.id)}
                          className={`w-full p-3 rounded-md font-semibold text-left transition-all flex items-center justify-between text-base`}
                          style={{
                            backgroundColor: startingFive.includes(player.id) ? ACCENT_COLOR : 'transparent',
                            color: TEXT_COLOR_DARK,
                            border: `2px solid ${startingFive.includes(player.id) ? ACCENT_COLOR : GRAY_BORDER}`
                          }}
                        >
                          <span>{player.name}</span>
                          {startingFive.includes(player.id) && <span>✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setSetupStep('roles')}
                      className="flex-1 py-3 rounded-md font-bold flex items-center justify-center gap-2 transition-all"
                      style={{ backgroundColor: GRAY_LIGHT, color: '#1a1d3a' }}
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Back
                    </button>
                    <button
                      onClick={() => setSetupStep('game plan')}
                      disabled={startingFive.length !== POSITIONS.length}
                      className="flex-1 py-3 rounded-md font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                      style={{ backgroundColor: startingFive.length !== POSITIONS.length ? GRAY_LIGHT : ACCENT_COLOR }}
                    >
                      Continue to Game Plan
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {setupStep === 'game plan' && (
                <div className="space-y-6">
                  <div className="bg-slate-800 rounded-lg p-6 shadow-md border" style={{ borderColor: GRAY_BORDER }}>
                    <h2 className="text-xl font-bold mb-3" style={{ color: ORANGE_ACCENT }}>Define Game Plan</h2>
                    <p className="text-sm mb-4" style={{ color: TEXT_COLOR_LIGHT }}>
                      Plan your substitutions for each half and interval using the dropdowns below.
                    </p>

                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => setEditingHalf(1)}
                        className={`flex-1 py-2 rounded-md font-semibold text-white transition-all`}
                        style={{ backgroundColor: editingHalf === 1 ? ORANGE_ACCENT : GRAY_LIGHT, color: editingHalf === 1 ? TEXT_COLOR_DARK : '#1a1d3a' }}
                      >
                        Half 1 Plan
                      </button>
                      <button
                        onClick={() => setEditingHalf(2)}
                        className={`flex-1 py-2 rounded-md font-semibold text-white transition-all`}
                        style={{ backgroundColor: editingHalf === 2 ? ORANGE_ACCENT : GRAY_LIGHT, color: editingHalf === 2 ? TEXT_COLOR_DARK : '#1a1d3a' }}
                      >
                        Half 2 Plan
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={() => setShowPositions(!showPositions)}
                        className="px-4 py-2 rounded-md font-medium transition-all text-sm"
                        style={{
                          backgroundColor: showPositions ? PRIMARY_COLOR : 'transparent',
                          color: TEXT_COLOR_DARK,
                          border: `1px solid ${GRAY_BORDER}`
                        }}
                      >
                        {showPositions ? 'Hide' : 'Show'} Positions
                      </button>
                      <span className="text-xs" style={{ color: TEXT_COLOR_LIGHT }}>
                        Toggle to see/hide position labels (PG, SG, etc.)
                      </span>
                    </div>

                    <h3 className="font-semibold text-base mb-3" style={{ color: ORANGE_ACCENT }}>Substitution Intervals (Half {editingHalf})</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      {gamePlan[editingHalf]?.map(intervalObj => (
                        <div key={intervalObj.interval} className="border rounded-lg p-4 shadow-sm bg-slate-900" style={{ borderColor: GRAY_BORDER }}>
                          <h4 className="font-bold text-base mb-3" style={{ color: ORANGE_ACCENT }}>
                            Interval {intervalObj.interval} ({formatTime((intervalObj.interval -1) * substitutionInterval)} - {formatTime(intervalObj.interval * substitutionInterval)})
                          </h4>
                          <div className="grid grid-cols-1 gap-3">
                            {POSITIONS.map(pos => {
                              const currentSub = intervalObj.subs.find(sub => sub.position === pos);

                              return (
                                <div key={pos} className="flex flex-col gap-2">
                                  {showPositions && (
                                    <span className="text-xs font-semibold" style={{ color: TEXT_COLOR_LIGHT }}>{pos}:</span>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <select
                                      value={currentSub?.playerOutId || ''}
                                      onChange={(e) => handlePlayerOutChange(editingHalf, intervalObj.interval, pos, e.target.value)}
                                      className="flex-1 p-2 rounded-md border text-sm font-medium bg-slate-800 focus:outline-none"
                                      style={{ borderColor: GRAY_BORDER, color: TEXT_COLOR_DARK }}
                                    >
                                      <option value="">Player Out</option>
                                      {players.map(player => (
                                        <option key={player.id} value={player.id}>{player.name}</option>
                                      ))}
                                    </select>

                                    <ArrowRight className="w-5 h-5 flex-shrink-0" style={{ color: ORANGE_ACCENT }} />

                                    <select
                                      value={currentSub?.playerInId || ''}
                                      onChange={(e) => handlePlayerInChange(editingHalf, intervalObj.interval, pos, e.target.value)}
                                      className="flex-1 p-2 rounded-md border text-sm font-medium bg-slate-800 focus:outline-none"
                                      style={{ borderColor: GRAY_BORDER, color: TEXT_COLOR_DARK }}
                                    >
                                      <option value="">Player In</option>
                                      {players.map(player => (
                                        <option key={player.id} value={player.id}>{player.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                  {currentSub && (currentSub.playerOutId || currentSub.playerInId) && (
                                    <button
                                      onClick={() => removeSubFromPlan(editingHalf, intervalObj.interval, pos)}
                                      className="text-xs self-end hover:opacity-70 transition-all"
                                      style={{ color: ORANGE_ACCENT }}
                                    >
                                      Remove Sub
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setSetupStep('starting')}
                      className="flex-1 py-3 rounded-md font-bold flex items-center justify-center gap-2 transition-all"
                      style={{ backgroundColor: GRAY_LIGHT, color: '#1a1d3a' }}
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Back
                    </button>
                    <button
                      onClick={startGame}
                      className="flex-1 py-3 rounded-md font-bold text-white flex items-center justify-center gap-2 transition-all"
                      style={{ backgroundColor: ACCENT_COLOR }}
                    >
                      Start Game
                      <Play className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {setupComplete && (
          <div className="flex flex-col">
            <div className="bg-slate-900 shadow-sm border-b sticky top-0 z-10 px-4 py-3 -mx-6 -mt-6 mb-4" style={{ borderColor: GRAY_BORDER }}>
              <h1 className="text-2xl font-bold text-center mb-2" style={{ color: TEXT_COLOR_DARK }}>Live Game Management</h1>
              <div className="flex items-center justify-between text-center">
                <div>
                  <div className="text-sm" style={{ color: TEXT_COLOR_LIGHT }}>Half {currentHalf}</div>
                  <div className="text-base font-bold" style={{ color: ORANGE_ACCENT }}>{halfLength} min halves</div>
                </div>
                <div className="flex-1 px-4">
                  <div className="text-4xl font-extrabold" style={{ color: ORANGE_ACCENT }}>{formatTime(timeUntilNextSub)}</div>
                  <div className="text-sm" style={{ color: TEXT_COLOR_LIGHT }}>until Next Sub</div>
                </div>
                <div>
                  <div className="text-sm" style={{ color: TEXT_COLOR_LIGHT }}>Interval</div>
                  <div className="text-base font-bold" style={{ color: ORANGE_ACCENT }}>{currentSubIntervalIndex + 1} / {numberOfSubIntervals}</div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              <div className="bg-slate-800 rounded-lg p-4 shadow-md border" style={{ borderColor: GRAY_BORDER }}>
                <label className="block text-sm font-medium mb-2" style={{ color: TEXT_COLOR_LIGHT }}>
                  View Substitution Plan for Interval:
                </label>
                <select
                  value={currentSubIntervalIndex}
                  onChange={(e) => setCurrentSubIntervalIndex(parseInt(e.target.value))}
                  className="w-full px-4 py-2 rounded-md border text-base font-medium bg-slate-700 focus:outline-none"
                  style={{ borderColor: GRAY_BORDER, color: TEXT_COLOR_DARK }}
                >
                  {Array.from({ length: numberOfSubIntervals }, (_, i) => (
                    <option key={i} value={i}>
                      Interval {i + 1} ({formatTime(i * substitutionInterval)} - {formatTime((i + 1) * substitutionInterval)})
                    </option>
                  ))}
                </select>
              </div>

              {(() => {
                const currentHalfPlan = gamePlan[currentHalf];
                const plannedIntervalSubs = currentHalfPlan?.[currentSubIntervalIndex]?.subs || [];

                if (plannedIntervalSubs.length === 0) {
                  return (
                    <div className="border rounded-lg p-4 text-center italic" style={{ backgroundColor: 'transparent', borderColor: GRAY_BORDER, color: TEXT_COLOR_LIGHT }}>
                      No planned substitutions for this interval.
                    </div>
                  );
                }

                return (
                  <div className="border-2 rounded-lg p-6" style={{ backgroundColor: '#3a2a1a', borderColor: ORANGE_ACCENT }}>
                    <div className="text-base font-semibold mb-3" style={{ color: ORANGE_ACCENT }}>
                      Planned Substitutions for Interval {currentSubIntervalIndex + 1}:
                    </div>
                    <div className="space-y-3">
                      {plannedIntervalSubs.map((sub, index) => {
                        const playerOut = getPlayerById(sub.playerOutId);
                        const playerIn = getPlayerById(sub.playerInId);

                        if (!playerOut || !playerIn) return null;

                        return (
                          <div key={index} className="flex items-center justify-center gap-2 text-lg font-bold" style={{ color: TEXT_COLOR_DARK }}>
                            {showPositions && <span className="text-sm" style={{ color: TEXT_COLOR_LIGHT }}>({sub.position})</span>}
                            <span>{playerOut.name}</span>
                            <ArrowRight className="w-5 h-5" style={{ color: ORANGE_ACCENT }} />
                            <span style={{ color: ACCENT_COLOR }}>{playerIn.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div className="bg-slate-800 rounded-lg p-6 shadow-md border" style={{ borderColor: GRAY_BORDER }}>
                <h2 className="text-xl font-bold mb-4" style={{ color: ORANGE_ACCENT }}>On Court Players</h2>
                <div className="grid grid-cols-2 gap-3 text-base">
                  {POSITIONS.map(pos => {
                    const player = activePositions[pos];
                    return (
                      <div key={pos} className="flex flex-col items-start p-3 rounded-md border bg-slate-900" style={{ borderColor: GRAY_BORDER }}>
                        {showPositions && <span className="font-bold" style={{ color: TEXT_COLOR_LIGHT }}>{pos}:</span>}
                        <span className="font-medium" style={{ color: TEXT_COLOR_DARK }}>{player?.name || 'Empty'}</span>
                        {player?.roles.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {player.roles.map(role => (
                              <span key={role} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: ORANGE_ACCENT, color: ACCENT_COLOR }}>
                                {role}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-6 shadow-md border" style={{ borderColor: GRAY_BORDER }}>
                <h2 className="text-xl font-bold mb-4" style={{ color: ORANGE_ACCENT }}>Bench Players</h2>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2 bg-slate-900" style={{ borderColor: GRAY_BORDER }}>
                  {getBenchPlayers().length > 0 ? (
                    getBenchPlayers().map(player => (
                      <div key={player.id} className="flex flex-col items-start p-3 bg-slate-800 rounded-md border text-base" style={{ borderColor: GRAY_BORDER }}>
                        <div className="flex justify-between w-full">
                          <span className="font-medium" style={{ color: TEXT_COLOR_DARK }}>{player.name}</span>
                          <span style={{ color: TEXT_COLOR_LIGHT }}>Time: {formatTime(playTime[player.id] || 0)}</span>
                        </div>
                        {player?.roles.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {player.roles.map(role => (
                              <span key={role} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: PRIMARY_COLOR, color: TEXT_COLOR_DARK }}>
                                {role}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm italic" style={{ color: TEXT_COLOR_LIGHT }}>All players are on court or no bench players available.</p>
                  )}
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-6 shadow-md border" style={{ borderColor: GRAY_BORDER }}>
                <h2 className="text-xl font-bold mb-4" style={{ color: ORANGE_ACCENT }}>Player Stats</h2>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2 bg-slate-900" style={{ borderColor: GRAY_BORDER }}>
                  {getPlayerStats().map(player => (
                    <div key={player.id} className="flex flex-col items-start p-3 bg-slate-800 rounded-md border text-base" style={{ borderColor: GRAY_BORDER }}>
                      <div className="flex justify-between w-full">
                        <span className="font-medium" style={{ color: TEXT_COLOR_DARK }}>{player.name}</span>
                        <span style={{ color: TEXT_COLOR_LIGHT }}>Total Play: {player.timeFormatted}</span>
                      </div>
                      {player?.roles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {player.roles.map(role => (
                            <span key={role} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: PRIMARY_COLOR, color: TEXT_COLOR_DARK }}>
                              {role}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 shadow-lg border-t sticky bottom-0 z-10 p-4 -mx-6 mt-4 flex justify-around items-center" style={{ borderColor: GRAY_BORDER }}>
              <button
                onClick={isRunning ? pauseClock : startClock}
                className={`p-4 rounded-full text-white transition-all`}
                style={{ backgroundColor: isRunning ? '#dc2626' : ACCENT_COLOR }}
              >
                {isRunning ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
              </button>

              <button
                onClick={() => setShowSubPanel(!showSubPanel)}
                className={`p-4 rounded-full text-white transition-all`}
                style={{ backgroundColor: showSubPanel ? ORANGE_ACCENT : PRIMARY_COLOR }}
              >
                <Shuffle className="w-7 h-7" />
              </button>

              {currentHalf === 1 && (
                <button
                  onClick={nextHalf}
                  className="p-4 rounded-full text-white transition-all"
                  style={{ backgroundColor: ACCENT_COLOR }}
                >
                  <ArrowRight className="w-7 h-7" />
                </button>
              )}
              {currentHalf === 2 && (
                <button
                  onClick={resetGame}
                  className="p-4 rounded-full text-white transition-all"
                  style={{ backgroundColor: GRAY_LIGHT }}
                >
                  <RefreshCw className="w-7 h-7" />
                </button>
              )}
            </div>

            {showSubPanel && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
                <div className="bg-slate-800 rounded-lg p-8 shadow-xl w-full max-w-md border" style={{ borderColor: GRAY_BORDER }}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold" style={{ color: ORANGE_ACCENT }}>Manual Substitution</h3>
                    <button onClick={() => setShowSubPanel(false)} className="p-2 rounded-full hover:bg-slate-700 transition-all">
                      <X className="w-6 h-6" style={{ color: TEXT_COLOR_LIGHT }} />
                    </button>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: TEXT_COLOR_LIGHT }}>Player Out (Currently On Court)</label>
                    <select
                      value={manualSubOut}
                      onChange={(e) => setManualSubOut(e.target.value)}
                      className="w-full px-4 py-2 border rounded-md focus:outline-none text-base bg-slate-700"
                      style={{ borderColor: GRAY_BORDER, color: TEXT_COLOR_DARK }}
                    >
                      <option value="">Select player to take out</option>
                      {Object.values(activePositions).map(player => (
                        <option key={player.id} value={player.name}>{player.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2" style={{ color: TEXT_COLOR_LIGHT }}>Player In (From Bench)</label>
                    <select
                      value={manualSubIn}
                      onChange={(e) => setManualSubIn(e.target.value)}
                      className="w-full px-4 py-2 border rounded-md focus:outline-none text-base bg-slate-700"
                      style={{ borderColor: GRAY_BORDER, color: TEXT_COLOR_DARK }}
                    >
                      <option value="">Select player to put in</option>
                      {getBenchPlayers().map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={executeManualSubstitution}
                    disabled={!manualSubOut || !manualSubIn}
                    className="w-full py-3 rounded-md font-bold text-white disabled:opacity-50 text-lg transition-all"
                    style={{ backgroundColor: (!manualSubOut || !manualSubIn) ? GRAY_LIGHT : ACCENT_COLOR }}
                  >
                    Confirm Substitution
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
