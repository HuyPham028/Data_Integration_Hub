'use client';

import { useEffect, useState } from 'react';
import { IntegrationAPI } from '@/lib/api-client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Server } from "lucide-react";

export default function SchemaRegistryPage() {
  const [schemas, setSchemas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchemas = async () => {
      try {
        const data = await IntegrationAPI.getSchemas();
        setSchemas(data);
      } catch (error) {
        console.error("Lỗi khi lấy schemas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSchemas();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Schema Registry</h1>
        <p className="text-slate-500">Quản lý cấu trúc dữ liệu (Metadata) từ các hệ thống nguồn.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Bảng Dữ liệu</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-500" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên Bảng (Table)</TableHead>
                  <TableHead>Nguồn API</TableHead>
                  <TableHead>Số Trường (Fields)</TableHead>
                  <TableHead>Số Record (Est.)</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schemas.map((schema) => (
                  <TableRow key={schema._id}>
                    <TableCell className="font-semibold">{schema.tableName}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-xs text-slate-500">
                        <Server className="w-3 h-3 mr-1"/> {schema.dataFrom}
                      </div>
                    </TableCell>
                    <TableCell>{schema.fieldsCount}</TableCell>
                    <TableCell>{schema.recordsCount}</TableCell>
                    <TableCell>
                      {/* Giả lập logic check: Nếu oldDetails có dữ liệu nghĩa là Schema đã bị thay đổi */}
                      {schema.oldDetails && schema.oldDetails.length > 0 ? (
                        <Badge variant="destructive">Cấu trúc thay đổi</Badge>
                      ) : (
                        <Badge className="bg-green-500">Khớp chuẩn</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {schemas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      Chưa có dữ liệu. Vui lòng chạy Import Schema từ Backend.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}