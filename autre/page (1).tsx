'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/profile';

  const { signIn, signUp, user } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({ email: '', password: '', fullName: '' });

  useEffect(() => {
    if (user) router.push(redirectTo);
  }, [user, router, redirectTo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (mode === 'login') {
      const { error } = await signIn(form.email, form.password);
      if (error) {
        setError('Email ou mot de passe incorrect.');
      } else {
        router.push(redirectTo);
      }
    } else {
      if (!form.fullName.trim()) {
        setError('Veuillez entrer votre nom.');
        setLoading(false);
        return;
      }
      if (form.password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères.');
        setLoading(false);
        return;
      }
      const { error } = await signUp(form.email, form.password, form.fullName);
      if (error) {
        setError(error.message || 'Erreur lors de l\'inscription.');
      } else {
        setSuccess('Compte créé ! Vérifiez votre email pour confirmer votre inscription.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-28 pb-16">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Link href="/" className="inline-flex items-center gap-2 text-midnight/50 hover:text-midnight font-body text-sm mb-8 transition-colors">
          <ArrowLeft size={16} />
          Retour à l'accueil
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/90 backdrop-blur-sm rounded-4xl border border-sand-100 shadow-xl shadow-sand-500/10 p-8"
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-terracotta-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-display font-bold text-lg">H</span>
              </div>
              <span className="font-display text-2xl font-semibold text-midnight">HKEYETNA</span>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-sand-50 rounded-2xl p-1 mb-8">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                className={`flex-1 py-2.5 rounded-xl font-body text-sm font-semibold transition-all ${
                  mode === m
                    ? 'bg-white text-midnight shadow-sm'
                    : 'text-midnight/50 hover:text-midnight'
                }`}
              >
                {m === 'login' ? 'Connexion' : 'Créer un compte'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-olive-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✅</div>
                <p className="font-display text-xl text-midnight mb-2">Bienvenue !</p>
                <p className="font-body text-sm text-midnight/60">{success}</p>
                <button
                  onClick={() => { setSuccess(''); setMode('login'); }}
                  className="btn-primary mt-6"
                >
                  Se connecter
                </button>
              </motion.div>
            ) : (
              <motion.form
                key={mode}
                initial={{ opacity: 0, x: mode === 'login' ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {mode === 'register' && (
                  <div>
                    <label className="font-body text-sm font-semibold text-midnight block mb-1.5">
                      Nom complet
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight/30" />
                      <input
                        type="text"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        placeholder="Ahmed Ben Salah"
                        required
                        className="w-full bg-sand-50 border border-sand-200 rounded-2xl pl-11 pr-4 py-3.5 font-body text-sm text-midnight placeholder-midnight/30 focus:outline-none focus:border-terracotta-400 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="font-body text-sm font-semibold text-midnight block mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight/30" />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@email.com"
                      required
                      className="w-full bg-sand-50 border border-sand-200 rounded-2xl pl-11 pr-4 py-3.5 font-body text-sm text-midnight placeholder-midnight/30 focus:outline-none focus:border-terracotta-400 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-body text-sm font-semibold text-midnight block mb-1.5">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight/30" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder={mode === 'register' ? 'Min. 6 caractères' : '••••••••'}
                      required
                      className="w-full bg-sand-50 border border-sand-200 rounded-2xl pl-11 pr-12 py-3.5 font-body text-sm text-midnight placeholder-midnight/30 focus:outline-none focus:border-terracotta-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-midnight/30 hover:text-midnight/60 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm font-body text-red-500 bg-red-50 rounded-xl px-4 py-3"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles size={16} />
                      {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
                    </>
                  )}
                </button>

                {mode === 'login' && (
                  <p className="text-center font-body text-xs text-midnight/40 pt-1">
                    Pas encore de compte ?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="text-terracotta-500 hover:text-terracotta-600 font-semibold"
                    >
                      S'inscrire gratuitement
                    </button>
                  </p>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="text-center font-body text-xs text-midnight/30 mt-6">
          En vous connectant, vous acceptez nos{' '}
          <a href="#" className="hover:text-midnight/60 transition-colors">conditions d'utilisation</a>
        </p>
      </div>
    </div>
  );
}
