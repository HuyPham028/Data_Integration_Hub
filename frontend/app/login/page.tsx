'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthAPI } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Lock, Mail, User } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await AuthAPI.login({ username, password });
      // Lưu token vào Local Storage
      localStorage.setItem('access_token', response.accessToken);
      if (response.user) {
        localStorage.setItem('user_info', JSON.stringify(response.user));
      }
      
      // Chuyển hướng về Dashboard
      window.location.href = '/'; // Dùng window.location để force reload layout
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">University Integration Hub</CardTitle>
          <CardDescription>Đăng nhập hệ thống quản trị ETL</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">{error}</div>}
            
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  type="text" placeholder="username_123" className="pl-9"
                  value={username} onChange={(e) => setUsername(e.target.value)} required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  type="password" placeholder="••••••••" className="pl-9"
                  value={password} onChange={(e) => setPassword(e.target.value)} required
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Đăng nhập"}
            </Button>
            
            <div className="text-center text-sm text-slate-500 mt-4">
              Chưa có tài khoản Admin? <Link href="/register" className="text-blue-600 hover:underline">Tạo mới</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}