'use client';

import { useEffect, useState, useMemo } from 'react';
import { IntegrationAPI } from '@/lib/api-client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Loader2, Server, AlertTriangle, CheckCircle, 
  Copy, Check, ArrowRight, FileJson
} from "lucide-react";

// --- CÁC HÀM LOGIC XỬ LÝ DIFF & PRISMA GENERATOR ---

// 1. Hàm tính toán Diff (GitHub Style)
const calculateDiff = (newFields: any[] = [], oldFields: any[] = []) => {
  const diff: any[] = [];
  const oldMap = new Map(oldFields.map(f => [f.name, f]));
  const newMap = new Map(newFields.map(f => [f.name, f]));

  // Quét các trường mới (Added, Changed, Unchanged)
  newFields.forEach(newF => {
    const oldF = oldMap.get(newF.name);
    if (!oldF) {
      diff.push({ name: newF.name, status: 'added', new: newF, old: null });
    } else if (oldF.type !== newF.type || oldF.length !== newF.length) {
      diff.push({ name: newF.name, status: 'changed', new: newF, old: oldF });
    } else {
      diff.push({ name: newF.name, status: 'unchanged', new: newF, old: oldF });
    }
  });

  // Quét các trường bị xóa (Removed)
  oldFields.forEach(oldF => {
    if (!newMap.has(oldF.name)) {
      diff.push({ name: oldF.name, status: 'removed', new: null, old: oldF });
    }
  });

  return diff;
};

// 2. Hàm chuyển đổi type JSON sang Prisma type
const mapTypeToPrisma = (type: string, length: number | null) => {
  const t = type.toLowerCase();
  if (t.includes('varchar') || t.includes('string') || t.includes('text')) {
    return `String? ${length ? `@db.VarChar(${length})` : ''}`.trim();
  }
  if (t.includes('int')) return 'Int?';
  if (t.includes('bit') || t.includes('boolean')) return 'Boolean?';
  if (t.includes('datetime') || t.includes('date')) return 'DateTime?';
  return 'String?'; // Default fallback
};

// 3. Hàm Auto-generate Prisma Model
const generatePrismaModel = (tableName: string, fields: any[]) => {
  const modelName = tableName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  let code = `model ${modelName} {\n`;
  code += `  id String @id @default(uuid())\n`; // Default Hub ID
  fields.forEach(f => {
    if (f.name !== 'id') { // Bỏ qua id nếu API trả về để tránh trùng lặp, hoặc tự custom
      code += `  ${f.name.padEnd(20)} ${mapTypeToPrisma(f.type, f.length)}\n`;
    }
  });
  code += `\n  @@map("${tableName}")\n}`;
  return code;
};

// --- COMPONENT CHÍNH ---

export default function SchemaRegistryPage() {
  const [schemas, setSchemas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State Review Modal
  const [selectedSchema, setSelectedSchema] = useState<any | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Fetch Data
  const fetchSchemas = async () => {
    setLoading(true);
    try {
      const data = await IntegrationAPI.getSchemas();
      setSchemas(data);
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchemas(); }, []);

  const handleResolve = async () => {
    if (!selectedSchema) return;
    setIsResolving(true);
    try {
      await IntegrationAPI.resolveSchema(selectedSchema.tableName);
      setSelectedSchema(null);
      await fetchSchemas();
    } finally {
      setIsResolving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Tính toán Diff realtime khi mở Modal
  const diffData = useMemo(() => {
    if (!selectedSchema) return { diff: [], stats: { added: 0, removed: 0, changed: 0 } };
    const oldData = selectedSchema.oldDetails?.[selectedSchema.oldDetails.length - 1] || [];
    const diff = calculateDiff(selectedSchema.details, oldData);
    
    return {
      diff,
      stats: {
        added: diff.filter(d => d.status === 'added').length,
        removed: diff.filter(d => d.status === 'removed').length,
        changed: diff.filter(d => d.status === 'changed').length,
      }
    };
  }, [selectedSchema]);

  const hasBreakingChange = diffData.stats.removed > 0 || diffData.stats.changed > 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Governance: Schema Review</h1>
        <p className="text-slate-500 mt-1">Phát hiện và đối soát sự thay đổi cấu trúc dữ liệu từ nguồn.</p>
      </div>

      {/* Bảng danh sách Schema */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b pb-4">
          <CardTitle className="text-lg">Metadata Models</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
             <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="pl-6">Tên Bảng (Entity)</TableHead>
                  <TableHead>Nguồn</TableHead>
                  <TableHead>Số Trường</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schemas.map((schema) => (
                  <TableRow key={schema._id} className="hover:bg-slate-50/50">
                    <TableCell className="pl-6 font-mono text-sm font-semibold text-slate-700">
                      {schema.tableName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-white text-slate-500 border-slate-200">
                        <Server className="w-3 h-3 mr-1"/> {schema.dataFrom || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">{schema.fieldsCount} fields</TableCell>
                    <TableCell>
                      {schema.status === 'stable' && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50"><CheckCircle className="w-3 h-3 mr-1"/> Stable</Badge>}
                      {schema.status === 'new' && <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50"><FileJson className="w-3 h-3 mr-1"/> New Model</Badge>}
                      {schema.status === 'changed' && <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50"><AlertTriangle className="w-3 h-3 mr-1"/> Schema Drift</Badge>}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      {schema.status !== 'stable' ? (
                        <Button 
                          size="sm" 
                          className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
                          onClick={() => setSelectedSchema(schema)}
                        >
                          Review Diff <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      ) : (
                        <span className="text-xs font-medium text-slate-400">Synced</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* GitHub-style Diff Modal */}
      <Dialog open={selectedSchema !== null} onOpenChange={(open) => !open && setSelectedSchema(null)}>
        <DialogContent className="sm:max-w-5xl p-0 overflow-hidden bg-white shadow-2xl border-slate-200 sm:rounded-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          
          {/* Header */}
          <div className="p-6 border-b bg-white flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl flex items-center gap-2 font-bold text-slate-900">
                Schema Diff: <span className="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{selectedSchema?.tableName}</span>
              </DialogTitle>
              <DialogDescription className="mt-2 text-slate-500">
                Đối chiếu thay đổi giữa API hệ thống nguồn và Prisma Schema hiện tại.
              </DialogDescription>
              
              {/* Summary Bar */}
              <div className="flex gap-3 text-xs mt-4 font-medium">
                {diffData.stats.added > 0 && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0">+{diffData.stats.added} Added</Badge>}
                {diffData.stats.removed > 0 && <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 border-0">-{diffData.stats.removed} Removed</Badge>}
                {diffData.stats.changed > 0 && <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-0">~{diffData.stats.changed} Changed</Badge>}
                {diffData.stats.added === 0 && diffData.stats.removed === 0 && diffData.stats.changed === 0 && (
                   <Badge className="bg-slate-100 text-slate-600 border-0">New Initialization</Badge>
                )}
              </div>
            </div>

            {/* Nút Copy Prisma Model */}
            <Button 
              variant="outline" size="sm" 
              className="border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100"
              onClick={() => copyToClipboard(generatePrismaModel(selectedSchema?.tableName, selectedSchema?.details))}
            >
              {isCopied ? <Check className="w-4 h-4 mr-2 text-emerald-600" /> : <Copy className="w-4 h-4 mr-2" />}
              {isCopied ? 'Copied Model!' : 'Copy Prisma Code'}
            </Button>
          </div>

          {/* Content (Scrollable Diff Area) */}
          <div className="p-6 max-h-[60vh] overflow-y-auto bg-slate-50/50">
            
            {/* Breaking Change Warning */}
            {hasBreakingChange && (
              <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-rose-800">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Cảnh báo Breaking Change!</h4>
                  <p className="text-xs mt-1 opacity-90">Có trường dữ liệu bị xóa hoặc thay đổi kiểu type. Việc đồng bộ có thể làm mất dữ liệu cũ trong PostgreSQL. Hãy kiểm tra kỹ Prisma migration.</p>
                </div>
              </div>
            )}

            {/* Side-by-side Diff Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="grid grid-cols-2 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 border-b border-slate-200">
                <div className="p-3 pl-4 border-r border-slate-200 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Cấu trúc mới (API)</div>
                <div className="p-3 pl-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-400"></div> Cấu trúc cũ (DB)</div>
              </div>

              <div className="divide-y divide-slate-100 text-sm">
                {diffData.diff.map((row) => (
                  <div key={row.name} className="grid grid-cols-2">
                    
                    {/* NEW COLUMN */}
                    <div className={`p-3 pl-4 flex justify-between items-center border-r border-slate-200 ${
                      row.status === 'added' ? 'bg-emerald-100' : 
                      row.status === 'changed' ? 'bg-blue-200' : ''
                    }`}>
                      {row.new ? (
                        <>
                          <span className="font-mono font-medium text-slate-900">{row.new.name}</span>
                          <span className="text-slate-500 text-xs bg-white px-2 py-1 rounded-md border border-slate-100">{row.new.type} {row.new.length ? `(${row.new.length})` : ''}</span>
                        </>
                      ) : (
                        <span className="text-slate-300 italic">-- removed --</span>
                      )}
                    </div>

                    {/* OLD COLUMN */}
                    <div className={`p-3 pl-4 flex justify-between items-center ${
                      row.status === 'removed' ? 'bg-rose-50/50' : 
                      row.status === 'changed' ? 'bg-amber-50/50' : ''
                    }`}>
                      {row.old ? (
                        <>
                          <span className="font-mono text-slate-600 line-through decoration-slate-300 opacity-80">{row.old.name}</span>
                          <span className="text-slate-400 text-xs">{row.old.type} {row.old.length ? `(${row.old.length})` : ''}</span>
                        </>
                      ) : (
                        <span className="text-slate-300 italic">-- not existed --</span>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-200 bg-white flex justify-between items-center">
             <p className="text-sm text-slate-500 flex items-center">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 mr-2 text-xs font-bold">!</span>
                Hãy đảm bảo bạn đã chạy <code className="mx-1 px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded">npx prisma db push</code> trước khi xác nhận.
             </p>
            <Button 
              size="lg"
              onClick={handleResolve} 
              disabled={isResolving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm px-6"
            >
              {isResolving ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <CheckCircle className="w-5 h-5 mr-2"/>}
              Sync Schema
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}