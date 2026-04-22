'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const AUTH_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Email ou mot de passe incorrect.',
  'Email already in use': 'Cet email est déjà utilisé.',
  'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères.',
  'User already registered': 'Un compte existe déjà avec cet email.',
  'Email not confirmed': 'Veuillez confirmer votre email avant de vous connecter.',
};

type Tab = 'login' | 'signup';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-parchment" />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/profile';
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const { error: authError } = await signIn(loginEmail, loginPassword);

    if (authError) {
      setError(AUTH_ERRORS[authError.message] || authError.message);
    } else {
      router.push(redirectTarget);
    }

    setLoading(false);
  };

  const handleSignup = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (signupPassword !== signupConfirm) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    if (signupPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      setLoading(false);
      return;
    }

    const { error: authError } = await signUp(signupEmail, signupPassword, signupName);

    if (authError) {
      setError(AUTH_ERRORS[authError.message] || authError.message);
    } else {
      setSuccess('Compte créé ! Vérifiez votre email ou connectez-vous directement.');
      setTab('login');
      setLoginEmail(signupEmail);
      setLoginPassword('');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex relative bg-midnight overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-midnight via-midnight/95 to-terracotta-900/30" />
        <div className="absolute top-20 right-10 opacity-20 rotate-12">
          <Image src="/branding/sticker-khamsa.png" alt="" width={120} height={120} />
        </div>
        <div className="absolute bottom-32 left-8 opacity-15 -rotate-6">
          <Image src="/branding/sticker-tea.png" alt="" width={90} height={90} />
        </div>

        <div className="relative z-10">
          <Link href="/">
            <Image
              src="/branding/hkeyetna1.png"
              alt="HKEYETNA"
              width={160}
              height={60}
              className="brightness-0 invert"
            />
          </Link>
        </div>

        <div className="relative z-10 max-w-sm">
          <blockquote className="font-display text-3xl font-light text-white leading-snug mb-6">
            &quot;La Tunisie se découvre mieux quand le voyage est vôtre.&quot;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-0.5 bg-terracotta-400" />
            <span className="font-body text-white/50 text-sm">HKEYETNA Travel</span>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-6">
          {[
            { value: '50+', label: 'Destinations' },
            { value: '1000+', label: 'Voyageurs' },
            { value: 'IA', label: 'Itinéraires' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-display text-2xl font-semibold text-terracotta-400">{stat.value}</div>
              <div className="font-body text-xs text-white/40 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 md:px-12 bg-parchment min-h-screen">
        <Link href="/" className="flex items-center gap-2 text-midnight/50 hover:text-midnight font-body text-sm mb-8 md:hidden transition-colors">
          <ArrowLeft size={16} />
          Retour à l&apos;accueil
        </Link>

        <div className="max-w-md w-full mx-auto">
          <div className="flex bg-sand-100 rounded-2xl p-1 mb-8">
            {(['login', 'signup'] as Tab[]).map((currentTab) => (
              <button
                key={currentTab}
                onClick={() => {
                  setTab(currentTab);
                  setError('');
                  setSuccess('');
                }}
                className={`flex-1 py-2.5 rounded-xl font-body font-semibold text-sm transition-all ${
                  tab === currentTab ? 'bg-white text-midnight shadow-sm' : 'text-midnight/50 hover:text-midnight'
                }`}
              >
                {currentTab === 'login' ? 'Connexion' : 'Créer un compte'}
              </button>
            ))}
          </div>

          <div className="mb-8">
            <h1 className="font-display text-4xl font-light text-midnight mb-2">
              {tab === 'login' ? 'Bon retour ✦' : 'Rejoignez-nous'}
            </h1>
            <p className="font-body text-midnight/50 text-sm">
              {tab === 'login'
                ? 'Connectez-vous pour accéder à vos voyages.'
                : 'Créez votre compte pour sauvegarder vos itinéraires.'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {(error || success) && (
              <motion.div
                key={`${error}-${success}`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`text-sm font-body px-4 py-3 rounded-2xl mb-6 ${
                  error
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-olive-50 border border-olive-200 text-olive-700'
                }`}
              >
                {error || success}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {tab === 'login' ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight/30" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    placeholder="Votre email"
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-sand-200 rounded-2xl font-body text-sm text-midnight placeholder-midnight/30 focus:outline-none focus:border-terracotta-400 transition-colors"
                  />
                </div>

                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    placeholder="Mot de passe"
                    className="w-full pl-11 pr-12 py-3.5 bg-white border border-sand-200 rounded-2xl font-body text-sm text-midnight placeholder-midnight/30 focus:outline-none focus:border-terracotta-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-midnight/30 hover:text-midnight/60"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Connexion…' : 'Se connecter'}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSignup}
                className="space-y-4"
              >
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight/30" />
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(event) => setSignupName(event.target.value)}
                    placeholder="Prénom et nom"
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-sand-200 rounded-2xl font-body text-sm text-midnight placeholder-midnight/30 focus:outline-none focus:border-terracotta-400 transition-colors"
                  />
                </div>

                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight/30" />
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(event) => setSignupEmail(event.target.value)}
                    placeholder="Votre email"
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-sand-200 rounded-2xl font-body text-sm text-midnight placeholder-midnight/30 focus:outline-none focus:border-terracotta-400 transition-colors"
                  />
                </div>

                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={signupPassword}
                    onChange={(event) => setSignupPassword(event.target.value)}
                    placeholder="Mot de passe (min. 6 caractères)"
                    className="w-full pl-11 pr-12 py-3.5 bg-white border border-sand-200 rounded-2xl font-body text-sm text-midnight placeholder-midnight/30 focus:outline-none focus:border-terracotta-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-midnight/30 hover:text-midnight/60"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight/30" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={signupConfirm}
                    onChange={(event) => setSignupConfirm(event.target.value)}
                    placeholder="Confirmer le mot de passe"
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-sand-200 rounded-2xl font-body text-sm text-midnight placeholder-midnight/30 focus:outline-none focus:border-terracotta-400 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Création…' : 'Créer mon compte'}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-8 text-center">
            <Link href="/" className="font-body text-sm text-midnight/40 hover:text-midnight/70 transition-colors">
              ← Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
