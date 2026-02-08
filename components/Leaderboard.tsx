import React from 'react';
import { useGameStore } from '../store/gameStore';

export const Leaderboard: React.FC = () => {
  const players = useGameStore(state => state.players);
  const localId = useGameStore(state => state.localId);

  // Sort players by kills (descending)
  const sortedPlayers = Object.values(players).sort((a, b) => {
    // Primary sort: Kills
    if ((b.kills || 0) !== (a.kills || 0)) {
        return (b.kills || 0) - (a.kills || 0);
    }
    // Secondary sort: Deaths (asc - fewer deaths is better)
    return (a.deaths || 0) - (b.deaths || 0);
  });

  return (
    <div className="bg-black/80 rounded-lg p-2 text-white w-64 backdrop-blur-md border border-white/20 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-2 mb-2 border-b border-white/20 pb-1">
            <span className="font-bold text-sm">Leaderboard</span>
            <div className="flex gap-4 text-xs font-bold text-gray-300">
                <span className="w-6 text-center" title="Kills">K</span>
                <span className="w-6 text-center" title="Deaths">D</span>
            </div>
        </div>
        
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
            {sortedPlayers.map((player) => (
                <div 
                    key={player.id} 
                    className={`flex items-center justify-between px-2 py-1 rounded text-xs ${player.id === localId ? 'bg-white/20 font-bold' : 'hover:bg-white/10'}`}
                >
                    <div className="flex items-center gap-2 truncate flex-1">
                        <span className="truncate max-w-[100px]">{player.username}</span>
                        {player.role === 'OWNER' && <i className="fas fa-crown text-yellow-500 text-[10px]"></i>}
                        {player.role === 'ADMIN' && <i className="fas fa-shield-alt text-red-500 text-[10px]"></i>}
                    </div>
                    <div className="flex gap-4 font-mono">
                         <span className="w-6 text-center text-red-400">{player.kills || 0}</span>
                         <span className="w-6 text-center text-gray-400">{player.deaths || 0}</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};