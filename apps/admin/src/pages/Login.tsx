import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { api, setToken } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Nfc, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.login(email.trim(), password);
      if (r.user.role !== 'admin') {
        toast.error('该账号不是管理员');
        return;
      }
      setToken(r.accessToken);
      toast.success('登录成功');
      nav('/');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '登录失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      {/* 背景光晕 */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-primary/5 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 0.9, 0.3, 1] }}
        className="relative w-full max-w-sm"
      >
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
            <Nfc size={22} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">NFC SaaS</h1>
            <p className="text-xs text-muted-foreground">管理后台 · 仅管理员</p>
          </div>
        </div>

        <Card className="border-border/60 bg-card/60 backdrop-blur">
          <CardContent className="pt-6">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs text-muted-foreground">
                  邮箱
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@nfc.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs text-muted-foreground">
                  密码
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                {busy ? '登录中…' : '登录'}
                {!busy && <ArrowRight className="size-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          默认账号 admin@nfc.local · 请上线前修改
        </p>
      </motion.div>
    </div>
  );
}
