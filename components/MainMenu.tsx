import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GamePhase, GameMode } from '../types';

export const MainMenu: React.FC = () => {
  const { setUsername, setRoomId, setPhase, setRole, setIsHost, username, setGameMode } = useGameStore();
  
  // Login State
  const [authMode, setAuthMode] = useState<'GUEST' | 'LOGIN'>('GUEST');
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  
  // Room State
  const [inputName, setInputName] = useState(username); // For Guest
  const [inputRoom, setInputRoom] = useState('');
  const [menuStep, setMenuStep] = useState<'AUTH' | 'ROOM_SELECT' | 'JOIN_ROOM'>('AUTH');
  const [selectedMode, setSelectedMode] = useState<GameMode>('OBBY');

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleLogin = () => {
    if (loginUser === 'Freda' && loginPass === 'freda117282026') {
      setUsername('Freda (Pemilik)');
      setRole('OWNER');
      setMenuStep('ROOM_SELECT');
    } else if (loginUser && loginPass === 'admin123') {
      setUsername(`${loginUser} (Admin)`);
      setRole('ADMIN');
      setMenuStep('ROOM_SELECT');
    } else {
      alert('Username atau Password salah! (Petunjuk: Freda/freda117282026 atau ApaSaja/admin123)');
    }
  };

  const handleGuest = () => {
    setUsername(inputName || 'Tamu');
    setRole('GUEST'); 
    setMenuStep('ROOM_SELECT');
  };

  const handleCreate = () => {
    const code = generateRoomCode();
    setIsHost(true);
    setRoomId(code);
    setGameMode(selectedMode); // Set the selected mode
    setPhase(GamePhase.PLAYING);
  };

  const handleJoin = () => {
    if (inputRoom.length !== 5) return alert('Kode ruangan harus 5 karakter!');
    setIsHost(false);
    setRoomId(inputRoom.toUpperCase());
    setPhase(GamePhase.PLAYING);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-roblox-blue to-purple-600">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border-4 border-white/20 backdrop-blur-sm bg-opacity-95">
        
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black text-gray-800 tracking-tighter mb-2">
            OBBY NUSANTARA <span className="text-roblox-blue">3D</span>
          </h1>
          <p className="text-gray-500 font-medium">Multiplayer Obby & Peralatan</p>
        </div>

        {/* STEP 1: AUTHENTICATION */}
        {menuStep === 'AUTH' && (
          <div className="space-y-4">
            <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
              <button 
                onClick={() => setAuthMode('GUEST')}
                className={`flex-1 py-2 rounded-md font-bold text-sm transition ${authMode === 'GUEST' ? 'bg-white shadow text-roblox-blue' : 'text-gray-500'}`}
              >
                TAMU
              </button>
              <button 
                onClick={() => setAuthMode('LOGIN')}
                className={`flex-1 py-2 rounded-md font-bold text-sm transition ${authMode === 'LOGIN' ? 'bg-white shadow text-roblox-blue' : 'text-gray-500'}`}
              >
                MASUK
              </button>
            </div>

            {authMode === 'GUEST' ? (
              <div className="animate-fade-in">
                <label className="block text-sm font-bold text-gray-700 mb-1">Nama Tampilan</label>
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-roblox-blue focus:outline-none font-bold text-gray-700 mb-4"
                  placeholder="Nama Tamu..."
                />
                <button
                  onClick={handleGuest}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg transition"
                >
                  Masuk sebagai Tamu
                </button>
                <p className="text-xs text-gray-400 mt-2 text-center">Tamu memiliki akses terbatas.</p>
              </div>
            ) : (
              <div className="animate-fade-in space-y-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-roblox-blue focus:outline-none"
                    placeholder="Username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-roblox-blue focus:outline-none"
                    placeholder="Password"
                  />
                </div>
                <button
                  onClick={handleLogin}
                  className="w-full bg-roblox-blue hover:bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg transition mt-2"
                >
                  Masuk (Pemilik/Admin)
                </button>
                <p className="text-xs text-gray-400 mt-2 text-center">Pemilik/Admin punya akses penuh (Terbang/Spawn).</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: ROOM SELECTION */}
        {menuStep === 'ROOM_SELECT' && (
          <div className="space-y-4 animate-fade-in-up">
            
            {/* PLACE SELECTOR */}
            <div className="bg-gray-100 p-2 rounded-xl flex gap-2">
                <button
                    onClick={() => setSelectedMode('OBBY')}
                    className={`flex-1 py-3 rounded-lg font-bold text-sm transition flex flex-col items-center gap-1 ${selectedMode === 'OBBY' ? 'bg-white shadow text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <i className="fas fa-cube text-xl"></i>
                    OBBY INFINITE
                </button>
                <button
                    onClick={() => setSelectedMode('RIVALS')}
                    className={`flex-1 py-3 rounded-lg font-bold text-sm transition flex flex-col items-center gap-1 ${selectedMode === 'RIVALS' ? 'bg-white shadow text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <i className="fas fa-crosshairs text-xl"></i>
                    MARVEL RIVALS
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button
                onClick={handleCreate}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform hover:scale-105 transition duration-200 flex flex-col items-center"
                >
                <i className="fas fa-plus-circle text-2xl mb-2"></i>
                Buat Ruangan
                </button>
                <button
                onClick={() => setMenuStep('JOIN_ROOM')}
                className="bg-roblox-blue hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform hover:scale-105 transition duration-200 flex flex-col items-center"
                >
                <i className="fas fa-gamepad text-2xl mb-2"></i>
                Gabung
                </button>
            </div>
            
            <button onClick={() => setMenuStep('AUTH')} className="text-gray-400 text-sm font-bold hover:text-gray-600 w-full text-center">Batal</button>
          </div>
        )}

        {/* STEP 3: JOIN INPUT */}
        {menuStep === 'JOIN_ROOM' && (
          <div className="animate-fade-in-up">
            <label className="block text-sm font-bold text-gray-700 mb-1">Kode Ruangan (5 Karakter)</label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={5}
                value={inputRoom}
                onChange={(e) => setInputRoom(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-roblox-blue focus:outline-none font-mono font-bold text-2xl text-center tracking-widest uppercase"
                placeholder="ABCDE"
              />
              <button
                onClick={handleJoin}
                className="bg-roblox-blue text-white font-bold px-6 rounded-xl shadow-lg hover:bg-blue-600 transition"
              >
                GAS
              </button>
            </div>
            <button
              onClick={() => setMenuStep('ROOM_SELECT')}
              className="mt-4 text-gray-500 hover:text-gray-700 font-bold text-sm w-full text-center"
            >
              &larr; Kembali
            </button>
          </div>
        )}

        <div className="mt-8 text-center text-xs text-gray-400 font-semibold">
          {username !== 'Tamu' ? `Masuk sebagai: ${username}` : 'Belum masuk'}
        </div>
      </div>
    </div>
  );
};