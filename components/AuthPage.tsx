import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Button } from './Button';
import { Input } from './Input';
import { ShieldCheck, ArrowRight, UserPlus, LogIn } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: unknown) {
      const firebaseError = err as AuthError;
      let message = "Ocorreu um erro inesperado.";
      if (firebaseError.code === 'auth/invalid-email') message = "E-mail inválido.";
      else if (firebaseError.code === 'auth/user-not-found') message = "Usuário não cadastrado.";
      else if (firebaseError.code === 'auth/wrong-password') message = "Senha incorreta.";
      else if (firebaseError.code === 'auth/email-already-in-use') message = "E-mail já está em uso.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8fafc]">
      <div className="max-w-md w-full animate-slide-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600 shadow-xl shadow-blue-200 mb-6">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">LocalFinder</h1>
          <p className="text-slate-500 mt-2 font-medium">Gestão inteligente de ativos de infraestrutura</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-4 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                isLogin ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <LogIn className="w-4 h-4" /> Entrar
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-4 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                !isLogin ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <UserPlus className="w-4 h-4" /> Criar Conta
            </button>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Seu melhor e-mail"
                type="email"
                placeholder="exemplo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl border-slate-200"
              />
              <Input
                label="Sua senha secreta"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-xl border-slate-200"
              />
              
              {error && (
                <div className="p-4 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-100 animate-pulse">
                  {error}
                </div>
              )}

              <Button type="submit" isLoading={loading} className="w-full h-12 text-base">
                {isLogin ? 'Acessar Plataforma' : 'Registrar Agora'}
                {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
              </Button>
            </form>
          </div>
        </div>
        
        <p className="text-center mt-8 text-slate-400 text-sm font-medium">
          © {new Date().getFullYear()} LocalFinder v2.0
        </p>
      </div>
    </div>
  );
};