'use client';

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { apiClient } from "@/lib/api-client";
import { Plus, ArrowLeft, Download, RefreshCcw } from "lucide-react";
import { useState, useEffect } from "react";

export default function BackupPage() {
  // UI State
  const [activeTab, setActiveTab] = useState<'manual' | 'scheduled' | 'pre-sync' | 'schema-change'>('manual');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  
  // Data State
  const [backups, setBackups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Fetch Backups based on Tab
  const fetchBackups = async (tab: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/backup/list?prefix=${tab}/`);
      setBackups(response.data.backups || []);
    } catch (error) {
      console.error("Failed to fetch backups", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Run when component mounts or tab changes
  useEffect(() => {
    fetchBackups(activeTab);
    setSelectedTable(null); // Reset view when changing tabs
  }, [activeTab]);

  const uniqueTables = Array.from(
    new Set(backups.map((b) => b.key.split('/')[1]).filter(Boolean))
  );

  const selectedTableBackups = selectedTable 
    ? backups.filter((b) => b.key.includes(`/${selectedTable}/`))
    : [];

  // Actions
  const handleTriggerBackup = async () => {
    try {
      await apiClient.post('/backup/trigger', {});
      alert("Đã bắt đầu backup thủ công!");
      fetchBackups(activeTab);
    } catch (error) {
      alert("Lỗi khi tạo backup.");
    }
  };

  const handleDownload = async (key: string) => {
    try {
      const response = await apiClient.post('/backup/download', { key });
      window.open(response.data.url, '_blank'); // Open presigned URL
    } catch (error) {
      alert("Lỗi khi lấy link tải.");
    }
  };

  const handleRestore = async (key: string) => {
    const isConfirm = window.confirm("Bạn có chắc chắn muốn khôi phục bản sao lưu này? Dữ liệu hiện tại sẽ bị ghi đè.");
    if (!isConfirm) return;

    try {
      await apiClient.post('/backup/restore', { key });
      alert("Khôi phục dữ liệu thành công!");
    } catch (error) {
      alert("Lỗi khi khôi phục dữ liệu.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Quản lý Backup</h1>

      {/* Toolbar */}
      <div className="flex justify-between items-center">
        {/* Tabs */}
        <div className="flex justify-start gap-2 bg-gray-100 p-1 rounded-md">
          <button 
            onClick={() => setActiveTab('manual')} 
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'manual' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Manual
          </button>
          <button 
            onClick={() => setActiveTab('scheduled')} 
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'scheduled' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Scheduled
          </button>
          <button 
            onClick={() => setActiveTab('pre-sync')} 
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'pre-sync' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pre-sync
          </button>
          <button 
            onClick={() => setActiveTab('schema-change')} 
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'schema-change' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Schema Change
          </button>
        </div>

        {/* Action Button */}
        <button 
          onClick={handleTriggerBackup}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
        >
          <Plus size={18} />
          <span>Thêm backup</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="border rounded-md bg-white">
        
        {/* VIEW 1: Show List of Tables */}
        {!selectedTable && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên bảng (Table Name)</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={2} className="text-center py-4">Đang tải...</TableCell></TableRow>
              ) : uniqueTables.length === 0 ? (
                <TableRow><TableCell colSpan={2} className="text-center py-4">Không có dữ liệu</TableCell></TableRow>
              ) : (
                uniqueTables.map((tableName) => (
                  <TableRow 
                    key={tableName as string} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedTable(tableName as string)}
                  >
                    <TableCell className="font-medium">{tableName}</TableCell>
                    <TableCell className="text-right text-blue-600">Xem lịch sử</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {/* VIEW 2: Show Backup History for Selected Table */}
        {selectedTable && (
          <div>
            <div className="p-4 border-b flex items-center gap-4 bg-gray-50">
              <button 
                onClick={() => setSelectedTable(null)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-black"
              >
                <ArrowLeft size={16} /> Quay lại
              </button>
              <h2 className="font-semibold text-lg">Lịch sử backup: <span className="text-blue-600">{selectedTable}</span></h2>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên File Backup</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedTableBackups.map((backup) => {
                  // Extract filename from full path (e.g., "manual/users/file.json" -> "file.json")
                  const fileName = backup.key.split('/').pop(); 
                  const time = new Date(backup.lastModified).toLocaleString('vi-VN');

                  return (
                    <TableRow key={backup.key}>
                      <TableCell className="font-medium">{fileName}</TableCell>
                      <TableCell>{time}</TableCell>
                      <TableCell className="text-right space-x-3">
                        <button 
                          onClick={() => handleDownload(backup.key)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Tải xuống"
                        >
                          <Download size={18} className="inline" />
                        </button>
                        <button 
                          onClick={() => handleRestore(backup.key)}
                          className="text-orange-500 hover:text-orange-700"
                          title="Khôi phục"
                        >
                          <RefreshCcw size={18} className="inline" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}