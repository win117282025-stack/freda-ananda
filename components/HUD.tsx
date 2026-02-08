import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateAiResponse } from '../services/geminiService';
import { Leaderboard } from './Leaderboard';
import { WorldObjectType } from '../types';

export const HUD: React.FC = () => {
  const roomId = useGameStore(state => state.roomId);
  const username = useGameStore(state => state.username);
  const role = useGameStore(state => state.role);
  const gameMode = useGameStore(state => state.gameMode);
  
  const health = useGameStore(state => state.health);
  const maxHealth = useGameStore(state => state.maxHealth);
  const ammo = useGameStore(state => state.ammo);
  const maxAmmo = useGameStore(state => state.maxAmmo);
  
  const chatMessages = useGameStore(state => state.chatMessages);
  const addChatMessage = useGameStore(state => state.addChatMessage);
  
  const inventory = useGameStore(state => state.inventory);
  const selectedSlot = useGameStore(state => state.selectedSlot);
  const selectSlot = useGameStore(state => state.selectSlot);
  const unequipItem = useGameStore(state => state.unequipItem); 
  const setEmote = useGameStore(state => state.setEmote);
  const isShiftLock = useGameStore(state => state.isShiftLock);
  const toggleShiftLock = useGameStore(state => state.toggleShiftLock);
  const isMobile = useGameStore(state => state.isMobile);
  const setIsMobile = useGameStore(state => state.setIsMobile);
  const setVirtualInput = useGameStore(state => state.setVirtualInput);
  const virtualInput = useGameStore(state => state.virtualInput);
  const setModifiers = useGameStore(state => state.setModifiers);
  const removePlayer = useGameStore(state => state.removePlayer);
  const toggleFly = useGameStore(state => state.toggleFly);
  const isMenuOpen = useGameStore(state => state.isMenuOpen);
  const setMenuOpen = useGameStore(state => state.setMenuOpen);
  const drivingVehicleId = useGameStore(state => state.drivingVehicleId);
  const setDriving = useGameStore(state => state.setDriving);
  
  const buildType = useGameStore(state => state.buildType);
  const setBuildType = useGameStore(state => state.setBuildType);
  
  const [chatInput, setChatInput] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [showEmoteMenu, setShowEmoteMenu] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
        const mobile = window.innerWidth <= 768;
        if (useGameStore.getState().isMobile !== mobile) {
            setIsMobile(mobile);
        }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, showMobileChat]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            setMenuOpen(!isMenuOpen);
            setShowEmoteMenu(false); 
            if (!isMenuOpen) document.exitPointerLock();
            return;
        }

        if (isMenuOpen) return;
        if (document.activeElement?.tagName === 'INPUT') return;
        
        if (e.key === 'Shift') toggleShiftLock();
        if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
            const index = parseInt(e.key) - 1;
            if (index < inventory.length) selectSlot(index);
        }
        
        if (e.key.toLowerCase() === 'r' && gameMode === 'RIVALS') {
            useGameStore.getState().reloadAmmo();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inventory, selectSlot, toggleShiftLock, isMenuOpen, setMenuOpen, gameMode]);

  const processCommand = (msg: string) => {
    // ... (Keep existing commands)
    const args = msg.split(' ');
    const cmd = args[0].toLowerCase();
    if (cmd === '/e') {
        if (args[1] === 'dance1') { setEmote('dance1'); return true; }
        if (args[1] === 'dance2') { setEmote('dance2'); return true; }
        if (args[1] === 'dance3') { setEmote('dance3'); return true; }
    }
    if (role === 'OWNER' || role === 'ADMIN') {
        if (cmd === '/fly') { toggleFly(); return true; }
    }
    return false;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatInput('');
    if(isMobile) setShowMobileChat(false); 
    const isCommand = processCommand(msg);
    if (isCommand) return; 
    addChatMessage({ id: Date.now().toString(), sender: username, text: msg });
  };

  const selectedItem = selectedSlot === -1 ? 'NONE' : inventory[selectedSlot];

  return (
    <div className="absolute inset-0 pointer-events-none z-40 flex flex-col justify-between p-4 select-none">
      
      {/* Driving HUD */}
      {drivingVehicleId && (
           <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/50 p-4 rounded text-white text-center animate-pulse">
               <p className="font-bold text-xl">MENGEMUDI</p>
               <p className="text-sm">Tekan 'E' untuk Turun</p>
           </div>
      )}

      {/* Building Tools UI (Only if BUILD is selected) */}
      {selectedItem === 'BUILD' && !isMenuOpen && (
          <div className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-auto bg-black/80 p-2 rounded-xl border border-white/20 flex flex-col gap-2">
              <div className="text-white font-bold text-center border-b border-white/20 pb-1 mb-1">Building</div>
              {(['BLOCK', 'SPHERE', 'HOUSE', 'CAR'] as WorldObjectType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setBuildType(type)}
                    className={`px-4 py-2 rounded font-bold text-sm transition text-left flex items-center gap-2 ${buildType === type ? 'bg-roblox-blue text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                  >
                      {type === 'BLOCK' && <i className="fas fa-cube"></i>}
                      {type === 'SPHERE' && <i className="fas fa-circle"></i>}
                      {type === 'HOUSE' && <i className="fas fa-home"></i>}
                      {type === 'CAR' && <i className="fas fa-car"></i>}
                      {type}
                  </button>
              ))}
          </div>
      )}

      {/* RIVALS CROSSHAIR */}
      {gameMode === 'RIVALS' && !isMenuOpen && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_4px_black]"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-white/40 rounded-full"></div>
          </div>
      )}
      
      {!isMenuOpen && (
          <div className="absolute top-4 right-4 pointer-events-auto z-50">
              <Leaderboard />
          </div>
      )}

      <div className="flex justify-between items-start pointer-events-auto">
        <div className="flex gap-4 items-start">
            <button 
                onClick={() => { setMenuOpen(true); document.exitPointerLock(); }}
                className="w-10 h-10 bg-[#232527] rounded-lg border-2 border-white/20 flex items-center justify-center hover:bg-[#393b3d] transition shadow-lg group"
            >
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3a/Roblox_player_icon_black.svg" alt="Menu" className="w-6 h-6 invert opacity-80 group-hover:opacity-100" />
            </button>
            
            <div className="relative">
                <button 
                    onClick={() => setShowEmoteMenu(!showEmoteMenu)}
                    className={`w-10 h-10 bg-[#232527] rounded-lg border-2 border-white/20 flex items-center justify-center hover:bg-[#393b3d] transition shadow-lg group ${showEmoteMenu ? 'bg-[#393b3d] border-white' : ''}`}
                >
                    <i className="fas fa-smile text-yellow-400 text-lg group-hover:scale-110 transition"></i>
                </button>
                {showEmoteMenu && (
                    <div className="absolute top-12 left-0 bg-black/90 border border-white/20 rounded-lg p-2 flex flex-col gap-1 w-36 backdrop-blur-md animate-fade-in shadow-xl z-50">
                        <button onClick={() => { setEmote('dance1'); setShowEmoteMenu(false); }} className="text-left px-3 py-2 text-white hover:bg-white/10 rounded text-sm font-bold flex items-center gap-2"><i className="fas fa-music text-blue-400"></i> Joget 1</button>
                        <button onClick={() => { setEmote('dance2'); setShowEmoteMenu(false); }} className="text-left px-3 py-2 text-white hover:bg-white/10 rounded text-sm font-bold flex items-center gap-2"><i className="fas fa-bolt text-yellow-400"></i> Joget 2</button>
                        <button onClick={() => { setEmote('dance3'); setShowEmoteMenu(false); }} className="text-left px-3 py-2 text-white hover:bg-white/10 rounded text-sm font-bold flex items-center gap-2"><i className="fas fa-star text-pink-400"></i> Joget 3</button>
                        <div className="h-px bg-white/20 my-1"></div>
                        <button onClick={() => { setEmote('none'); setShowEmoteMenu(false); }} className="text-left px-3 py-2 text-red-400 hover:bg-red-500/20 rounded text-sm font-bold flex items-center gap-2"><i className="fas fa-stop-circle"></i> Berhenti</button>
                    </div>
                )}
            </div>

            <div className="bg-black/50 p-2 rounded-lg text-white flex flex-col gap-1 backdrop-blur-sm">
                <div className="font-bold text-yellow-400 text-sm">RUANGAN: {roomId}</div>
                <div className="text-[10px] text-gray-300">Mode: {gameMode}</div>
            </div>
        </div>
        
        <div className="flex gap-4">
            <div onClick={toggleShiftLock} className={`cursor-pointer p-2 rounded-full border-2 transition-all ${isShiftLock ? 'bg-roblox-blue border-white' : 'bg-black/50 border-gray-500'}`}>
                <div className="w-8 h-8 flex items-center justify-center text-white"><i className={`fas ${isShiftLock ? 'fa-crosshairs' : 'fa-lock-open'}`}></i></div>
            </div>
            <div className="bg-white/90 p-2 rounded-lg text-black text-xs font-bold shadow-lg flex items-center gap-2 h-fit mr-4 sm:mr-0">
                {role === 'OWNER' && <i className="fas fa-crown text-yellow-500"></i>}
                {role === 'ADMIN' && <i className="fas fa-shield-alt text-red-500"></i>}
                {username}
            </div>
        </div>
      </div>

      <div className="flex flex-row items-end gap-4 w-full h-full relative">
        {/* Chat Box */}
        {(!isMobile || showMobileChat) && (
            <div className={`w-80 pointer-events-auto ${isMobile ? 'absolute top-16 left-2 z-50 shadow-2xl' : ''}`}>
                <div className="bg-black/60 backdrop-blur-md rounded-t-lg h-32 overflow-y-auto p-2 space-y-2">
                {chatMessages.map((msg) => (
                    <div key={msg.id} className={`text-sm ${msg.isSystem ? 'text-yellow-300 italic' : 'text-white'}`}>
                    <span className={`font-bold ${msg.isAi ? 'text-blue-400' : 'text-roblox-blue'}`}>{msg.sender}:</span> <span className="ml-1 text-gray-100">{msg.text}</span>
                    </div>
                ))}
                <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSend} className="bg-black/80 p-2 rounded-b-lg flex gap-2">
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="flex-1 bg-transparent border border-gray-500 rounded px-2 py-1 text-white text-sm focus:outline-none" placeholder={isMobile ? "Chat..." : "Chat..."} />
                </form>
            </div>
        )}
        
        {/* SELF HEALTH BAR */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-64 bg-gray-800 border-2 border-white rounded-full overflow-hidden h-4">
             <div 
                className={`h-full transition-all duration-300 ${health > 50 ? 'bg-green-500' : health > 20 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                style={{width: `${(health/maxHealth)*100}%`}}
             ></div>
             <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white shadow-black drop-shadow-md">
                 HP: {health} / {maxHealth}
             </div>
        </div>

        {/* INVENTORY BAR */}
        {inventory.length > 0 && !showMobileChat && !isMenuOpen && gameMode !== 'RIVALS' && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto w-full max-w-lg px-2 overflow-x-auto">
                <div className="flex bg-black/50 p-2 rounded-xl gap-2 backdrop-blur-sm border border-white/10 justify-center">
                    <div onClick={() => unequipItem()} className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center cursor-pointer transition-all border-2 relative shrink-0 ${selectedSlot === -1 ? 'bg-white/20 border-white scale-110' : 'bg-black/30 border-transparent hover:bg-white/10'}`}>
                         <i className="fas fa-hand-paper text-xl sm:text-2xl text-white/50"></i>
                    </div>
                    {inventory.map((item, index) => (
                        <div key={index} onClick={() => !isMenuOpen && selectSlot(index)} className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center cursor-pointer transition-all border-2 relative shrink-0 ${selectedSlot === index ? 'bg-white/20 border-white scale-110' : 'bg-black/30 border-transparent hover:bg-white/10'}`}>
                            <span className="absolute top-1 left-2 text-[10px] sm:text-xs font-bold text-white/70">{index + 1}</span>
                            {item === 'GUN' && <i className="fas fa-bullseye text-xl sm:text-2xl text-red-400"></i>}
                            {item === 'SWORD' && <i className="fas fa-gavel text-xl sm:text-2xl text-blue-400"></i>}
                            {item === 'BUILD' && <i className="fas fa-hammer text-xl sm:text-2xl text-yellow-400"></i>}
                            {item === 'UKULELE' && <i className="fas fa-guitar text-xl sm:text-2xl text-orange-400"></i>}
                            {item === 'FISHING_ROD' && <i className="fas fa-fish text-xl sm:text-2xl text-cyan-400"></i>}
                            {item === 'WEAKEST_DUMMY' && <i className="fas fa-user-circle text-xl sm:text-2xl text-white"></i>}
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};