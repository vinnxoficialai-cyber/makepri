import React, { useState } from 'react';
import { ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserService } from '../lib/database';
import { User } from '../types';

interface LoginProps {
    onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
            if (authError) throw authError;
            if (authData.user && authData.user.email) {
                let userProfile = await UserService.getByEmail(authData.user.email);
                if (!userProfile) {
                    try {
                        userProfile = await UserService.create({
                            name: authData.user.user_metadata?.name || authData.user.email.split('@')[0],
                            email: authData.user.email,
                            role: 'Vendedor' as any,
                            permissions: [],
                            active: true,
                            avatarUrl: ''
                        });
                    } catch {
                        throw new Error('Erro ao criar perfil. Contate o suporte.');
                    }
                }
                if (!userProfile.active) throw new Error('Acesso desativado. Contate seu gerente.');
                onLogin(userProfile);
            } else {
                throw new Error('Erro ao obter dados da autenticação.');
            }
        } catch (err: any) {
            setError(err.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : (err.message || 'Erro ao conectar.'));
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white px-6 relative font-sans">

            {/* Logo */}
            <img
                src="/icon-512.png"
                alt="PriMAKE"
                className="w-16 h-16 rounded-2xl mb-8 select-none"
            />

            {/* Title */}
            <h1 className="text-xl font-bold text-slate-900 mb-1 tracking-tight">
                Entrar no PriMAKE
            </h1>
            <p className="text-sm text-slate-400 mb-8">
                Insira suas credenciais para acessar
            </p>

            {/* Form card */}
            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2.5 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-4 py-3 animate-in fade-in duration-200">
                        <AlertCircle size={16} className="flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
                    <input
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                </div>

                {/* Password */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-medium text-slate-700">Senha</label>
                        <button type="button" className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                            Esqueceu?
                        </button>
                    </div>
                    <div className="relative">
                        <input
                            required
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Sua senha"
                            className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:brightness-110 active:scale-[0.98] disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-lg transition-all duration-150"
                >
                    {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>Entrar <ArrowRight size={15} /></>
                    )}
                </button>
            </form>

            {/* Footer */}
            <p className="absolute bottom-6 text-xs text-slate-300">
                &copy; {new Date().getFullYear()} Vinnx AI Solutions
            </p>
        </div>
    );
};

export default Login;