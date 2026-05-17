'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthAPI } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Lock, Mail, User } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';

export default function RegisterPage() {
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  
  // States cho form
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // States cho UI (Loading, Error, Success)
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // 1. Validate form ở phía Client
    if (password !== confirmPassword) {
      setError(t('reg.errMismatch'));
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t('reg.errLength'));
      setLoading(false);
      return;
    }

    // 2. Gọi API xuống NestJS
    try {
      await AuthAPI.register({ username, email, password });
      
      // Hiển thị thông báo thành công
      setSuccess(t('reg.success'));
      
      // Đợi 2 giây cho user đọc dòng chữ rồi tự động chuyển sang trang Login
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err: any) {
      // Bắt lỗi từ Backend (Ví dụ: Trùng email)
      setError(err.response?.data?.message || t('reg.errServer'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <button
        onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
        className="fixed top-4 right-4 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full transition-colors font-mono"
      >
        {lang === 'vi' ? 'EN' : 'VI'}
      </button>

      <Card className="w-full max-w-md shadow-2xl border-slate-700 bg-white">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">{t('reg.title')}</CardTitle>
          <CardDescription className="text-slate-500">{t('reg.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Vùng hiển thị lỗi */}
            {error && (
              <div className="p-3 text-sm font-medium text-red-600 bg-red-50 rounded-md border border-red-200">
                {error}
              </div>
            )}

            {/* Vùng hiển thị thành công */}
            {success && (
              <div className="p-3 text-sm font-medium text-green-600 bg-green-50 rounded-md border border-green-200">
                {success}
              </div>
            )}
            
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="text" placeholder={t('reg.namePlaceholder')} className="pl-9"
                  value={username} onChange={(e) => setUsername(e.target.value)} required disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="email" placeholder={t('reg.emailPlaceholder')} className="pl-9"
                  value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="password" placeholder={t('reg.passwordPlaceholder')} className="pl-9"
                  value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="password" placeholder={t('reg.confirmPlaceholder')} className="pl-9"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white" disabled={loading || success !== ''}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t('reg.submit')}
            </Button>
            
            <div className="text-center text-sm text-slate-500 mt-4">
              {t('reg.hasAccount')} <Link href="/login" className="text-blue-600 font-medium hover:underline">{t('reg.loginLink')}</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}