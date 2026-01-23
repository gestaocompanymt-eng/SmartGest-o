
import React, { useState } from 'react';
import { Wrench, Shield, Key, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { getStore } from '../store';
import { User } from '../types';

const Login: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const data = getStore();
    
    // Procura o usuário ignorando maiúsculas/minúsculas
    const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (user) {
      // Validação específica para o admin conforme solicitado
      if (user.email.toLowerCase() === 'admin') {
        if (password === '123') {
          onLogin(user);
        } else {
          setError('Senha incorreta para o perfil de administrador.');
        }
      } else {
        // Para outros usuários (técnicos), permite acesso direto nesta versão demo
        onLogin(user);
      }
    } else {
      setError('Usuário não encontrado. Tente "admin"');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 z-10 relative">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-slate-900 p-4 rounded-2xl shadow-xl shadow-blue-500/10 mb-6">
            <Wrench size={40} className="text-blue-500" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">SMARTGESTÃO</h1>
          <p className="text-slate-500 mt-2 font-medium">Gestão Técnica e Manutenção Condominial</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700 ml-1">Usuário / E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: admin"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between ml-1">
               <label className="text-sm font-bold text-slate-700">Senha</label>
               <button type="button" className="text-xs font-bold text-blue-600 hover:underline">Esqueceu?</button>
            </div>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium" 
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500 font-bold text-center bg-red-50 p-2 rounded-lg">{error}</p>}

          <button 
            type="submit" 
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center group"
          >
            ACESSAR PLATAFORMA
            <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100">
           <div className="flex items-center justify-center space-x-2 text-slate-400 mb-4">
              <Shield size={14} />
              <span className="text-xs font-bold uppercase tracking-widest">Acesso Restrito</span>
           </div>
           <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start space-x-3">
              <div className="bg-white p-2 rounded-lg text-blue-500 shadow-sm">
                 <Sparkles size={16} />
              </div>
              <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                Utilize o usuário <span className="font-bold">admin</span> e senha <span className="font-bold">123</span> para testar.
              </p>
           </div>
        </div>
      </div>

      <div className="mt-8 text-center text-slate-500 text-xs font-medium z-10">
        &copy; {new Date().getFullYear()} SmartGestão Sistemas de Manutenção. v2.4.0
      </div>
    </div>
  );
};

export default Login;
