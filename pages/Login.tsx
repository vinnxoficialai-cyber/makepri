
import React, { useState } from 'react';
import { HeartHandshake, Mail, Lock, ArrowRight, AlertCircle, ShoppingBag } from 'lucide-react';
import { MOCK_USERS } from '../constants';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulation of API Call / Supabase
    setTimeout(() => {
        // Simple mock authentication logic
        const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (user) {
            onLogin(user);
        } else {
            setError('Acesso negado. Verifique seu e-mail e senha.');
            setIsLoading(false);
        }
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Orbes de fundo para profundidade */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

      <div className="w-full max-w-[420px] z-10 animate-in fade-in zoom-in-95 duration-700">
        {/* TÍTULO E ASSINATURA CENTRALIZADOS */}
        <div className="text-center mb-10">
          {/* Ícone com Degradê Suave */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-blue-500/20 p-[1px] mb-4 shadow-inner">
            <div className="w-full h-full bg-slate-950/40 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/5">
              <ShoppingBag className="text-pink-400" size={38} />
            </div>
          </div>

          {/* Nome do SaaS */}
          <h1 className="text-4xl font-black text-white mb-1 tracking-tighter">
            Pri <span className="text-pink-500">MAKE</span>
          </h1>

          {/* Assinatura Vinnx */}
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="h-[1px] w-4 bg-slate-800"></span>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
              By <span className="text-slate-300">Vinnx AI Solutions</span>
            </p>
            <span className="h-[1px] w-4 bg-slate-800"></span>
          </div>
          
          <p className="mt-4 text-slate-400 text-sm font-medium max-w-[280px] mx-auto">
            Sistema integrado de gestão para varejo, estoque e vendas.
          </p>
        </div>

        {/* Card do Formulário de Login */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                <AlertCircle className="text-rose-500 shrink-0" size={18} />
                <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">E-mail de Acesso</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pink-500 transition-colors" size={18} />
                <input 
                  required
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@primake.com"
                  className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/40 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pink-500 transition-colors" size={18} />
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/40 transition-all"
                />
              </div>
            </div>

            <div className="space-y-4">
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-pink-600 hover:bg-pink-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-pink-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Entrar no Sistema
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <button 
                type="button" 
                className="w-full text-center text-[10px] font-bold text-slate-500 hover:text-pink-500 uppercase tracking-widest transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center space-y-2">
           <p className="text-[10px] text-slate-600 font-medium">
             © 2025 Vinnx AI Solutions. Todos os direitos reservados.
           </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
