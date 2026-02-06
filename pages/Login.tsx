
import React, { useState } from 'react';
import { Wrench, Shield, Key, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { getStore } from '../store';
import { User } from '../types';

const Login: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const data = getStore();
    const inputEmail = email.trim().toLowerCase();
    const inputPassword = password.trim();
    
    const user = data.users.find(u => u.email.toLowerCase() === inputEmail);
    
    if (user) {
      if (user.password === inputPassword) {
        onLogin(user);
      } else {
        setError('Senha inválida para este usuário.');
      }
    } else {
      setError(`Acesso "${inputEmail}" não reconhecido.`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 z-10 relative">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="bg-slate-900 p-4 rounded-2xl shadow-xl shadow-blue-500/10 mb-6">
            <Wrench size={40} className="text-blue-500" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">SMARTGESTÃO</h1>
          <p className="text-slate-500 mt-2 font-bold uppercase text-[10px] tracking-widest">Manutenção Inteligente</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Usuário</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome.sobrenome"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-bold text-sm" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type={showPassword ? "text" : "password"}
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-bold text-sm" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-[10px] text-red-600 font-black text-center bg-red-50 p-3 rounded-xl border border-red-100 uppercase tracking-tight">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-900/20 transition-all flex items-center justify-center group uppercase text-xs tracking-widest"
          >
            Acessar Terminal
            <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col items-center justify-center text-slate-300">
          <div className="flex items-center space-x-2 mb-1">
            <Shield size={10} />
            <span className="text-[8px] font-black uppercase tracking-widest">Protocolo Seguro SSL-256</span>
          </div>
          <p className="text-[9px] font-bold uppercase tracking-tighter opacity-50">
            by Adriano Pantaroto
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
