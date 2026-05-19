'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthAPI } from '@/lib/api-client';
import { decodeJwtPayload } from '@/lib/auth-session'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Lock, User } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';

export default function LoginPage() {
  const { lang, setLang, t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const sessionExpired = searchParams.get('reason') === 'expired';

  const handleLogin = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await AuthAPI.login({ username, password });
      const token = response.accessToken;

      localStorage.setItem('access_token', token);
      
      const decodedUser = decodeJwtPayload(token);
      
      if (decodedUser) {
        localStorage.setItem('user_info', JSON.stringify(decodedUser));
      }
      
      const role = decodedUser?.role;

      window.location.href = role === 'admin' ? '/' : '/data-explorers';
      
    } catch (err: any) {
      setError(err.response?.data?.message || t('login.errServer'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      {/* Language toggle on login page */}
      <button
        onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
        className="fixed top-4 right-4 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full transition-colors font-mono"
      >
        {lang === 'vi' ? 'EN' : 'VI'}
      </button>

      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">University Integration Hub</CardTitle>
          <CardDescription>{t('login.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {sessionExpired && (
              <div className="p-3 text-sm text-amber-700 bg-amber-50 rounded-md border border-amber-200">
                {t('login.expired')}
              </div>
            )}

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
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t('login.submit')}
            </Button>
            
            {/* <div className="text-center text-sm text-slate-500 mt-4">
              {t('login.noAccount')} <Link href="/register" className="text-blue-600 hover:underline">{t('login.createNew')}</Link>
            </div> */}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}