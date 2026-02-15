import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '@/lib/supabase';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const setFromMe = useAuthStore((s) => s.setFromMe);
  const [status, setStatus] = useState('Validando login...');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Supabase JS should pick up tokens from the URL automatically (detectSessionInUrl=true).
        const { data, error } = await supabase.auth.getSession();
        if (error || !data?.session) {
          setStatus('Sessao nao encontrada. Voltando para login...');
          setTimeout(() => navigate('/login', { replace: true }), 600);
          return;
        }

        const me = await authApi.getMe();
        if (!me.success || !(me.data as any)?.user) {
          throw new Error(me.error?.message || 'Falha ao carregar perfil');
        }

        if (!cancelled) {
          setFromMe(me.data as any);
          navigate('/dashboard', { replace: true });
        }
      } catch {
        setStatus('Falha ao validar login. Voltando para login...');
        setTimeout(() => navigate('/login', { replace: true }), 800);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, setFromMe]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
      <div className="text-sm">{status}</div>
    </div>
  );
}

