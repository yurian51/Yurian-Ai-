import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface TerminalProps {
  logs: LogEntry[];
}

const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="w-full h-48 md:h-full bg-black/80 border border-red-900 p-4 overflow-hidden flex flex-col font-mono text-xs md:text-sm">
      <div className="border-b border-red-900 mb-2 pb-1 text-red-500 font-bold tracking-widest flex justify-between">
        <span>SYSTEM LOG</span>
        <span>TRN: 8492-AC</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 pr-2">
        {logs.map((log) => (
          <div key={log.id} className={`${
            log.type === 'ERROR' ? 'text-red-600 font-bold bg-red-900/20' : 
            log.type === 'AI' ? 'text-red-300' :
            log.type === 'USER' ? 'text-gray-400' : 'text-red-800'
          }`}>
            <span className="opacity-50 mr-2">[{log.timestamp}]</span>
            <span className="uppercase">{log.type} &gt;</span> {log.message}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default Terminal;