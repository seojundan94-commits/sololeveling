import React, { useState } from 'react';
import { Rank, Enemy, Player, STORIES, Skill, Companion, Item, ItemType } from '../types';

interface ActionPanelProps {
  player: Player;
  addLog: (text: string, type?: any) => void;
  updatePlayer: (updates: Partial<Player>) => void;
  onEnemyDefeated: (enemyRank: Rank, expReward: number, goldReward: number, storyId?: number) => void;
  onPlayerDamage: (damage: number) => void;
}

type GameState = 'IDLE' | 'EXPLORING' | 'COMBAT' | 'VICTORY';
type TabState = 'DUNGEON' | 'STORY' | 'SHOP';
type CombatAnimState = 'IDLE' | 'ATTACK' | 'HIT' | 'SKILL';

// --- Local Data Generation Logic (Replaces GeminiService) ---

const generateDungeonScenarioLocal = (rank: Rank, theme?: string): string => {
    const base = `${rank}급 게이트에 입장했습니다.`;
    const themeDesc = theme ? `${theme}의 차가운 공기가 피부를 스칩니다.` : "어둠이 짙게 깔려 있습니다.";
    const danger = "어디선가 몬스터의 기척이 느껴집니다.";
    return `${base} ${themeDesc} ${danger}`;
};

const ENEMIES_BY_RANK: Record<Rank, Enemy[]> = {
    [Rank.E]: [
        { name: "고블린", rank: Rank.E, hp: 50, maxHp: 50, attack: 8, description: "작고 교활한 몬스터입니다.", isBoss: false },
        { name: "슬라임", rank: Rank.E, hp: 60, maxHp: 60, attack: 5, description: "점액질의 몬스터입니다.", isBoss: false },
        { name: "강철 이빨 늑대", rank: Rank.E, hp: 80, maxHp: 80, attack: 12, description: "날카로운 이빨을 가졌습니다.", isBoss: false }
    ],
    [Rank.D]: [
        { name: "홉 고블린", rank: Rank.D, hp: 150, maxHp: 150, attack: 25, description: "일반 고블린보다 덩치가 큽니다.", isBoss: false },
        { name: "스톤 골렘", rank: Rank.D, hp: 300, maxHp: 300, attack: 15, description: "돌로 이루어진 단단한 몬스터입니다.", isBoss: false }
    ],
    [Rank.C]: [
        { name: "리자드맨", rank: Rank.C, hp: 400, maxHp: 400, attack: 45, description: "비늘로 덮인 인간형 몬스터입니다.", isBoss: false },
        { name: "자이언트 스파이더", rank: Rank.C, hp: 350, maxHp: 350, attack: 50, description: "거대한 독거미입니다.", isBoss: false }
    ],
    [Rank.B]: [
        { name: "아이언 골렘", rank: Rank.B, hp: 1000, maxHp: 1000, attack: 70, description: "강철로 만들어진 골렘입니다.", isBoss: false },
        { name: "설인", rank: Rank.B, hp: 900, maxHp: 900, attack: 80, description: "혹한의 추위를 견디는 몬스터입니다.", isBoss: false },
        { name: "화염 도마뱀", rank: Rank.B, hp: 800, maxHp: 800, attack: 90, description: "몸에서 불길이 솟아오릅니다.", isBoss: false }
    ],
    [Rank.A]: [
        { name: "하이 오크 전사", rank: Rank.A, hp: 2000, maxHp: 2000, attack: 120, description: "붉은 피부의 고위 오크입니다.", isBoss: false },
        { name: "설원의 백귀", rank: Rank.A, hp: 1800, maxHp: 1800, attack: 130, description: "눈보라 속에 숨은 귀신입니다.", isBoss: false },
        { name: "마그마 거인", rank: Rank.A, hp: 2500, maxHp: 2500, attack: 110, description: "용암에서 태어난 거인입니다.", isBoss: false }
    ],
    [Rank.S]: [
        { name: "드래곤", rank: Rank.S, hp: 10000, maxHp: 10000, attack: 500, description: "최상위 포식자입니다.", isBoss: true },
        { name: "거인왕", rank: Rank.S, hp: 12000, maxHp: 12000, attack: 450, description: "모든 것을 짓밟는 왕입니다.", isBoss: true }
    ]
};

const generateEnemyLocal = (rank: Rank, specificName?: string): Enemy => {
    if (specificName) {
        // Boss fallback stats
        let hp = 100, atk = 10;
        if (rank === Rank.C) { hp = 800; atk = 60; }
        if (rank === Rank.A) { hp = 4000; atk = 200; }
        if (rank === Rank.S) { hp = 20000; atk = 1000; }
        
        return {
            name: specificName,
            rank,
            hp,
            maxHp: hp,
            attack: atk,
            description: "던전의 주인입니다.",
            isBoss: true
        };
    }
    
    const candidates = ENEMIES_BY_RANK[rank];
    const template = candidates[Math.floor(Math.random() * candidates.length)];
    
    // Variance
    const variance = 0.9 + Math.random() * 0.2; // 0.9 ~ 1.1
    const finalHp = Math.floor(template.maxHp * variance);
    const finalAtk = Math.floor(template.attack * variance);

    return {
        ...template,
        hp: finalHp,
        maxHp: finalHp,
        attack: finalAtk
    };
};

// --- Shop Data ---

const SHOP_ITEMS_RAW: Item[] = [
    // Consumables
    { id: 'hp_potion_s', name: '소형 HP 포션', type: 'CONSUMABLE', description: '체력을 50 회복합니다.', price: 100, effectValue: 50, count: 1 },
    { id: 'hp_potion_m', name: '중형 HP 포션', type: 'CONSUMABLE', description: '체력을 200 회복합니다.', price: 300, effectValue: 200, count: 1 },
    { id: 'hp_potion_l', name: '대형 HP 포션', type: 'CONSUMABLE', description: '체력을 500 회복합니다.', price: 800, effectValue: 500, count: 1 },
    { id: 'hp_potion_x', name: '초대형 HP 포션', type: 'CONSUMABLE', description: '체력을 1000 회복합니다.', price: 2000, effectValue: 1000, count: 1 },
    
    { id: 'mp_potion_s', name: '소형 MP 포션', type: 'CONSUMABLE', description: '마력을 30 회복합니다.', price: 100, effectValue: 30, count: 1 },
    { id: 'mp_potion_m', name: '중형 MP 포션', type: 'CONSUMABLE', description: '마력을 100 회복합니다.', price: 300, effectValue: 100, count: 1 },
    { id: 'mp_potion_l', name: '대형 MP 포션', type: 'CONSUMABLE', description: '마력을 300 회복합니다.', price: 800, effectValue: 300, count: 1 },
    { id: 'elixir', name: '엘릭서', type: 'CONSUMABLE', description: '체력과 마력을 완전히 회복합니다.', price: 5000, effectValue: 9999, count: 1 },

    // Weapons
    { id: 'iron_sword', name: '강철 검', type: 'WEAPON', slot: 'WEAPON', description: '기본적인 검. (공격력 +5)', price: 1000, effectValue: 5 },
    { id: 'knight_dagger', name: '기사의 단검', type: 'WEAPON', slot: 'WEAPON', description: '예리한 단검. (공격력 +10)', price: 5000, effectValue: 10 },
    { id: 'steel_dagger', name: '정밀한 강철 단검', type: 'WEAPON', slot: 'WEAPON', description: '숙련자를 위한 단검. (공격력 +15)', price: 8000, effectValue: 15 },
    { id: 'orc_axe', name: '오크 대장군의 도끼', type: 'WEAPON', slot: 'WEAPON', description: '파괴력이 뛰어납니다. (공격력 +25)', price: 15000, effectValue: 25 },
    { id: 'knight_killer', name: '나이트 킬러', type: 'WEAPON', slot: 'WEAPON', description: '갑옷을 뚫는 단검. (공격력 +35)', price: 30000, effectValue: 35 },
    { id: 'magic_sword', name: '마력 깃든 장검', type: 'WEAPON', slot: 'WEAPON', description: '마력이 흐르는 검. (공격력 +50)', price: 60000, effectValue: 50 },
    { id: 'baruka_dagger', name: '바루카의 단검', type: 'WEAPON', slot: 'WEAPON', description: '민첩함을 극대화합니다. (공격력 +75)', price: 120000, effectValue: 75 },
    { id: 'demon_longsword', name: '악마왕의 장검', type: 'WEAPON', slot: 'WEAPON', description: '전율이 느껴지는 검. (공격력 +120)', price: 250000, effectValue: 120 },
    { id: 'kamish_wrath', name: '카미쉬의 분노', type: 'WEAPON', slot: 'WEAPON', description: '용의 뼈로 만든 최강의 단검. (공격력 +300)', price: 1000000, effectValue: 300 },

    // Armor (Body)
    { id: 'leather_armor', name: '가죽 갑옷', type: 'ARMOR', slot: 'BODY', description: '활동하기 편한 갑옷. (방어력 +5)', price: 1500, effectValue: 5 },
    { id: 'hard_leather', name: '경화 가죽 갑옷', type: 'ARMOR', slot: 'BODY', description: '단단하게 가공된 가죽. (방어력 +10)', price: 3000, effectValue: 10 },
    { id: 'chainmail', name: '사슬 갑옷', type: 'ARMOR', slot: 'BODY', description: '베기 공격을 막아줍니다. (방어력 +18)', price: 7500, effectValue: 18 },
    { id: 'plate_armor', name: '판금 갑옷', type: 'ARMOR', slot: 'BODY', description: '단단한 강철 갑옷. (방어력 +30)', price: 25000, effectValue: 30 },
    { id: 'knight_heavy', name: '기사단장의 중갑', type: 'ARMOR', slot: 'BODY', description: '기사단장이 입던 갑옷. (방어력 +45)', price: 50000, effectValue: 45 },
    { id: 'commander_coat', name: '사령관의 코트', type: 'ARMOR', slot: 'BODY', description: '마법 저항력이 있습니다. (방어력 +60)', price: 100000, effectValue: 60 },
    { id: 'dragon_scale', name: '용비늘 갑옷', type: 'ARMOR', slot: 'BODY', description: '뚫을 수 없는 절대 방어. (방어력 +150)', price: 500000, effectValue: 150 },

    // Armor (Head)
    { id: 'high_orc_helm', name: '하이오크의 투구', type: 'ARMOR', slot: 'HEAD', description: '위압적인 투구. (방어력 +20)', price: 35000, effectValue: 20 },

    // Accessories
    { id: 'ring_str', name: '힘의 반지', type: 'WEAPON', slot: 'ACCESSORY', description: '착용 시 힘이 솟습니다. (공격력 +10)', price: 20000, effectValue: 10 },
    { id: 'neck_def', name: '수호의 목걸이', type: 'ARMOR', slot: 'ACCESSORY', description: '착용 시 보호막 생성. (방어력 +15)', price: 20000, effectValue: 15 },
];

const SHOP_ITEMS = SHOP_ITEMS_RAW.sort((a, b) => a.price - b.price);


export const ActionPanel: React.FC<ActionPanelProps> = ({ 
  player, 
  addLog, 
  updatePlayer,
  onEnemyDefeated,
  onPlayerDamage
}) => {
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [activeTab, setActiveTab] = useState<TabState>('STORY');
  const [currentEnemy, setCurrentEnemy] = useState<Enemy | null>(null);
  const [lastDefeatedEnemy, setLastDefeatedEnemy] = useState<Enemy | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeStoryId, setActiveStoryId] = useState<number | null>(null);
  const [extractionAttempted, setExtractionAttempted] = useState(false);
  
  // Animation State
  const [combatAnim, setCombatAnim] = useState<CombatAnimState>('IDLE');

  // Combat Helpers
  const calculatePlayerDamage = (multiplier: number = 1): { damage: number, isCrit: boolean } => {
      // Base Dmg = Str * 2 + Agi * 1 + Companion Bonuses + Equipped Weapon Bonuses
      const companionBonus = player.companions.reduce((acc, curr) => acc + curr.attackBonus, 0);
      
      // Calculate bonus from equipped items (WEAPON type items add attack, e.g. Swords, Rings)
      const equipmentBonus = player.inventory
        .filter(i => i.isEquipped && i.type === 'WEAPON')
        .reduce((acc, curr) => acc + curr.effectValue, 0);
      
      const baseDmg = (player.stats.strength * 2) + (player.stats.agility) + companionBonus + equipmentBonus;
      
      const variance = Math.random() * 0.4 + 0.8;
      const critChance = player.stats.sense * 0.01;
      const isCrit = Math.random() < critChance;
      
      let damage = Math.floor(baseDmg * variance * multiplier);
      if (isCrit) damage = Math.floor(damage * 1.5);
      
      return { damage, isCrit };
  };

  // Dungeon Actions
  const handleEnterDungeon = async (rank: Rank, theme?: string) => {
    if (loading) return;
    setLoading(true);
    addLog(`${rank}급 게이트에 입장합니다...`, 'info');
    
    // Local scenario generation
    const scenario = generateDungeonScenarioLocal(rank, theme);
    addLog(scenario, 'system');
    
    setTimeout(async () => {
        // Local enemy generation
        const enemy = generateEnemyLocal(rank);
        setCurrentEnemy(enemy);
        setGameState('COMBAT');
        setActiveStoryId(null);
        setExtractionAttempted(false);
        addLog(`[경고] ${enemy.name}(이)가 나타났습니다!`, 'danger');
        setLoading(false);
    }, 1500);
  };

  // Story Actions
  const handleStartStory = async (storyId: number) => {
      const story = STORIES[storyId];
      if (player.level < story.requiredLevel) {
          addLog(`레벨이 부족합니다. (필요 레벨: ${story.requiredLevel})`, 'danger');
          return;
      }

      setLoading(true);
      setActiveStoryId(storyId);
      setExtractionAttempted(false);
      addLog(`[메인 스토리] ${story.title} 시작...`, 'story');

      // Static narration
      addLog(`전설적인 몬스터, ${story.bossName}가 나타났습니다!`, 'system');

      setTimeout(async () => {
          const boss = generateEnemyLocal(story.bossRank, story.bossName);
          boss.isBoss = true;
          setCurrentEnemy(boss);
          setGameState('COMBAT');
          setLoading(false);
      }, 2000);
  };

  const triggerAnimation = (type: CombatAnimState) => {
      setCombatAnim(type);
      setTimeout(() => setCombatAnim('IDLE'), 500);
  };

  const handleAttack = () => {
    if (!currentEnemy) return;
    
    triggerAnimation('ATTACK');

    const { damage, isCrit } = calculatePlayerDamage(1);
    
    if (isCrit) addLog(`[치명타!] 급소를 정확히 가격했습니다!`, 'danger');
    
    const newEnemyHp = currentEnemy.hp - damage;
    setCurrentEnemy({ ...currentEnemy, hp: newEnemyHp });
    
    // Companion Flavor Text
    if (player.companions.length > 0 && Math.random() > 0.7) {
        const comp = player.companions[Math.floor(Math.random() * player.companions.length)];
        addLog(`${comp.name}(이)가 함께 공격합니다!`, 'info');
    }

    addLog(`${currentEnemy.name}에게 ${damage}의 피해를 입혔습니다.`, 'combat');

    if (newEnemyHp <= 0) {
        handleVictory();
    } else {
        setTimeout(handleEnemyTurn, 800);
    }
  };

  const handleSkillUse = (skill: Skill) => {
      if (!currentEnemy) return;
      if (player.mp < skill.mpCost) {
          addLog("마력이 부족합니다!", 'danger');
          return;
      }

      triggerAnimation('SKILL');
      updatePlayer({ mp: player.mp - skill.mpCost });

      if (skill.effect === 'heal') {
          const healAmount = Math.floor(player.maxHp * 0.4);
          updatePlayer({ hp: Math.min(player.maxHp, player.hp + healAmount) });
          addLog(`[스킬] ${skill.name} 사용! 체력이 ${healAmount} 회복되었습니다.`, 'gain');
          // Consumes turn
          setTimeout(handleEnemyTurn, 800);
          return;
      }

      if (skill.damageMult) {
           const { damage, isCrit } = calculatePlayerDamage(skill.damageMult);
           const newEnemyHp = currentEnemy.hp - damage;
           setCurrentEnemy({ ...currentEnemy, hp: newEnemyHp });
           addLog(`[스킬] ${skill.name}! ${damage}의 막대한 피해!`, 'danger');
           
           if (newEnemyHp <= 0) handleVictory();
           else setTimeout(handleEnemyTurn, 800);
           return;
      }
      
      // Fallback for generic skills
      addLog(`[스킬] ${skill.name} 발동!`, 'info');
      setTimeout(handleEnemyTurn, 800);
  };

  const handleEnemyTurn = () => {
      if (!currentEnemy || gameState !== 'COMBAT') return;

      // Defense Calculation (Vit + Equipped Armor)
      // ARMOR type items add Defense (Armor, Helm, Necklace)
      const armorBonus = player.inventory
        .filter(i => i.isEquipped && i.type === 'ARMOR')
        .reduce((acc, curr) => acc + curr.effectValue, 0);

      const defense = (player.stats.vitality * 0.8) + armorBonus;

      // Agility gives chance to dodge
      const dodgeChance = Math.min(0.5, player.stats.agility * 0.005); 
      
      if (Math.random() < dodgeChance) {
          addLog(`빠른 몸놀림으로 ${currentEnemy.name}의 공격을 회피했습니다!`, 'gain');
          return;
      }

      triggerAnimation('HIT');

      const rawDmg = currentEnemy.attack;
      const finalDmg = Math.max(1, Math.floor(rawDmg - defense));
      
      addLog(`${currentEnemy.name}의 공격! ${finalDmg}의 피해를 입었습니다. ${armorBonus > 0 ? `(방어구 효과 -${armorBonus})` : ''}`, 'danger');
      onPlayerDamage(finalDmg);
  };

  const handleVictory = () => {
      if (!currentEnemy) return;
      
      addLog(`${currentEnemy.name}을(를) 처치했습니다!`, 'gain');
      
      let expBase = 0;
      let goldBase = 0;
      
      switch(currentEnemy.rank) {
          case Rank.E: expBase = 20; goldBase = 100; break;
          case Rank.D: expBase = 50; goldBase = 300; break;
          case Rank.C: expBase = 150; goldBase = 1000; break;
          case Rank.B: expBase = 500; goldBase = 5000; break;
          case Rank.A: expBase = 2000; goldBase = 20000; break;
          case Rank.S: expBase = 10000; goldBase = 100000; break;
      }

      if (currentEnemy.isBoss) {
          expBase *= 3;
          goldBase *= 5;
          addLog("보스 처치 보너스 획득!", 'gain');
      }
      
      // Award EXP/Gold
      onEnemyDefeated(currentEnemy.rank, expBase, goldBase, activeStoryId !== null ? activeStoryId : undefined);

      // Store enemy for extraction logic
      setLastDefeatedEnemy(currentEnemy);
      setCurrentEnemy(null); // Clear active combat enemy
      setGameState('VICTORY'); // Go to victory screen instead of IDLE
  };

  const handleExtraction = () => {
      if (!lastDefeatedEnemy) return;
      if (extractionAttempted) {
          addLog("이미 추출을 시도했습니다.", 'info');
          return;
      }

      const skill = player.skills.find(s => s.id === 'shadow_extract');
      if (!skill) return;

      if (player.mp < skill.mpCost) {
          addLog("마력이 부족하여 추출할 수 없습니다.", 'danger');
          return;
      }

      setExtractionAttempted(true);
      updatePlayer({ mp: player.mp - skill.mpCost });
      addLog("그림자 추출을 시도합니다...", 'system');
      addLog(`"일어나라..."`, 'system');

      // Chance calculation based on Int
      // Base chance 40% + (Int * 0.5)%
      const successChance = 40 + (player.stats.intelligence * 0.5);
      const roll = Math.random() * 100;
      
      setTimeout(() => {
          if (roll < successChance) {
              // Determine Shadow Type and Name
              let shadowPrefix = "그림자";
              if (lastDefeatedEnemy.name.includes("고블린")) shadowPrefix = "그림자 고블린";
              else if (lastDefeatedEnemy.name.includes("오크")) shadowPrefix = "그림자 오크";
              else if (lastDefeatedEnemy.name.includes("나이트") || lastDefeatedEnemy.name.includes("기사")) shadowPrefix = "그림자 기사";
              else if (lastDefeatedEnemy.name.includes("베어") || lastDefeatedEnemy.name.includes("곰")) shadowPrefix = "그림자 베어";
              else shadowPrefix = `그림자 ${lastDefeatedEnemy.name.split(" ")[0]}`; // Use first word of name

              const newCompanion: Companion = {
                  id: `shadow_${Date.now()}`,
                  name: `${shadowPrefix} 병사`,
                  rank: lastDefeatedEnemy.rank,
                  description: `${lastDefeatedEnemy.name}의 그림자입니다.`,
                  type: 'SHADOW',
                  attackBonus: Math.floor(lastDefeatedEnemy.attack * 0.8) // 80% of original stats
              };

              const updatedCompanions = [...player.companions, newCompanion];
              updatePlayer({ companions: updatedCompanions });
              addLog(`성공했습니다! ${newCompanion.name}(이)가 그림자 군단에 합류합니다.`, 'gain');
          } else {
               addLog("추출에 실패했습니다. 영혼이 소멸되었습니다.", 'info');
          }
      }, 1500);
  };

  const handleEndVictory = () => {
      setGameState('IDLE');
      setLastDefeatedEnemy(null);
      setExtractionAttempted(false);
      setActiveStoryId(null);
  };

  const handleTraining = () => {
      if (player.hp < 10) { addLog("체력이 부족합니다.", 'danger'); return; }
      const gain = 5 + Math.floor(player.level);
      addLog("일일 퀘스트 수행 중...", 'info');
      updatePlayer({ hp: player.hp - 5, currentExp: player.currentExp + gain });
      addLog(`근력이 조금 상승한 기분입니다. (+${gain} EXP)`, 'gain');
  };

  const handleRest = () => {
      const hRec = Math.floor(player.maxHp * 0.5);
      const mRec = Math.floor(player.maxMp * 0.5);
      updatePlayer({ hp: Math.min(player.maxHp, player.hp + hRec), mp: Math.min(player.maxMp, player.mp + mRec) });
      addLog("휴식을 취했습니다.", 'gain');
  };

  const handleBuyItem = (item: Item) => {
      if (player.gold < item.price) {
          addLog("골드가 부족합니다.", 'danger');
          return;
      }

      const newInventory = [...player.inventory];
      
      if (item.type === 'CONSUMABLE') {
          const existingItem = newInventory.find(i => i.id === item.id);
          if (existingItem) {
              existingItem.count = (existingItem.count || 0) + 1;
          } else {
              newInventory.push({ ...item, count: 1 });
          }
      } else {
          // Equipment - Add as unique item with UID and default isEquipped: false
          newInventory.push({ 
            ...item, 
            uid: Date.now().toString() + Math.random().toString().slice(2),
            isEquipped: false 
          });
      }

      updatePlayer({ 
          gold: player.gold - item.price,
          inventory: newInventory
      });
      addLog(`${item.name}을(를) 구매했습니다.`, 'gain');
  };
  
  const handleUseItem = (itemId: string) => {
      const itemIndex = player.inventory.findIndex(i => i.id === itemId);
      if (itemIndex === -1) return;
      
      const item = player.inventory[itemIndex];
      if (item.type !== 'CONSUMABLE') return;
      
      let used = false;
      if (item.id === 'elixir') {
          updatePlayer({ hp: player.maxHp, mp: player.maxMp });
          addLog(`${item.name} 사용. 모든 상태가 회복되었습니다!`, 'gain');
          used = true;
      } else if (item.id.includes('hp')) {
          if (player.hp >= player.maxHp) { addLog("체력이 이미 가득 찼습니다.", 'info'); return; }
          updatePlayer({ hp: Math.min(player.maxHp, player.hp + item.effectValue) });
          addLog(`${item.name} 사용. 체력 ${item.effectValue} 회복.`, 'gain');
          used = true;
      } else if (item.id.includes('mp')) {
          if (player.mp >= player.maxMp) { addLog("마력이 이미 가득 찼습니다.", 'info'); return; }
          updatePlayer({ mp: Math.min(player.maxMp, player.mp + item.effectValue) });
          addLog(`${item.name} 사용. 마력 ${item.effectValue} 회복.`, 'gain');
          used = true;
      }
      
      if (used) {
          const newInventory = [...player.inventory];
          if ((item.count || 1) > 1) {
              newInventory[itemIndex].count = (item.count || 1) - 1;
          } else {
              newInventory.splice(itemIndex, 1);
          }
          updatePlayer({ inventory: newInventory });
      }
  };

  const hasExtractSkill = player.skills.some(s => s.id === 'shadow_extract');

  // -- RENDER --

  if (gameState === 'COMBAT' && currentEnemy) {
      return (
          <div className={`flex-1 flex flex-col gap-4 p-4 bg-red-900/10 border border-red-500/30 rounded-lg relative min-h-[400px] overflow-hidden transition-all duration-200
            ${combatAnim === 'HIT' ? 'animate-damage-shake border-red-600 bg-red-900/40 shadow-[inset_0_0_50px_rgba(220,38,38,0.5)]' : ''}
            ${combatAnim === 'SKILL' ? 'animate-skill-flash shadow-[inset_0_0_30px_rgba(59,130,246,0.3)]' : ''}
            ${combatAnim === 'ATTACK' ? 'shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]' : ''}
          `}>
              <div className="absolute top-2 right-4 text-red-500 font-bold text-xl tracking-wider animate-pulse z-10">COMBAT</div>
              
              {/* Visual Effects Overlay */}
              {combatAnim === 'ATTACK' && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none overflow-hidden">
                       <div className="w-[150%] h-[1px] bg-white/90 shadow-[0_0_20px_white] rotate-[-45deg] transform animate-pulse opacity-70"></div>
                  </div>
              )}
              {combatAnim === 'HIT' && (
                  <div className="absolute inset-0 z-20 bg-red-900/20 pointer-events-none mix-blend-overlay"></div>
              )}
               {combatAnim === 'SKILL' && (
                  <div className="absolute inset-0 z-20 bg-blue-500/10 mix-blend-overlay pointer-events-none"></div>
              )}

              {/* Enemy Display */}
              <div className={`flex flex-col items-center justify-center flex-1 py-4 transition-all duration-150 relative z-10
                  ${combatAnim === 'ATTACK' ? 'scale-95 opacity-60 translate-x-1 translate-y-1 grayscale' : ''}
              `}>
                  <div className={`text-6xl mb-4 filter drop-shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-200
                      ${combatAnim === 'IDLE' ? 'animate-bounce' : ''}
                      ${combatAnim === 'ATTACK' ? 'scale-110 text-red-300 blur-[2px]' : ''}
                      ${combatAnim === 'HIT' ? 'scale-110' : ''}
                  `}>
                      {currentEnemy.isBoss ? '👹' : '👾'}
                  </div>
                  <h3 className="text-2xl font-bold text-red-400">{currentEnemy.name} <span className="text-sm text-gray-400">({currentEnemy.rank}급)</span></h3>
                  <div className="w-full max-w-md mt-4 px-4">
                      <div className="flex justify-between text-sm text-red-300 mb-1">
                          <span>HP</span>
                          <span>{Math.max(0, currentEnemy.hp)} / {currentEnemy.maxHp}</span>
                      </div>
                      <div className="h-4 bg-gray-900 rounded-full border border-red-900/50 overflow-hidden relative">
                          <div className="h-full bg-red-600 transition-all duration-200" style={{ width: `${Math.max(0, (currentEnemy.hp / currentEnemy.maxHp) * 100)}%` }}></div>
                          {/* HP Bar Shine Effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full animate-pulse opacity-30"></div>
                      </div>
                  </div>
              </div>

              {/* Action Buttons */}
              <div className={`grid grid-cols-2 gap-2 mt-auto transition-all duration-200 transform ${combatAnim === 'ATTACK' ? 'translate-y-2 opacity-50' : ''}`}>
                  <button onClick={handleAttack} className="p-3 bg-gray-800 hover:bg-red-900 border border-gray-600 hover:border-red-500 rounded text-white font-bold active:scale-95 transition-transform">
                      ⚔️ 기본 공격
                  </button>
                  {player.skills.map(skill => (
                       skill.effect !== 'summon' && (
                       <button 
                           key={skill.id}
                           onClick={() => handleSkillUse(skill)} 
                           disabled={player.mp < skill.mpCost}
                           className="p-3 bg-gray-800 hover:bg-blue-900 border border-gray-600 hover:border-blue-500 rounded text-white disabled:opacity-30 flex flex-col items-center justify-center active:scale-95 transition-transform"
                       >
                          <span className="font-bold">{skill.name} <span className="text-xs text-yellow-500">Lv.{skill.level}</span></span>
                          <span className="text-xs text-blue-300">{skill.mpCost} MP</span>
                      </button>
                       )
                  ))}
                  
                  {/* Quick Items in Combat */}
                  <div className="col-span-2 flex gap-2 mt-2">
                      {player.inventory.filter(i => i.type === 'CONSUMABLE').map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleUseItem(item.id)}
                            className="flex-1 py-2 px-3 bg-gray-800 hover:bg-green-900 border border-gray-600 hover:border-green-500 rounded text-xs text-gray-300 flex justify-between items-center"
                          >
                              <span>💊 {item.name}</span>
                              <span>x{item.count}</span>
                          </button>
                      ))}
                  </div>

                  <button onClick={() => { addLog("도망쳤습니다!", 'info'); setGameState('IDLE'); setCurrentEnemy(null); }} className="col-span-2 p-2 text-xs text-gray-500 hover:text-white mt-2">
                      🏃 도망가기 (전투 종료)
                  </button>
              </div>
          </div>
      );
  }

  if (gameState === 'VICTORY' && lastDefeatedEnemy) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 bg-blue-900/10 border border-system-blue/50 rounded-lg relative min-h-[400px]">
             <div className="text-4xl font-bold text-system-blue animate-pulse drop-shadow-lg">VICTORY</div>
             <div className="text-center">
                 <p className="text-xl text-gray-300 mb-2">{lastDefeatedEnemy.name} 처치!</p>
                 <p className="text-sm text-gray-500">경험치와 골드를 획득했습니다.</p>
             </div>
             
             <div className="flex flex-col gap-3 w-full max-w-xs">
                 {hasExtractSkill && (
                     <button 
                        onClick={handleExtraction}
                        disabled={extractionAttempted || player.mp < 100}
                        className={`py-4 px-6 rounded border border-purple-500 text-purple-300 font-bold transition-all flex flex-col items-center
                            ${extractionAttempted ? 'bg-gray-900 opacity-50 cursor-not-allowed' : 'bg-purple-900/30 hover:bg-purple-900/60 hover:shadow-[0_0_20px_#a855f7]'}
                        `}
                     >
                         <span className="text-lg">그림자 추출</span>
                         <span className="text-xs opacity-70 font-normal">마나 100 소모 / 흑화</span>
                     </button>
                 )}
                 
                 <button 
                    onClick={handleEndVictory}
                    className="py-3 px-6 bg-gray-800 hover:bg-gray-700 rounded text-white font-bold border border-gray-600"
                 >
                     돌아가기
                 </button>
             </div>
        </div>
      );
  }

  return (
    <div className="flex-1 flex flex-col gap-4">
        {/* Top Actions */}
        <div className="flex gap-2 bg-system-panel p-2 rounded border border-gray-800">
             <button onClick={handleTraining} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm">💪 일일 퀘스트: 훈련</button>
             <button onClick={handleRest} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm">💤 휴식 (회복)</button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-700">
            <button 
                onClick={() => setActiveTab('STORY')}
                className={`flex-1 py-3 text-center font-bold transition-colors ${activeTab === 'STORY' ? 'text-system-blue border-b-2 border-system-blue bg-system-blue/5' : 'text-gray-500 hover:text-gray-300'}`}
            >
                📜 메인 스토리
            </button>
            <button 
                onClick={() => setActiveTab('DUNGEON')}
                className={`flex-1 py-3 text-center font-bold transition-colors ${activeTab === 'DUNGEON' ? 'text-system-blue border-b-2 border-system-blue bg-system-blue/5' : 'text-gray-500 hover:text-gray-300'}`}
            >
                🌀 게이트(던전)
            </button>
            {player.level >= 5 && (
                <button 
                    onClick={() => setActiveTab('SHOP')}
                    className={`flex-1 py-3 text-center font-bold transition-colors ${activeTab === 'SHOP' ? 'text-yellow-500 border-b-2 border-yellow-500 bg-yellow-500/5' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    💰 상점
                </button>
            )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto min-h-[300px]">
            {activeTab === 'STORY' && (
                <div className="space-y-3">
                    {STORIES.map((story, index) => {
                        const isLocked = index > player.storyStage;
                        const isCompleted = index < player.storyStage;
                        
                        return (
                            <div key={story.id} className={`relative p-4 rounded border ${isLocked ? 'border-gray-800 bg-gray-900/50 opacity-50' : isCompleted ? 'border-green-900 bg-green-900/10' : 'border-system-blue bg-system-blue/10'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className={`font-bold ${isCompleted ? 'text-green-500' : isLocked ? 'text-gray-500' : 'text-system-blue'}`}>
                                        {story.title}
                                    </h4>
                                    <span className="text-xs bg-gray-900 px-2 py-1 rounded text-gray-300">Lv.{story.requiredLevel}+</span>
                                </div>
                                <p className="text-sm text-gray-400 mb-4">{story.description}</p>
                                {isCompleted ? (
                                    <div className="text-xs text-green-500 font-bold">✔ 완료됨</div>
                                ) : (
                                    <button 
                                        onClick={() => !isLocked && handleStartStory(story.id)}
                                        disabled={isLocked || loading}
                                        className={`w-full py-2 rounded text-sm font-bold transition-all
                                            ${isLocked 
                                                ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                                                : 'bg-system-blue hover:bg-blue-600 text-black hover:shadow-[0_0_10px_#00a8ff]'
                                            }`}
                                    >
                                        {isLocked ? '이전 스토리 완료 필요' : '스토리 시작'}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {activeTab === 'DUNGEON' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {loading && <div className="col-span-2 text-center py-10 text-system-blue animate-pulse">게이트 생성 중...</div>}
                    {!loading && [
                        { r: Rank.E, t: "지하 수로" },
                        { r: Rank.D, t: "고블린 숲" },
                        { r: Rank.C, t: "오크의 늪지대" },
                        { r: Rank.B, t: "골렘의 광산" },
                        { r: Rank.B, t: "얼음 동굴" },
                        { r: Rank.A, t: "설원 (Red Gate)" },
                        { r: Rank.A, t: "화산 지대" },
                        { r: Rank.S, t: "제주도 (개미굴)" }
                    ].map((dungeon, index) => (
                        <button 
                            key={`${dungeon.r}-${index}`}
                            onClick={() => handleEnterDungeon(dungeon.r, dungeon.t)}
                            className={`p-4 text-left rounded border transition-all group
                                ${dungeon.r === Rank.S ? 'border-yellow-900 bg-yellow-900/10 hover:bg-yellow-900/20' : 
                                  dungeon.r === Rank.A ? 'border-red-900 bg-red-900/10 hover:bg-red-900/20' : 
                                  'border-gray-700 bg-gray-800/30 hover:bg-gray-700'}`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className={`font-bold ${dungeon.r === Rank.S ? 'text-yellow-500' : dungeon.r === Rank.A ? 'text-red-500' : 'text-gray-300'}`}>
                                    {dungeon.r}급 게이트
                                </span>
                                <span className="text-xs text-gray-500">{dungeon.t}</span>
                            </div>
                            <div className="text-xs text-gray-400 group-hover:text-white">입장하기 &rarr;</div>
                        </button>
                    ))}
                </div>
            )}

            {activeTab === 'SHOP' && (
                 <div className="space-y-4 p-2">
                    <div className="bg-yellow-900/10 p-3 rounded border border-yellow-700 text-center">
                        <h4 className="text-yellow-500 font-bold">HUNTER STORE</h4>
                        <p className="text-xs text-gray-400">헌터들을 위한 필수 보급품</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {SHOP_ITEMS.map((item) => (
                            <div key={item.id} className="flex justify-between items-center p-3 bg-gray-900/60 border border-gray-700 rounded hover:border-yellow-600 transition-colors">
                                <div>
                                    <div className="font-bold text-white">
                                        {item.name} 
                                        {item.slot && <span className="text-[10px] text-gray-400 ml-1">[{item.slot}]</span>}
                                    </div>
                                    <div className="text-xs text-gray-500">{item.description}</div>
                                </div>
                                <button 
                                    onClick={() => handleBuyItem(item)}
                                    className="flex flex-col items-end min-w-[80px] bg-gray-800 hover:bg-yellow-800 px-3 py-1 rounded transition-colors border border-gray-600"
                                >
                                    <span className="text-yellow-400 font-mono text-sm">{item.price} G</span>
                                    <span className="text-[10px] text-gray-300">구매</span>
                                </button>
                            </div>
                        ))}
                    </div>
                 </div>
            )}
        </div>
    </div>
  );
};