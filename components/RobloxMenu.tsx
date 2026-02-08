import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { GamePhase, PlayerState } from '../types';

export const RobloxMenu: React.FC = () => {
  const localId = useGameStore(state => state.localId);
  const username = useGameStore(state => state.username);
  const role = useGameStore(state => state.role);
  const setMenuOpen = useGameStore(state => state.setMenuOpen);
  const resetGame = useGameStore(state => state.resetGame);
  
  // Settings State
  const volume = useGameStore(state => state.volume);
  const setVolume = useGameStore(state => state.setVolume);
  const graphicsQuality = useGameStore(state => state.graphicsQuality);
  const setGraphicsQuality = useGameStore(state => state.setGraphicsQuality);
  const theme = useGameStore(state => state.theme);
  const setTheme = useGameStore(state => state.setTheme);
  const isShiftLock = useGameStore(state => state.isShiftLock);
  const toggleShiftLock = useGameStore(state => state.toggleShiftLock);
  
  // Captures
  const captures = useGameStore(state => state.captures);

  // Selector
  const playersJson = useGameStore(state => JSON.stringify(
    Object.values(state.players)
      .sort((a: PlayerState, b: PlayerState) => a.id.localeCompare(b.id))
      .map((p: PlayerState) => ({
        id: p.id,
        username: p.username,
        role: p.role,
        isLocal: false
    }))
  ));
  const otherPlayers = useMemo(() => JSON.parse(playersJson), [playersJson]);

  const [activeTab, setActiveTab] = useState<'People' | 'Settings' | 'Captures' | 'Report' | 'Help'>('People');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Check fullscreen state
  useEffect(() => {
    const checkFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', checkFs);
    return () => document.removeEventListener('fullscreenchange', checkFs);
  }, []);

  const handleResetCharacter = () => {
    const event = new CustomEvent('player-death', { detail: { killerId: 'self' } });
    window.dispatchEvent(event);
    setMenuOpen(false);
  };

  const handleLeave = () => {
    setMenuOpen(false);
    resetGame();
  };

  const handleResume = () => {
    setMenuOpen(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((e) => console.log(e));
    } else {
        document.exitFullscreen().catch((e) => console.log(e));
    }
  };

  const handleTakeScreenshot = () => {
    setMenuOpen(false); // Close menu to take clear shot
    // Small delay to allow menu to disappear
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('take-screenshot'));
        // Re-open menu after a moment if desired, or let user enjoy the view
        // setTimeout(() => setMenuOpen(true), 500); 
    }, 100);
  };

  const allPlayers = [
    { id: localId, username, role, isLocal: true }, 
    ...otherPlayers
  ];

  // Theme Classes
  const bgClass = theme === 'DARK' ? 'bg-[#232527]/95 text-white' : 'bg-[#f2f4f5]/95 text-gray-900';
  const headerBgClass = theme === 'DARK' ? 'bg-[#111216]/50 border-white/10' : 'bg-white/80 border-gray-300';
  const cardBgClass = theme === 'DARK' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-gray-200 hover:bg-gray-50';
  const inputBgClass = theme === 'DARK' ? 'bg-black/20 border-white/10' : 'bg-white border-gray-300';
  const rowHoverClass = theme === 'DARK' ? 'hover:bg-white/5' : 'hover:bg-black/5';

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center font-sans">
      <div className={`w-[850px] h-[600px] rounded-xl shadow-2xl flex flex-col overflow-hidden border transition-colors ${bgClass} border-white/10`}>
        
        {/* TOP NAVIGATION */}
        <div className={`flex h-16 items-center px-6 border-b ${headerBgClass}`}>
          <div className="flex space-x-8 h-full">
            <button className="h-full flex items-center opacity-70 hover:opacity-100 transition px-2">
                <i className="fas fa-home text-xl"></i>
            </button>
            
            {['People', 'Settings', 'Captures', 'Report', 'Help'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`h-full flex items-center px-2 font-bold text-lg border-b-2 transition-colors ${
                        activeTab === tab 
                        ? (theme === 'DARK' ? 'border-white text-white' : 'border-gray-900 text-gray-900')
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                >
                    {tab}
                </button>
            ))}
          </div>
          <div className="ml-auto flex items-center space-x-2">
             <div className={`${theme === 'DARK' ? 'bg-white/10' : 'bg-black/10'} px-3 py-1 rounded text-sm font-bold flex items-center gap-2`}>
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Beta
             </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className={`flex-1 p-0 overflow-y-auto ${theme === 'DARK' ? 'bg-gradient-to-b from-[#232527] to-[#1a1c1e]' : 'bg-[#f2f4f5]'}`}>
          
          {activeTab === 'People' && (
            <div className="p-8 animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <i className="fas fa-user-friends opacity-50"></i>
                        People
                        <span className="text-sm font-normal opacity-60 ml-2">({allPlayers.length})</span>
                    </h2>
                    <button className="opacity-60 hover:opacity-100 text-sm font-bold flex items-center gap-1">
                        <i className="fas fa-envelope"></i> Invite friends
                    </button>
                </div>

                <div className="space-y-2">
                    {allPlayers.map((p) => (
                        <div key={p.id} className={`flex items-center p-3 rounded-lg transition border ${cardBgClass}`}>
                            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden border-2 border-gray-500 mr-4">
                                <i className="fas fa-user text-xl text-gray-300"></i>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg leading-tight">
                                        {p.username}
                                        {p.isLocal && <span className={`ml-2 text-xs px-1 rounded opacity-60 ${theme === 'DARK' ? 'bg-white/20' : 'bg-black/10'}`}>(You)</span>}
                                    </span>
                                    {p.role === 'OWNER' && <i className="fas fa-crown text-yellow-500 text-xs"></i>}
                                    {p.role === 'ADMIN' && <i className="fas fa-shield-alt text-red-500 text-xs"></i>}
                                </div>
                                <div className="text-xs opacity-50">@{p.username.toLowerCase().replace(/\s/g, '')}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {activeTab === 'Settings' && (
              <div className="animate-fade-in text-sm font-bold select-none">
                  <SettingRow label="Shift Lock Switch" theme={theme}>
                        <ArrowToggle 
                            value={isShiftLock ? 'On' : 'Off'} 
                            onPrev={toggleShiftLock} 
                            onNext={toggleShiftLock} 
                            theme={theme}
                        />
                  </SettingRow>

                  <SettingRow label="Theme" theme={theme}>
                         <ArrowToggle 
                            value={theme === 'DARK' ? 'Dark' : 'Light'} 
                            onPrev={() => setTheme(theme === 'DARK' ? 'LIGHT' : 'DARK')} 
                            onNext={() => setTheme(theme === 'DARK' ? 'LIGHT' : 'DARK')} 
                            theme={theme}
                        />
                  </SettingRow>

                  <SettingRow label="Camera Mode" theme={theme}>
                        <ArrowToggle value="Default (Classic)" disabled theme={theme} />
                  </SettingRow>

                   <SettingRow label="Movement Mode" theme={theme}>
                        <ArrowToggle value="Default (Keyboard)" disabled theme={theme} />
                  </SettingRow>

                  <SettingRow label="Volume" theme={theme}>
                      <Slider 
                        value={Math.round(volume * 10)} 
                        max={10} 
                        onChange={(v) => setVolume(v/10)} 
                        theme={theme}
                      />
                  </SettingRow>

                   <SettingRow label="Fullscreen" theme={theme}>
                        <ArrowToggle 
                            value={fullscreen ? 'On' : 'Off'} 
                            onPrev={toggleFullscreen} 
                            onNext={toggleFullscreen} 
                            theme={theme}
                        />
                  </SettingRow>

                  <SettingRow label="Graphics Mode" theme={theme}>
                         <ArrowToggle value="Manual" disabled theme={theme} />
                  </SettingRow>

                  <SettingRow label="Graphics Quality" theme={theme}>
                       <Slider 
                        value={graphicsQuality} 
                        max={10} 
                        onChange={(v) => setGraphicsQuality(v)} 
                        theme={theme}
                      />
                  </SettingRow>

                   <SettingRow label="Performance Stats" theme={theme}>
                        <ArrowToggle value="Off" disabled theme={theme} />
                  </SettingRow>
                  
                  <SettingRow label="Micro Profiler" theme={theme}>
                        <ArrowToggle value="Off" disabled theme={theme} />
                  </SettingRow>

                  <div className={`p-4 text-xs opacity-40 text-center ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Version: 1.0.0 (Beta)
                  </div>
              </div>
          )}

          {activeTab === 'Captures' && (
              <div className="p-8 animate-fade-in h-full flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Captures</h2>
                      <button 
                        onClick={handleTakeScreenshot}
                        className="bg-roblox-blue hover:bg-blue-600 text-white px-4 py-2 rounded font-bold transition flex items-center gap-2"
                      >
                          <i className="fas fa-camera"></i> Take Screenshot
                      </button>
                  </div>
                  
                  {captures.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                          <i className="fas fa-images text-6xl mb-4"></i>
                          <p>No captures yet.</p>
                      </div>
                  ) : (
                      <div className="grid grid-cols-3 gap-4 overflow-y-auto">
                          {captures.map((src, i) => (
                              <div key={i} className="group relative aspect-video bg-black rounded-lg overflow-hidden border border-white/10">
                                  <img src={src} alt={`Capture ${i}`} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                      <a href={src} download={`obby_capture_${i}.png`} className="p-2 bg-white/20 rounded hover:bg-white/40 text-white">
                                          <i className="fas fa-download"></i>
                                      </a>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'Report' && (
              <div className="p-8 animate-fade-in flex flex-col items-center justify-center h-full">
                  {!reportSuccess ? (
                      <div className={`w-full max-w-md p-6 rounded-xl border ${cardBgClass}`}>
                          <h2 className="text-2xl font-bold mb-6 text-center">Report Abuse</h2>
                          
                          <div className="space-y-4">
                              <div>
                                  <label className="block text-sm opacity-70 mb-1">Which player?</label>
                                  <select className={`w-full p-2 rounded border outline-none ${inputBgClass}`}>
                                      <option>Select Player</option>
                                      {otherPlayers.map((p: any) => (
                                          <option key={p.id}>{p.username}</option>
                                      ))}
                                  </select>
                              </div>

                              <div>
                                  <label className="block text-sm opacity-70 mb-1">Type of Abuse</label>
                                  <select className={`w-full p-2 rounded border outline-none ${inputBgClass}`}>
                                      <option>Bullying or Harassment</option>
                                      <option>Cheating/Exploiting</option>
                                      <option>Inappropriate Content</option>
                                      <option>Spamming</option>
                                  </select>
                              </div>

                              <div>
                                  <label className="block text-sm opacity-70 mb-1">Description</label>
                                  <textarea 
                                    className={`w-full p-2 rounded border outline-none h-24 resize-none ${inputBgClass}`}
                                    placeholder="Please describe what happened..."
                                  ></textarea>
                              </div>

                              <button 
                                onClick={() => setReportSuccess(true)}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded transition mt-2"
                              >
                                  Submit Report
                              </button>
                          </div>
                      </div>
                  ) : (
                      <div className="text-center">
                          <i className="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
                          <h2 className="text-2xl font-bold mb-2">Thank You</h2>
                          <p className="opacity-70 mb-6">Your report has been received and will be reviewed.</p>
                          <button 
                            onClick={() => setReportSuccess(false)}
                            className="text-roblox-blue hover:underline font-bold"
                          >
                              Submit another report
                          </button>
                      </div>
                  )}
              </div>
          )}

           {activeTab === 'Help' && (
              <div className="text-center mt-20 opacity-60">
                  <i className="fas fa-question-circle text-6xl mb-4"></i>
                  <p>Controls:</p>
                  <p className="mt-2 text-sm">WASD to Move | Space to Jump | Shift to Run</p>
                  <p className="text-sm">Click to Attack/Use Item</p>
              </div>
          )}

        </div>

        {/* BOTTOM ACTION BAR */}
        <div className={`h-20 border-t flex items-center justify-center space-x-6 ${theme === 'DARK' ? 'bg-[#111216] border-white/10' : 'bg-white border-gray-300'}`}>
            <ActionButton label="Reset Character" icon="R" onClick={handleResetCharacter} theme={theme} />
            <div className={`w-px h-10 mx-4 ${theme === 'DARK' ? 'bg-white/20' : 'bg-black/20'}`}></div>
            <ActionButton label="Leave" icon="L" onClick={handleLeave} danger theme={theme} />
            <div className={`w-px h-10 mx-4 ${theme === 'DARK' ? 'bg-white/20' : 'bg-black/20'}`}></div>
            <ActionButton label="Resume" icon="ESC" onClick={handleResume} theme={theme} />
        </div>

      </div>
    </div>
  );
};

// UI HELPER COMPONENTS

const SettingRow: React.FC<{ label: string; children: React.ReactNode; theme: string }> = ({ label, children, theme }) => (
    <div className={`flex items-center justify-between px-8 py-3 transition ${theme === 'DARK' ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
        <span className="opacity-90 tracking-wide">{label}</span>
        <div className="w-64 flex justify-end">
            {children}
        </div>
    </div>
);

const ArrowToggle: React.FC<{ value: string; onPrev?: () => void; onNext?: () => void; disabled?: boolean; theme: string }> = ({ value, onPrev, onNext, disabled, theme }) => (
    <div className="flex items-center gap-2">
        <button 
            onClick={onPrev} 
            disabled={disabled}
            className={`w-8 h-8 flex items-center justify-center rounded transition ${disabled ? 'opacity-20 cursor-default' : 'opacity-50 hover:opacity-100 hover:bg-white/10'}`}
        >
            <i className="fas fa-chevron-left"></i>
        </button>
        <div className={`w-40 text-center font-bold ${disabled ? 'opacity-40' : ''}`}>{value}</div>
        <button 
            onClick={onNext} 
            disabled={disabled}
            className={`w-8 h-8 flex items-center justify-center rounded transition ${disabled ? 'opacity-20 cursor-default' : 'opacity-50 hover:opacity-100 hover:bg-white/10'}`}
        >
            <i className="fas fa-chevron-right"></i>
        </button>
    </div>
);

const Slider: React.FC<{ value: number; max: number; onChange: (v: number) => void; theme: string }> = ({ value, max, onChange, theme }) => {
    // We render discrete bars like Roblox
    // But input range is cleaner for code, we can visually fake it
    return (
        <div className="flex items-center gap-2">
             <button 
                onClick={() => onChange(Math.max(0, value - 1))}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${theme === 'DARK' ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/5'}`}
            >
                <i className="fas fa-minus text-xs"></i>
            </button>
            <div className="flex gap-1">
                {Array.from({ length: max }).map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-3 h-6 transition-colors ${
                            i < value 
                            ? 'bg-roblox-blue' 
                            : (theme === 'DARK' ? 'bg-white/20' : 'bg-black/10')
                        }`}
                        onClick={() => onChange(i + 1)}
                    ></div>
                ))}
            </div>
             <button 
                onClick={() => onChange(Math.min(max, value + 1))}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${theme === 'DARK' ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/5'}`}
            >
                <i className="fas fa-plus text-xs"></i>
            </button>
        </div>
    );
};

const ActionButton: React.FC<{ label: string; icon: string; onClick: () => void; danger?: boolean; theme: string }> = ({ label, icon, onClick, danger, theme }) => (
    <button onClick={onClick} className="group flex flex-col items-center justify-center">
        <div className={`w-10 h-10 border rounded flex items-center justify-center mb-1 transition
            ${danger 
                ? 'border-white/30 group-hover:bg-red-500/20 group-hover:border-red-500' 
                : (theme === 'DARK' ? 'border-white/30 group-hover:bg-white/10' : 'border-black/30 group-hover:bg-black/5')
            }
        `}>
            <span className={`font-bold text-lg ${theme === 'DARK' ? 'text-white' : 'text-black'}`}>{icon}</span>
        </div>
        <span className={`text-[10px] uppercase font-bold tracking-wider ${theme === 'DARK' ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
    </button>
);
