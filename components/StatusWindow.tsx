import React from 'react';
import { Player, Stats, Skill, Item, EquipmentSlot } from '../types';

interface StatusWindowProps {
  player: Player;
  onIncreaseStat: (statKey: keyof Stats) => void;
  onOpenUpgradeModal?: (skill: Skill) => void;
  onToggleEquip?: (item: Item) => void;
  onAdminCode?: (code: string) => void;
}

export const StatusWindow: React.FC<StatusWindowProps> = ({ player, onIncreaseStat, onOpenUpgradeModal, onToggleEquip, onAdminCode }) => {
  
  // Calculate bonuses for display
  const getEquippedBonus = (type: 'WEAPON' | 'ARMOR') => {
      return player.inventory
        .filter(i => i.isEquipped && i.type === type)
        .reduce((acc, curr) => acc + curr.effectValue, 0);
  };

  const attackBonus = getEquippedBonus('WEAPON');
  const defenseBonus = getEquippedBonus('ARMOR');

  const getEquippedItem = (slot: EquipmentSlot) => {
      return player.inventory.find(i => i.isEquipped && i.slot === slot);
  }

  const handleCmdClick = () => {
      if (onAdminCode) {
          const code = window.prompt("ENTER SYSTEM COMMAND CODE:");
          if (code) onAdminCode(code);
      }
  }

  return (
    <div className="w-full lg:w-1/3 bg-black/80 border border-system-blue shadow-[0_0_15px_rgba(0,168,255,0.2)] p-4 rounded-lg text-system-text font-sans relative overflow-hidden group flex flex-col gap-6 h-fit">
        {/* Scanline effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_2px,3px_100%]"></div>
        
        {/* Main Status */}
        <div className="relative z-10">
            <div className="flex justify-between items-center mb-4 border-b border-system-blue/50 pb-2">
                <h2 className="text-2xl font-bold text-system-blue tracking-widest">STATUS</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <p className="text-xs text-gray-400">NAME</p>
                    <div className="flex items-center gap-2">
                        <p className="text-lg font-bold">{player.name}</p>
                        {onAdminCode && (
                            <button onClick={handleCmdClick} className="text-[10px] bg-gray-800 hover:bg-system-blue text-gray-400 hover:text-black border border-gray-600 px-2 py-0.5 rounded transition-colors font-bold">
                                CODE
                            </button>
                        )}
                    </div>
                </div>
                <div>
                    <p className="text-xs text-gray-400">LEVEL</p>
                    <p className="text-lg font-bold text-yellow-400">{player.level}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400">JOB</p>
                    <p className="text-sm">{player.job}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400">TITLE</p>
                    <p className="text-sm">{player.title}</p>
                </div>
            </div>

            {/* HP/MP Bars */}
            <div className="mb-6 space-y-3">
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-red-400 font-bold">HP</span>
                        <span>{player.hp} / {player.maxHp}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-red-600 transition-all duration-300" 
                            style={{ width: `${Math.max(0, (player.hp / player.maxHp) * 100)}%` }}
                        />
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-blue-400 font-bold">MP</span>
                        <span>{player.mp} / {player.maxMp}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-600 transition-all duration-300" 
                            style={{ width: `${Math.max(0, (player.mp / player.maxMp) * 100)}%` }}
                        />
                    </div>
                </div>
                 <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-yellow-400 font-bold">EXP</span>
                        <span>{player.currentExp} / {player.maxExp}</span>
                    </div>
                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-yellow-500 transition-all duration-300" 
                            style={{ width: `${(player.currentExp / player.maxExp) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="space-y-2">
                <div className="flex justify-between items-center border-b border-gray-800 pb-1">
                    <span className="text-sm text-gray-400">능력치 포인트</span>
                    <span className={`font-mono font-bold ${player.statPoints > 0 ? 'text-yellow-400 animate-pulse' : 'text-gray-600'}`}>
                        {player.statPoints}
                    </span>
                </div>

                {(['strength', 'agility', 'sense', 'vitality', 'intelligence'] as Array<keyof Stats>).map((stat) => (
                    <div key={stat} className="flex items-center justify-between h-8">
                        <span className="text-sm uppercase w-24 text-gray-300">
                            {stat === 'strength' && '근력 (STR)'}
                            {stat === 'agility' && '민첩 (AGI)'}
                            {stat === 'sense' && '감각 (SNS)'}
                            {stat === 'vitality' && '체력 (VIT)'}
                            {stat === 'intelligence' && '지능 (INT)'}
                        </span>
                        <div className="flex gap-2">
                            <span className="font-mono text-system-blue font-bold">{player.stats[stat]}</span>
                            {/* Show Equipment Bonus */}
                            {stat === 'strength' && attackBonus > 0 && <span className="text-xs text-green-400 flex items-center">(+{attackBonus})</span>}
                            {stat === 'vitality' && defenseBonus > 0 && <span className="text-xs text-green-400 flex items-center">(+{defenseBonus})</span>}
                        </div>
                        {player.statPoints > 0 && (
                             <button 
                                onClick={() => onIncreaseStat(stat)}
                                className="ml-2 w-6 h-6 rounded bg-system-blue/20 text-system-blue hover:bg-system-blue hover:text-black text-xs flex items-center justify-center transition-colors"
                             >
                                +
                             </button>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* Equipped Section */}
        <div className="relative z-10 border-t border-gray-800 pt-4">
             <h3 className="text-sm font-bold text-gray-400 mb-2">EQUIPMENT</h3>
             <div className="grid grid-cols-2 gap-2 text-xs">
                 <div className="bg-gray-900/40 p-2 rounded border border-gray-700">
                     <span className="text-gray-500 block mb-1">무기</span>
                     <span className={getEquippedItem('WEAPON') ? "text-white" : "text-gray-600"}>
                         {getEquippedItem('WEAPON')?.name || "비어있음"}
                     </span>
                 </div>
                 <div className="bg-gray-900/40 p-2 rounded border border-gray-700">
                     <span className="text-gray-500 block mb-1">투구</span>
                     <span className={getEquippedItem('HEAD') ? "text-white" : "text-gray-600"}>
                         {getEquippedItem('HEAD')?.name || "비어있음"}
                     </span>
                 </div>
                 <div className="bg-gray-900/40 p-2 rounded border border-gray-700">
                     <span className="text-gray-500 block mb-1">갑옷</span>
                     <span className={getEquippedItem('BODY') ? "text-white" : "text-gray-600"}>
                         {getEquippedItem('BODY')?.name || "비어있음"}
                     </span>
                 </div>
                 <div className="bg-gray-900/40 p-2 rounded border border-gray-700">
                     <span className="text-gray-500 block mb-1">장신구</span>
                     <span className={getEquippedItem('ACCESSORY') ? "text-white" : "text-gray-600"}>
                         {getEquippedItem('ACCESSORY')?.name || "비어있음"}
                     </span>
                 </div>
             </div>
        </div>

        {/* Inventory Section */}
        <div className="relative z-10 border-t border-gray-800 pt-4">
            <h3 className="text-sm font-bold text-gray-400 mb-2">INVENTORY</h3>
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto custom-scrollbar">
                {player.inventory.length === 0 ? (
                     <p className="text-xs text-gray-600 italic">소지품이 없습니다.</p>
                ) : (
                    player.inventory.map((item, idx) => (
                        <div key={idx} className={`text-xs p-2 rounded border bg-gray-900/50 flex items-center justify-between
                            ${item.isEquipped ? 'border-green-500/50 bg-green-900/20' : 'border-gray-700'}
                        `}>
                            <div className="flex items-center gap-2">
                                {item.isEquipped && <span className="text-green-500 font-bold">[E]</span>}
                                <span className={item.isEquipped ? "text-green-100" : "text-gray-300"}>{item.name}</span>
                                {item.type === 'CONSUMABLE' && <span className="text-gray-500">x{item.count}</span>}
                            </div>
                            
                            {/* Equip/Unequip Button */}
                            {item.type !== 'CONSUMABLE' && onToggleEquip && (
                                <button 
                                    onClick={() => onToggleEquip(item)}
                                    className={`px-2 py-0.5 rounded text-[10px] border transition-colors
                                        ${item.isEquipped 
                                            ? 'border-red-500 text-red-400 hover:bg-red-900/30' 
                                            : 'border-blue-500 text-blue-400 hover:bg-blue-900/30'}
                                    `}
                                >
                                    {item.isEquipped ? '해제' : '장착'}
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Skills Section */}
        <div className="relative z-10 border-t border-gray-800 pt-4">
            <h3 className="text-sm font-bold text-gray-400 mb-2">SKILLS</h3>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                {player.skills.length === 0 ? (
                     <p className="text-xs text-gray-600 italic">습득한 스킬이 없습니다.</p>
                ) : (
                    player.skills.map(skill => (
                        <div key={skill.id} className="flex justify-between items-center bg-gray-900/50 p-2 rounded border border-gray-800 group/skill">
                            <div>
                                <div className="text-xs font-bold text-white flex items-center gap-2">
                                    {skill.name} <span className="text-[10px] text-yellow-500 border border-yellow-500/30 px-1 rounded">Lv.{skill.level}</span>
                                </div>
                                <div className="text-[10px] text-gray-500">{skill.description}</div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <div className="text-xs font-mono text-blue-400">{skill.mpCost > 0 ? `${skill.mpCost} MP` : 'Passive'}</div>
                                {onOpenUpgradeModal && (
                                    <button 
                                        onClick={() => onOpenUpgradeModal(skill)}
                                        className="text-[10px] bg-gray-800 hover:bg-yellow-900 text-gray-400 hover:text-yellow-400 px-1.5 py-0.5 rounded border border-gray-700 transition-colors"
                                    >
                                        ▲ 강화
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Army/Companions Section */}
        <div className="relative z-10 border-t border-gray-800 pt-4">
            <h3 className="text-sm font-bold text-gray-400 mb-2">SHADOW ARMY & PARTNERS</h3>
            <div className="flex flex-wrap gap-2">
                 {player.companions.length === 0 ? (
                     <p className="text-xs text-gray-600 italic">소환된 그림자가 없습니다.</p>
                ) : (
                    player.companions.map(comp => (
                        <div key={comp.id} className={`text-xs px-2 py-1 rounded border ${comp.type === 'SHADOW' ? 'bg-purple-900/20 border-purple-500 text-purple-300' : 'bg-blue-900/20 border-blue-500 text-blue-300'}`}>
                            {comp.name} <span className="text-xs opacity-70">({comp.rank}급)</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
  );
};