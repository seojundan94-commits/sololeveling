import { GoogleGenAI, Type } from "@google/genai";
import { Rank, EnemySchema, Enemy } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const MODEL_NAME = "gemini-2.5-flash";

/**
 * Generates a dungeon entrance description and scenario based on Rank.
 */
export const generateDungeonScenario = async (rank: Rank, theme?: string): Promise<string> => {
  try {
    const prompt = `
      당신은 웹툰 '나 혼자만 레벨업'의 '시스템'입니다.
      플레이어가 ${rank}급 게이트(던전)에 입장했습니다.
      ${theme ? `던전 테마: ${theme}` : ''}
      이 던전의 분위기, 냄새, 그리고 느껴지는 살기를 묘사해주세요.
      짧고 강렬하게, 2-3문장으로 한국어로 작성하세요.
      플레이어에게 경고를 포함하세요.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "게이트 너머로 알 수 없는 살기가 느껴집니다...";
  } catch (error) {
    console.error("Gemini Dungeon Gen Error:", error);
    return `${rank}급 던전에 입장했습니다. 주위가 어둡고 습합니다.`;
  }
};

/**
 * Spawns a random enemy appropriate for the rank using Structured Output.
 */
export const generateEnemy = async (rank: Rank, specificName?: string): Promise<Enemy> => {
  try {
    const prompt = `
      웹툰 '나 혼자만 레벨업' 스타일의 몬스터를 하나 생성하세요.
      등급: ${rank}급.
      ${specificName ? `몬스터 이름: ${specificName} (이 이름으로 고정)` : ''}
      
      다음 기준을 따르세요:
      - E급: 고블린, 슬라임 등 약한 몬스터 (HP 50-100, 공격력 5-10)
      - C급: 리자드맨, 스톤골렘 등 (HP 300-500, 공격력 30-50)
      - S급: 최상위 마수, 용, 거인 (HP 2000+, 공격력 150+)
      
      JSON 형식으로 응답해야 합니다.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: EnemySchema
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response text");

    const data = JSON.parse(jsonText);
    
    return {
      name: data.name || "Unknown Entity",
      rank: rank,
      hp: data.hp || 100,
      maxHp: data.hp || 100,
      attack: data.attack || 10,
      description: data.description || "알 수 없는 생명체입니다.",
      isBoss: data.isBoss || false
    };

  } catch (error) {
    console.error("Gemini Enemy Gen Error:", error);
    return {
      name: specificName || "그림자 짐승",
      rank: rank,
      hp: rank === Rank.S ? 2000 : 100,
      maxHp: rank === Rank.S ? 2000 : 100,
      attack: rank === Rank.S ? 150 : 10,
      description: "어둠 속에서 눈을 빛내는 짐승입니다.",
      isBoss: false
    };
  }
};

/**
 * Generates narration for a story event.
 */
export const generateStoryNarration = async (title: string, bossName: string): Promise<string> => {
  try {
    const prompt = `
      당신은 '나 혼자만 레벨업'의 나레이터입니다.
      플레이어가 메인 스토리 '${title}'을 시작합니다.
      보스 몬스터 '${bossName}'와의 조우 장면을 묘사해주세요.
      성진우(플레이어)가 느끼는 긴장감과 압도적인 분위기를 3문장 이내로 한국어로 묘사하세요.
    `;
    
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt
    });
    return response.text || "강력한 적이 앞을 막아섭니다.";
  } catch (error) {
    return `전설적인 몬스터, ${bossName}가 나타났습니다!`;
  }
}
