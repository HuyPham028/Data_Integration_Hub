'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, CheckSquare, Square } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SchemaInfo {
  tableName: string;
  recordsCount: number;
  status: string;
}

interface TableSelectProps {
  isOpen: boolean;
  onClose: () => void;
  schemas: SchemaInfo[];
  onStartSync: (selectedTables: string[]) => void;
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  startButtonLabel?: string;
}

const BackupSelect: React.FC<TableSelectProps> = ({
  isOpen,
  onClose,
  schemas,
  onStartSync,
  title = 'Select Tables to Sync',
  subtitle = 'Chỉ hiển thị các bảng đã chuẩn hóa (stable)',
  searchPlaceholder = 'Tìm kiếm tên bảng (VD: tcns_can_bo)...',
  startButtonLabel = 'Bắt đầu Sync',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTables, setSelectedTables] = useState<string[]>([]);

  const stableSchemas = useMemo(() => schemas.filter(s => s.status === 'stable'), [schemas]);

  const filteredSchemas = useMemo(() => {
    if (!searchQuery) return stableSchemas;
    return stableSchemas.filter(s => s.tableName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [stableSchemas, searchQuery]);

  const toggleTable = (tableName: string) => {
    setSelectedTables(prev => 
      prev.includes(tableName) 
        ? prev.filter(t => t !== tableName) 
        : [...prev, tableName]
    );
  };

  const handleSelectAll = () => {
    if (selectedTables.length === filteredSchemas.length) {
      setSelectedTables([]);
    } else {
      setSelectedTables(filteredSchemas.map(s => s.tableName)); // Chọn hết các bảng đang hiển thị
    }
  };

  const handleStart = () => {
    onStartSync(selectedTables);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-white rounded-xl shadow-2xl w-[92vw] max-w-6xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-4 border-b bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{title}</h2>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              type="text"
              placeholder={searchPlaceholder}
              className="pl-9 bg-slate-50 focus-visible:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex justify-between items-center text-sm">
            <button 
              onClick={handleSelectAll} 
              className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              {selectedTables.length === filteredSchemas.length && filteredSchemas.length > 0 ? (
                <><CheckSquare className="w-4 h-4 mr-1" /> Deselect All</>
              ) : (
                <><Square className="w-4 h-4 mr-1" /> Select All</>
              )}
            </button>
            <span className="text-slate-500">{selectedTables.length} / {stableSchemas.length} selected</span>
          </div>
        </div>

        {/* Danh sách bảng (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-2 bg-slate-50/50">
          {filteredSchemas.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">Không tìm thấy bảng nào phù hợp.</div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {filteredSchemas.map((schema) => (
                <li key={schema.tableName}>
                  <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTables.includes(schema.tableName) ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:border-slate-200'
                  }`}>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      checked={selectedTables.includes(schema.tableName)}
                      onChange={() => toggleTable(schema.tableName)}
                    />
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-semibold text-slate-800">{schema.tableName}</p>
                      {/* <p className="text-xs text-slate-500">~{schema.recordsCount} records</p> */}
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Huỷ</Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white" 
            disabled={selectedTables.length === 0}
            onClick={handleStart}
          >
            {startButtonLabel} ({selectedTables.length})
          </Button>
        </div>

      </div>
    </div>
  );
};

export default BackupSelect;