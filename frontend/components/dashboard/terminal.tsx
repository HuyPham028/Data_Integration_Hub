'use client'

import { useState, type RefObject } from 'react';
import { MinusCircle, Terminal as TerminalIcon, Maximize2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface LogLine {
  timestamp: string;
  type: 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

type TerminalProps = {
  logs: LogLine[];
  terminalEndRef: RefObject<HTMLDivElement | null>;
  hostLabel?: string;
  heightClassName?: string;
};

const formatTime = (isoString: string) => {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-GB', { hour12: false });
  } catch {
    return "00:00:00";
  }
};

export function Terminal({
  logs,
  terminalEndRef,
  hostLabel = 'root@univ-hub-server:~',
  heightClassName = 'h-[42vh]',
}: TerminalProps) {
  const [isOpen, setIsOpen] = useState(true);

  const toggleTerminal = () => setIsOpen(!isOpen);

  if (!isOpen) {
    return (
      <div 
        onClick={toggleTerminal}
        className="flex justify-between items-center p-3 bg-slate-900 border border-slate-800 rounded-t-lg cursor-pointer hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center text-slate-300 text-sm font-mono">
          <TerminalIcon className="mr-3 h-4 w-4" /> {hostLabel}
        </div>
        <Maximize2 className="h-4 w-4 text-slate-400" />
      </div>
    );
  }

  return (
    <Card className="shrink-0 bg-slate-950 border-slate-800 shadow-xl overflow-hidden">
      <CardHeader className="bg-slate-900 border-b border-slate-800 py-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-slate-300 flex items-center text-sm font-mono">
            <TerminalIcon className="mr-3 h-4 w-4" /> {hostLabel}
          </CardTitle>
          <MinusCircle 
            className="h-5 w-5 text-slate-500 cursor-pointer hover:text-slate-300" 
            onClick={toggleTerminal} 
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className={`${heightClassName} overflow-y-auto p-4 font-mono text-sm tracking-tight leading-relaxed`}>
          {logs.length === 0 ? (
            <div className="text-slate-500 italic">Waiting for command...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="flex gap-3 mb-1 break-all">
                <span className="text-slate-500 shrink-0">[{formatTime(log.timestamp)}]</span>
                <span className={`shrink-0 w-12 font-bold ${
                    log.type === 'INFO' ? 'text-blue-400' :
                    log.type === 'WARN' ? 'text-yellow-400' : 'text-red-500'
                  }`}
                >
                  {log.type}
                </span>
                <span className={`flex-1 ${
                    log.type === 'ERROR' ? 'text-red-400' :
                    log.type === 'WARN' ? 'text-yellow-200' : 'text-green-400'
                  }`}
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>
      </CardContent>
    </Card>
  );
}