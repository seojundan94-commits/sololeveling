import React, { useState, useEffect, useCallback } from 'react';
import { Player, PlayerClass, Rank, Stats, LogEntry, Skill, Companion, Item } from './types';
import { StatusWindow } from './components/StatusWindow';
import { ActionPanel } from './components/ActionPanel';
import { GameLog } from './components/GameLog';

const INITIAL_STATS: Stats = {
  strength: 10,
  agility: 10,
  sense: 10,
  vitality: 10,
  intelligence: 10
};

const BASIC_SKILL: Skill = {
    id: 'sprint',
    name: '전력 질주',
    description: '이동 속도가 빨라집니다. (회피율 증가)',
    mpCost: 5,
    cooldown: 3,
    level: 1
};

const INITIAL_PLAYER: Player = {
  name: "", // Name will be set at start
  level: 1,
  currentExp: 0,
  maxExp: 100,
  hp: 100,
  maxHp: 100,
  mp: 50,
  maxMp: 50,
  gold: 0,
  stats: INITIAL_STATS,
  statPoints: 0,
  job: PlayerClass.NONE,
  title: "E급 헌터",
  rank: Rank.E,
  skills: [BASIC_SKILL],
  companions: [],
  inventory: [],
  storyStage: 0
};

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [playerNameInput, setPlayerNameInput] = useState("");
  
  const [player, setPlayer] = useState<Player>(INITIAL_PLAYER);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLevelUp, setIsLevelUp] = useState(false);
  
  // Skill Upgrade State
  const [selectedSkillForUpgrade, setSelectedSkillForUpgrade] = useState<Skill | null>(null);

  // Helper to add logs
  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [
      ...prev, 
      { id: Date.now().toString() + Math.random(), text, type, timestamp: Date.now() }
    ].slice(-50));
  }, []);

  // Level Up & Progression Check
  useEffect(() => {
    if (!gameStarted) return;

    if (player.currentExp >= player.maxExp) {
      const leftoverExp = player.currentExp - player.maxExp;
      const newLevel = player.level + 1;
      
      // Stat Growth
      const hpGrowth = 20 + (player.stats.vitality * 2);
      const mpGrowth = 10 + (player.stats.intelligence * 2);

      // Skill Unlocks
      let newSkills = [...player.skills];
      if (newLevel === 5 && !newSkills.find(s => s.id === 'vital_strike')) {
          newSkills.push({ id: 'vital_strike', name: '급소 찌르기', description: '적의 약점을 공격합니다. (공격력 200%)', mpCost: 15, cooldown: 2, damageMult: 2.0, level: 1 });
          addLog("【스킬 획득】 '급소 찌르기'를 배웠습니다.", 'system');
          addLog("【상점 개방】 상점 기능을 이용할 수 있습니다.", 'system');
      }
      if (newLevel === 15 && !newSkills.find(s => s.id === 'dagger_throw')) {
          newSkills.push({ id: 'dagger_throw', name: '단검 투척', description: '원거리에서 적을 공격합니다. (공격력 150%)', mpCost: 20, cooldown: 1, damageMult: 1.5, level: 1 });
          addLog("【스킬 획득】 '단검 투척'을 배웠습니다.", 'system');
      }
      // Unlock Shadow Extract at level 20 (or if job changes earlier via story)
      const hasNecromancerJob = player.job === PlayerClass.NECROMANCER || player.job === PlayerClass.SHADOW_MONARCH;
      if ((newLevel >= 20 || hasNecromancerJob) && !newSkills.find(s => s.id === 'shadow_extract')) {
          newSkills.push({ id: 'shadow_extract', name: '그림자 추출', description: '쓰러진 적의 그림자를 추출하여 병사로 만듭니다.', mpCost: 100, cooldown: 0, effect: 'summon', level: 1 });
          addLog("【스킬 획득】 '그림자 추출'을 배웠습니다.", 'system');
      }

      setPlayer(prev => ({
        ...prev,
        level: newLevel,
        currentExp: leftoverExp,
        maxExp: Math.floor(prev.maxExp * 1.3), // Smoother curve
        maxHp: prev.maxHp + hpGrowth,
        hp: prev.maxHp + hpGrowth,
        maxMp: prev.maxMp + mpGrowth,
        mp: prev.maxMp + mpGrowth,
        statPoints: prev.statPoints + 3,
        skills: newSkills
      }));
      
      setIsLevelUp(true);
      addLog(`레벨 업! Lv.${newLevel} 달성!`, 'system');
    }
  }, [player.currentExp, player.maxExp, player.level, player.stats, player.job, player.skills, addLog, gameStarted]);

  const handleStartGame = () => {
    if (!playerNameInput.trim()) return;
    setPlayer(prev => ({ ...prev, name: playerNameInput }));
    setGameStarted(true);
    
    // Initial logs
    setTimeout(() => {
        addLog("시스템과 동기화되었습니다.", 'system');
        addLog(`플레이어 '${playerNameInput}'님, 환영합니다.`, 'system');
    }, 100);
  };

  const handleIncreaseStat = (statKey: keyof Stats) => {
    if (player.statPoints <= 0) return;
    
    setPlayer(prev => {
        const newValue = prev.stats[statKey] + 1;
        let newMaxHp = prev.maxHp;
        let newMaxMp = prev.maxMp;
        if (statKey === 'vitality') newMaxHp += 10;
        if (statKey === 'intelligence') newMaxMp += 5;

        return {
            ...prev,
            stats: { ...prev.stats, [statKey]: newValue },
            statPoints: prev.statPoints - 1,
            maxHp: newMaxHp,
            maxMp: newMaxMp
        };
    });
  };

  const handleUpdatePlayer = (updates: Partial<Player>) => {
      setPlayer(prev => ({ ...prev, ...updates }));
  };

  const handleEnemyDefeated = (rank: Rank, exp: number, gold: number, storyId?: number) => {
      let updates: Partial<Player> = {
          currentExp: player.currentExp + exp,
          gold: player.gold + gold
      };

      // Story Completion Logic
      if (storyId !== undefined && storyId === player.storyStage) {
          addLog(`【스토리 완료】 챕터 ${storyId + 1} 클리어!`, 'system');
          updates.storyStage = player.storyStage + 1;

          // Story Rewards
          if (storyId === 1) { 
              updates.job = PlayerClass.NECROMANCER;
              updates.title = "그림자 군주";
              addLog("【전직】 네크로맨서로 전직했습니다. '일어나라'...", 'system');
              
              const igris: Companion = { id: 'igris', name: '이그리스', rank: Rank.A, description: '핏빛의 기사단장', type: 'SHADOW', attackBonus: 50 };
              updates.companions = [...player.companions, igris];
              addLog("그림자 병사 '이그리스'를 획득했습니다.", 'gain');
          }
          if (storyId === 2) { 
              const iron: Companion = { id: 'iron', name: '아이언', rank: Rank.A, description: '강철의 육체', type: 'SHADOW', attackBonus: 40 };
              updates.companions = [...(updates.companions || player.companions), iron];
              addLog("그림자 병사 '아이언'을 획득했습니다.", 'gain');
          }
          if (storyId === 4) { 
              const beru: Companion = { id: 'beru', name: '베르', rank: Rank.S, description: '개미의 왕', type: 'SHADOW', attackBonus: 200 };
              updates.companions = [...(updates.companions || player.companions), beru];
              addLog("그림자 병사 '베르'를 획득했습니다.", 'gain');
          }
      }

      handleUpdatePlayer(updates);
  };

  const handlePlayerDamage = (damage: number) => {
      const newHp = player.hp - damage;
      setPlayer(prev => ({ ...prev, hp: newHp }));
      
      if (newHp <= 0) {
          addLog("눈앞이 캄캄해집니다...", 'danger');
          addLog("【패널티】 레벨이 감소하지는 않으나, 경험치와 골드를 잃습니다.", 'system');
          setPlayer(prev => ({
              ...prev,
              hp: Math.floor(prev.maxHp * 0.1),
              currentExp: Math.floor(prev.currentExp * 0.5),
              gold: Math.floor(prev.gold * 0.8)
          }));
      }
  };

  // --- Skill Upgrade System ---
  const handleOpenUpgradeModal = (skill: Skill) => {
      setSelectedSkillForUpgrade(skill);
  };

  const handleUpgradeSkill = (type: 'damage' | 'cost' | 'cooldown') => {
      if (!selectedSkillForUpgrade) return;

      const skillIndex = player.skills.findIndex(s => s.id === selectedSkillForUpgrade.id);
      if (skillIndex === -1) return;

      const currentSkill = player.skills[skillIndex];
      const cost = Math.floor(500 * currentSkill.level);

      if (player.gold < cost) {
          addLog(`골드가 부족합니다. (필요: ${cost}G)`, 'danger');
          return;
      }

      let updatedSkill = { ...currentSkill, level: currentSkill.level + 1 };
      let upgradedText = "";

      if (type === 'damage') {
          if (!updatedSkill.damageMult) return;
          updatedSkill.damageMult = parseFloat((updatedSkill.damageMult + 0.2).toFixed(1));
          upgradedText = "공격력 증가";
      } else if (type === 'cost') {
          updatedSkill.mpCost = Math.max(1, updatedSkill.mpCost - 2);
          upgradedText = "MP 소모 감소";
      } else if (type === 'cooldown') {
          updatedSkill.cooldown = Math.max(0, updatedSkill.cooldown - 1);
          upgradedText = "재사용 대기시간 감소";
      }

      const newSkills = [...player.skills];
      newSkills[skillIndex] = updatedSkill;

      setPlayer(prev => ({
          ...prev,
          gold: prev.gold - cost,
          skills: newSkills
      }));

      addLog(`【스킬 강화】 ${updatedSkill.name} Lv.${updatedSkill.level} (${upgradedText})`, 'gain');
      setSelectedSkillForUpgrade(null);
  };

  // --- Equipment System ---
  const handleToggleEquip = (item: Item) => {
    if (item.type === 'CONSUMABLE') return;

    setPlayer(prev => {
        const newInventory = [...prev.inventory];
        const targetItemIndex = newInventory.findIndex(i => (i.uid && i.uid === item.uid) || i.id === item.id);
        
        if (targetItemIndex === -1) return prev;
        
        const targetItem = newInventory[targetItemIndex];
        
        if (targetItem.isEquipped) {
            // Unequip
            newInventory[targetItemIndex] = { ...targetItem, isEquipped: false };
            addLog(`${targetItem.name} 장착을 해제했습니다.`, 'info');
        } else {
            // Equip
            // Find currently equipped item in the same slot and unequip it
            const slot = targetItem.slot;
            if (slot) {
                newInventory.forEach((i, idx) => {
                    if (i.isEquipped && i.slot === slot) {
                        newInventory[idx] = { ...i, isEquipped: false };
                    }
                });
            }
            newInventory[targetItemIndex] = { ...targetItem, isEquipped: true };
            addLog(`${targetItem.name}을(를) 장착했습니다.`, 'gain');
        }

        return { ...prev, inventory: newInventory };
    });
  };

  // --- Admin/Cheat Codes ---
  const handleAdminCode = (code: string) => {
    if (code === '1014') {
        setPlayer(prev => ({ ...prev, gold: prev.gold + 50000 }));
        addLog("【SYSTEM】 관리자 권한 확인: 50,000 Gold 지급.", 'gain');
    } else if (code === '3237') {
        const kamish: Companion = {
            id: 'kamish',
            name: '그림자 카미쉬',
            rank: Rank.S,
            description: '파멸의 용',
            type: 'SHADOW',
            attackBonus: 500
        };
        // Check duplicate
        if (player.companions.find(c => c.id === 'kamish')) {
            addLog("이미 존재하는 그림자입니다.", 'info');
            return;
        }
        setPlayer(prev => ({ ...prev, companions: [...prev.companions, kamish] }));
        addLog("【SYSTEM】 관리자 권한 확인: 그림자 '카미쉬' 소환.", 'gain');
    } else if (code === '6717') {
        const iaido: Skill = {
            id: 'iaido',
            name: '발도술 (Iaido)',
            description: '보이지 않는 속도로 베어냅니다.',
            mpCost: 40,
            cooldown: 2,
            damageMult: 3.5,
            level: 1
        };
        // Check duplicate
        if (player.skills.find(s => s.id === 'iaido')) {
            addLog("이미 습득한 스킬입니다.", 'info');
            return;
        }
        setPlayer(prev => ({ ...prev, skills: [...prev.skills, iaido] }));
        addLog("【SYSTEM】 관리자 권한 확인: 스킬 '발도술' 습득.", 'gain');
    } else {
        addLog("유효하지 않은 코드입니다.", 'info');
    }
  };

  if (!gameStarted) {
      return (
          <div className="min-h-screen w-full bg-black text-system-text flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,168,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,168,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
              
              <div className="z-10 bg-system-panel/90 border border-system-blue p-8 rounded-lg shadow-[0_0_30px_rgba(0,168,255,0.3)] max-w-md w-full text-center backdrop-blur-md animate-in fade-in zoom-in duration-500">
                  <div className="mb-6 animate-pulse">
                      <h1 className="text-4xl font-bold text-system-blue tracking-[0.2em] drop-shadow-[0_0_10px_rgba(0,168,255,0.8)]">SYSTEM</h1>
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-system-blue to-transparent mt-2"></div>
                  </div>
                  
                  <p className="text-gray-300 mb-8 text-sm tracking-widest font-mono">[ 플레이어 등록 절차를 진행합니다 ]</p>
                  
                  <div className="mb-8 text-left group">
                      <label className="block text-xs text-system-blue mb-2 font-bold tracking-wider group-focus-within:text-white transition-colors">PLAYER NAME</label>
                      <input 
                        type="text" 
                        value={playerNameInput}
                        onChange={(e) => setPlayerNameInput(e.target.value)}
                        placeholder="이름을 입력하세요"
                        className="w-full bg-black/50 border border-gray-700 focus:border-system-blue rounded p-4 text-white outline-none transition-all shadow-inner focus:shadow-[0_0_15px_rgba(0,168,255,0.2)] text-lg"
                        onKeyDown={(e) => e.key === 'Enter' && handleStartGame()}
                        autoFocus
                      />
                  </div>

                  <button 
                    onClick={handleStartGame}
                    disabled={!playerNameInput.trim()}
                    className="w-full bg-system-blue hover:bg-blue-600 text-black font-bold py-4 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,168,255,0.6)] tracking-widest text-lg relative overflow-hidden"
                  >
                      <span className="relative z-10">등록 완료</span>
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen w-full bg-system-dark text-system-text flex flex-col p-2 lg:p-6 relative">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black"></div>
      </div>

      <header className="relative z-10 flex justify-between items-center mb-6 border-b border-system-blue/30 pb-4 shrink-0">
        <h1 className="text-xl lg:text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-system-blue to-white drop-shadow-[0_0_10px_rgba(0,168,255,0.8)]">
          SOLO LEVELING <span className="text-xs align-top text-system-blue">SYSTEM</span>
        </h1>
        <div className="flex flex-col lg:flex-row items-end lg:items-center gap-2 lg:gap-4 font-mono text-sm">
           <div className="text-yellow-500 font-bold drop-shadow-md">GOLD: {player.gold.toLocaleString()}</div>
        </div>
      </header>

      <main className="relative z-10 flex flex-col lg:flex-row gap-6 flex-1 max-w-7xl mx-auto w-full">
        <StatusWindow 
            player={player} 
            onIncreaseStat={handleIncreaseStat} 
            onOpenUpgradeModal={handleOpenUpgradeModal}
            onToggleEquip={handleToggleEquip}
            onAdminCode={handleAdminCode}
        />
        <div className="flex-1 flex flex-col gap-6 min-w-0">
            <GameLog logs={logs} />
            <ActionPanel 
                player={player} 
                addLog={addLog} 
                updatePlayer={handleUpdatePlayer}
                onEnemyDefeated={handleEnemyDefeated}
                onPlayerDamage={handlePlayerDamage}
            />
        </div>
      </main>

      {/* Level Up Modal */}
      {isLevelUp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-system-panel border-2 border-yellow-400 p-8 rounded-lg text-center shadow-[0_0_50px_rgba(250,204,21,0.4)] max-w-sm w-full">
                  <h2 className="text-3xl font-bold text-yellow-400 mb-2 animate-bounce">LEVEL UP!</h2>
                  <p className="text-white mb-6">능력이 상승했습니다.</p>
                  <button 
                    onClick={() => setIsLevelUp(false)}
                    className="px-6 py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400 transition-colors"
                  >
                      확인
                  </button>
              </div>
          </div>
      )}

      {/* Skill Upgrade Modal */}
      {selectedSkillForUpgrade && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 p-4">
              <div className="bg-system-panel border border-system-blue p-6 rounded-lg max-w-md w-full relative shadow-[0_0_30px_rgba(0,168,255,0.3)]">
                  <button onClick={() => setSelectedSkillForUpgrade(null)} className="absolute top-2 right-4 text-gray-500 hover:text-white">✕</button>
                  
                  <h2 className="text-xl font-bold text-system-blue mb-1">SKILL EVOLUTION</h2>
                  <p className="text-sm text-gray-400 mb-6 font-mono border-b border-gray-700 pb-2">
                      {selectedSkillForUpgrade.name} <span className="text-yellow-500">Lv.{selectedSkillForUpgrade.level}</span>
                  </p>

                  <div className="space-y-3">
                      <div className="text-center mb-4">
                          <span className="text-gray-400 text-xs">필요 골드</span>
                          <div className="text-yellow-400 font-bold font-mono text-xl">{Math.floor(500 * selectedSkillForUpgrade.level)} G</div>
                      </div>

                      {/* Damage Upgrade */}
                      {selectedSkillForUpgrade.damageMult && (
                          <button 
                            onClick={() => handleUpgradeSkill('damage')}
                            className="w-full p-3 bg-gray-800 hover:bg-red-900/40 border border-gray-600 hover:border-red-500 rounded flex justify-between items-center group transition-all"
                          >
                              <div className="text-left">
                                  <div className="font-bold text-red-300 group-hover:text-red-400">파괴력 강화</div>
                                  <div className="text-xs text-gray-500">공격력 계수 +0.2</div>
                              </div>
                              <span className="text-xl text-gray-600 group-hover:text-red-400">⚔️</span>
                          </button>
                      )}

                      {/* MP Cost Upgrade */}
                      <button 
                        onClick={() => handleUpgradeSkill('cost')}
                        disabled={selectedSkillForUpgrade.mpCost <= 1}
                        className="w-full p-3 bg-gray-800 hover:bg-blue-900/40 border border-gray-600 hover:border-blue-500 rounded flex justify-between items-center group transition-all disabled:opacity-50"
                      >
                          <div className="text-left">
                              <div className="font-bold text-blue-300 group-hover:text-blue-400">효율성 증대</div>
                              <div className="text-xs text-gray-500">MP 소모량 -2</div>
                          </div>
                          <span className="text-xl text-gray-600 group-hover:text-blue-400">💧</span>
                      </button>

                      {/* Cooldown Upgrade */}
                      <button 
                        onClick={() => handleUpgradeSkill('cooldown')}
                        disabled={selectedSkillForUpgrade.cooldown <= 0}
                        className="w-full p-3 bg-gray-800 hover:bg-green-900/40 border border-gray-600 hover:border-green-500 rounded flex justify-between items-center group transition-all disabled:opacity-50"
                      >
                          <div className="text-left">
                              <div className="font-bold text-green-300 group-hover:text-green-400">속도 강화</div>
                              <div className="text-xs text-gray-500">재사용 대기시간 -1턴</div>
                          </div>
                          <span className="text-xl text-gray-600 group-hover:text-green-400">⚡</span>
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}