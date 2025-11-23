import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface GameLogProps {
  logs: LogEntry[];
}

export const GameLog: React.FC<GameLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex-1 bg-system-panel/50 border border-system-blue/30 p-4 overflow-y-auto min-h-[200px] max-h-[300px] lg:max-h-[400px] rounded-lg backdrop-blur-sm custom-scrollbar">
      <div className="flex flex-col space-y-2">
        {logs.length === 0 && (
            <div className="text-gray-500 text-sm italic text-center my-10">
                시스템 메시지를 기다리는 중...
            </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className={`text-sm font-mono animate-typewriter overflow-hidden whitespace-normal break-words
            ${log.type === 'system' ? 'text-system-blue font-bold' : ''}
            ${log.type === 'danger' ? 'text-red-500 font-bold' : ''}
            ${log.type === 'gain' ? 'text-green-400' : ''}
            ${log.type === 'combat' ? 'text-gray-300' : ''}
            ${log.type === 'info' ? 'text-gray-400' : ''}
          `}>
            <span className="opacity-50 text-xs mr-2">[{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
            {log.type === 'system' && '【SYSTEM】 '}
            {log.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
