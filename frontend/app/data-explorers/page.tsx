'use client';

import { useEffect, useState } from 'react';
import { ReaderAPI } from '@/lib/api-client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Search, LayoutGrid, FileDown, Loader2, ChevronLeft, ChevronRight, Lock } from "lucide-react";

export default function DataExplorerPage() {
  // States cho danh sách bảng
  const [allowedTables, setAllowedTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [loadingTables, setLoadingTables] = useState(true);

  // States cho Dữ liệu của bảng đang chọn
  const [tableData, setTableData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  // Pagination & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 1. Load danh sách bảng khi vào trang
  useEffect(() => {
    const fetchTables = async () => {
      const tables = await ReaderAPI.getAllowedTables();
      setAllowedTables(tables);
      setLoadingTables(false);
      // Mặc định chọn bảng đầu tiên nếu có
      if (tables.length > 0) setSelectedTable(tables[0]);
    };
    fetchTables();
  }, []);

  // 2. Load dữ liệu khi đổi Bảng, đổi Trang, hoặc Tìm kiếm
  useEffect(() => {
    if (!selectedTable) return;
    
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const response = await ReaderAPI.getTableData(selectedTable.id, currentPage, searchTerm);
        setColumns(response.columns);
        setTableData(response.data);
        setTotalPages(response.metadata.totalPages);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu");
      } finally {
        setLoadingData(false);
      }
    };

    // Debounce search (Chờ người dùng gõ xong mới gọi API)
    const delayDebounce = setTimeout(() => {
      fetchData();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [selectedTable, currentPage, searchTerm]);

  // Hàm helper đổi Bảng
  const handleSelectTable = (table: any) => {
    setSelectedTable(table);
    setCurrentPage(1); // Reset page về 1
    setSearchTerm(''); // Xóa search cũ
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6">
      
      {/* CỘT TRÁI: Danh sách bảng được cấp quyền */}
      <Card className="w-1/4 flex flex-col border-slate-200 h-full overflow-hidden">
        <CardHeader className="bg-slate-50 border-b py-4">
          <CardTitle className="text-lg flex items-center text-slate-800">
            <Lock className="w-4 h-4 mr-2 text-green-600" /> Quyền truy cập
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 overflow-y-auto flex-1">
          {loadingTables ? (
             <div className="flex justify-center p-4"><Loader2 className="animate-spin w-5 h-5 text-blue-500" /></div>
          ) : (
            <div className="space-y-1">
              {allowedTables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => handleSelectTable(table)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedTable?.id === table.id 
                      ? 'bg-blue-50 border border-blue-200 shadow-sm' 
                      : 'hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center font-semibold text-sm text-slate-800">
                    <Database className={`w-4 h-4 mr-2 ${selectedTable?.id === table.id ? 'text-blue-600' : 'text-slate-400'}`} />
                    {table.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 pl-6 line-clamp-1">{table.description}</div>
                </button>
              ))}
              {allowedTables.length === 0 && (
                <div className="text-center p-4 text-sm text-slate-500">Tài khoản chưa được cấp quyền xem bảng nào.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CỘT PHẢI: Hiển thị Dữ liệu */}
      <Card className="flex-1 flex flex-col border-slate-200 h-full overflow-hidden">
        {selectedTable ? (
          <>
            {/* Toolbar: Tiêu đề & Search */}
            <CardHeader className="border-b py-4 bg-white flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-xl flex items-center">
                  <LayoutGrid className="mr-2 h-5 w-5 text-blue-600" /> {selectedTable.name}
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">Nguồn dữ liệu: Master Hub ({selectedTable.id})</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    type="text" 
                    placeholder="Tìm kiếm dữ liệu..." 
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1); // Gõ search thì quay về trang 1
                    }}
                  />
                </div>
                <Button variant="outline" className="text-slate-600">
                  <FileDown className="w-4 h-4 mr-2" /> Export CSV
                </Button>
              </div>
            </CardHeader>

            {/* Khung chứa Bảng (Có thanh cuộn ngang nếu nhiều cột) */}
            <CardContent className="flex-1 p-0 overflow-auto bg-slate-50 relative">
              {loadingData ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : null}

              <Table className="bg-white min-w-max">
                <TableHeader className="bg-slate-100 sticky top-0 z-0">
                  <TableRow>
                    {columns.map((col, idx) => (
                      <TableHead key={idx} className="font-bold text-slate-700 uppercase text-xs">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.length > 0 ? (
                    tableData.map((row, rowIndex) => (
                      <TableRow key={rowIndex} className="hover:bg-blue-50/50">
                        {columns.map((col, colIndex) => (
                          <TableCell key={colIndex} className="text-slate-700">
                            {/* Format boolean đẹp mắt */}
                            {typeof row[col] === 'boolean' ? (
                              <Badge variant={row[col] ? "default" : "secondary"} className={row[col] ? "bg-green-500" : ""}>
                                {row[col] ? "True" : "False"}
                              </Badge>
                            ) : (
                              row[col] || <span className="text-slate-300 italic">null</span>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length || 1} className="h-32 text-center text-slate-500">
                        Không tìm thấy dữ liệu khớp với "{searchTerm}".
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>

            {/* Pagination */}
            <div className="border-t bg-white p-4 flex items-center justify-between">
              <div className="text-sm text-slate-500">
                Trang <span className="font-bold text-slate-800">{currentPage}</span> / {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" size="sm" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loadingData}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                </Button>
                <Button 
                  variant="outline" size="sm" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || loadingData}
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Database className="w-16 h-16 mb-4 text-slate-200" />
            <p>Chọn một bảng bên trái để xem dữ liệu</p>
          </div>
        )}
      </Card>
    </div>
  );
}