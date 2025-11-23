import { Type } from "@google/genai";
import React from 'react';

export enum PlayerClass {
  NONE = "무직",
  NECROMANCER = "네크로맨서",
  SHADOW_MONARCH = "그림자 군주"
}

export enum Rank {
  E = "E",
  D = "D",
  C = "C",
  B = "B",
  A = "A",
  S = "S"
}

export interface Stats {
  strength: number;
  agility: number;
  sense: number;
  vitality: number;
  intelligence: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  mpCost: number;
  cooldown: number; // in turns
  damageMult?: number; // multiplier for attack
  effect?: 'heal' | 'buff' | 'stealth' | 'summon';
  level: number;
}

export interface Companion {
  id: string;
  name: string;
  rank: Rank;
  description: string;
  type: 'HUNTER' | 'SHADOW';
  attackBonus: number;
}

export type ItemType = 'CONSUMABLE' | 'WEAPON' | 'ARMOR';
export type EquipmentSlot = 'WEAPON' | 'HEAD' | 'BODY' | 'ACCESSORY';

export interface Item {
  id: string;
  uid?: string; // Unique ID for inventory instances
  name: string;
  type: ItemType;
  slot?: EquipmentSlot;
  description: string;
  price: number;
  effectValue: number; // Heal amount or Attack bonus
  count?: number; // For consumables
  isEquipped?: boolean;
}

export interface Player {
  name: string;
  level: number;
  currentExp: number;
  maxExp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  gold: number;
  stats: Stats;
  statPoints: number;
  job: PlayerClass;
  title: string;
  rank: Rank;
  skills: Skill[];
  companions: Companion[];
  inventory: Item[];
  storyStage: number;
}

export interface Enemy {
  name: string;
  rank: Rank;
  hp: number;
  maxHp: number;
  attack: number;
  description: string;
  isBoss: boolean;
}

export interface LogEntry {
  id: string;
  text: string;
  type: 'system' | 'combat' | 'info' | 'danger' | 'gain' | 'story';
  timestamp: number;
}

// Gemini Service Response Types
export const EnemySchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "The name of the monster (Korean)." },
    hp: { type: Type.INTEGER, description: "Hit points of the monster." },
    attack: { type: Type.INTEGER, description: "Attack power of the monster." },
    description: { type: Type.STRING, description: "A short, menacing description of the monster." },
    isBoss: { type: Type.BOOLEAN, description: "Whether this monster is the dungeon boss." }
  },
  required: ["name", "hp", "attack", "description", "isBoss"]
};

export interface GameContextType {
  player: Player;
  setPlayer: React.Dispatch<React.SetStateAction<Player>>;
  addLog: (text: string, type?: LogEntry['type']) => void;
}

export const STORIES = [
  { id: 0, title: "각성: 인스턴스 던전", description: "합정역 지하철 역. 나만의 레벨업이 시작된다.", requiredLevel: 1, bossName: "푸른 독니 카사카", bossRank: Rank.C },
  { id: 1, title: "전직 퀘스트: 기사단장", description: "그림자 속에 숨어있는 붉은 기사와의 결투.", requiredLevel: 10, bossName: "핏빛의 이그리스", bossRank: Rank.A },
  { id: 2, title: "레드 게이트: 설원", description: "얼어붙은 숲 속, 백귀들과의 사투.", requiredLevel: 20, bossName: "백귀의 왕", bossRank: Rank.A },
  { id: 3, title: "악마의 성", description: "지옥의 불길 속에서 악마왕 바란을 처치하라.", requiredLevel: 35, bossName: "악마왕 바란", bossRank: Rank.S },
  { id: 4, title: "제주도 레이드", description: "S급 게이트. 개미들의 왕이 기다린다.", requiredLevel: 50, bossName: "개미의 왕 베르", bossRank: Rank.S },
];