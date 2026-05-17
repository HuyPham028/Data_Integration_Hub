'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Search, CheckSquare, Square } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SchemaInfo {
  tableName: string;
  recordsCount: number;
  status: string;
}

interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  schemas: SchemaInfo[];
  onSave: (data: any) => Promise<void>;
  initialData?: any;
}

function getFrequencyName(cron: string) {
  if (!cron) return "Custom";
  if (cron === "0 * * * *") return "Hourly";
  if (cron.startsWith("0 0")) return "Midnight";
  if (cron.startsWith("0 2")) return "Nightly";
  if (cron.endsWith("* * 0") || cron.endsWith("* * 6")) return "Weekly";
  if (cron.includes("* * *")) return "Daily";
  return "Scheduled";
}

function generateJobName(jobType: string, cron: string, tables: string[]) {
  const freq = getFrequencyName(cron);
  let target = jobType === "FULL_SYNC" ? "All-Tables" : "0-Tables";
  
  if (jobType === 'CUSTOM_SYNC' && tables.length > 0) {
    target = tables.length <= 2 ? tables.join("-and-") : `${tables.length}-Tables`;
  }
  return `${freq}-${jobType}-${target}`;
}

export default function JobModal({ isOpen, onClose, schemas, onSave, initialData }: JobModalProps) {
  const [jobName, setJobName] = useState('');
  const [description, setDescription] = useState('');
  const [cronExpression, setCronExpression] = useState('0 0 * * *');
  const [jobType, setJobType] = useState('FULL_SYNC');
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Track if user manually typed a name so we stop auto-generating
  const [isManuallyEdited, setIsManuallyEdited] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setJobName(initialData.jobName || '');
        setDescription(initialData.description || '');
        setCronExpression(initialData.cronExpression || '0 0 * * *');
        setJobType(initialData.jobType || 'FULL_SYNC');
        setSelectedTables(initialData.targetTables || []);
        setIsManuallyEdited(true); // Don't auto-rename existing jobs
      } else {
        setJobName('');
        setDescription('');
        setCronExpression('0 0 * * *');
        setJobType('FULL_SYNC');
        setSelectedTables([]);
        setIsManuallyEdited(false); // Enable auto-gen for new jobs
      }
      setError('');
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    // Only auto-generate if we are NOT editing an existing job, 
    // and the user hasn't typed a custom name yet.
    if (!initialData && !isManuallyEdited) {
      setJobName(generateJobName(jobType, cronExpression, selectedTables));
    }
  }, [jobType, cronExpression, selectedTables, isManuallyEdited, initialData]);

  const stableSchemas = useMemo(() => schemas.filter(s => s.status === 'stable'), [schemas]);
  const filteredSchemas = useMemo(() => {
    if (!searchQuery) return stableSchemas;
    return stableSchemas.filter(s => s.tableName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [stableSchemas, searchQuery]);

  const toggleTable = (tableName: string) => {
    setSelectedTables(prev => 
      prev.includes(tableName) ? prev.filter(t => t !== tableName) : [...prev, tableName]
    );
  };

  const handleSelectAll = () => {
    if (selectedTables.length === filteredSchemas.length) {
      setSelectedTables([]);
    } else {
      setSelectedTables(filteredSchemas.map(s => s.tableName));
    }
  };

  const handleSave = async () => {
    try {
      if (!jobName.trim() || !cronExpression.trim()) {
        setError("Vui lòng điền tên job và cron expression");
        return;
      }
      if (jobType === 'CUSTOM_SYNC' && selectedTables.length === 0) {
        setError("Vui lòng chọn ít nhất 1 bảng");
        return;
      }

      setLoading(true);
      setError('');
      await onSave({
        jobName,
        description,
        cronExpression,
        jobType,
        targetTables: jobType === 'CUSTOM_SYNC' ? selectedTables : [],
        isActive: initialData ? initialData.isActive : true
      });
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl shadow-2xl w-[92vw] max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-4 border-b bg-slate-50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{initialData ? 'Chỉnh sửa Job' : 'Thêm Job Mới'}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded text-sm">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Tên Job (Tự động tạo)</label>
            <Input 
              value={jobName} 
              onChange={e => {
                setJobName(e.target.value);
                setIsManuallyEdited(true); // Stop auto-generating if user types manually
              }} 
              placeholder="Vd: daily-sync-users" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Mô tả</label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Vd: Đồng bộ users mỗi ngày..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Biểu thức Cron</label>
              <Input value={cronExpression} onChange={e => setCronExpression(e.target.value)} placeholder="* * * * *" />
              <div className="text-xs text-slate-500">
                Gợi ý: <code>0 * * * *</code> (mỗi giờ), <code>0 0 * * *</code> (mỗi ngày)
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Loại Job</label>
              <select 
                className="w-full flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                value={jobType} 
                onChange={e => setJobType(e.target.value)}
              >
                <option value="FULL_SYNC">Full Sync</option>
                <option value="CUSTOM_SYNC">Custom Sync</option>
              </select>
            </div>
          </div>

          {jobType === 'CUSTOM_SYNC' && (
            <div className="space-y-3 pt-2 border-t mt-4">
              <label className="text-sm font-semibold text-slate-700">Chọn bảng cần đồng bộ</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  type="text"
                  placeholder="Tìm bảng..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex justify-between items-center text-sm">
                <button 
                  onClick={handleSelectAll} 
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  {selectedTables.length === filteredSchemas.length && filteredSchemas.length > 0 ? (
                    <><CheckSquare className="w-4 h-4 mr-1" /> Bỏ chọn tất cả</>
                  ) : (
                    <><Square className="w-4 h-4 mr-1" /> Chọn tất cả</>
                  )}
                </button>
                <span className="text-slate-500">{selectedTables.length} bảng đã chọn</span>
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredSchemas.map((schema) => (
                  <label key={schema.tableName} className="flex items-center p-2 rounded hover:bg-slate-50 cursor-pointer text-sm">
                    <input 
                      type="checkbox" 
                      className="mr-2"
                      checked={selectedTables.includes(schema.tableName)}
                      onChange={() => toggleTable(schema.tableName)}
                    />
                    {schema.tableName}
                  </label>
                ))}
                {filteredSchemas.length === 0 && (
                  <div className="col-span-2 text-center py-4 text-slate-400 text-sm">Không tìm thấy bảng.</div>
                )}
              </div>
            </div>
          )}

        </div>

        <div className="p-4 border-t bg-slate-50 flex justify-end gap-2 shrink-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>Huỷ</Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white" 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Đang lưu...' : 'Lưu Job'}
          </Button>
        </div>

      </div>
    </div>
  );
}