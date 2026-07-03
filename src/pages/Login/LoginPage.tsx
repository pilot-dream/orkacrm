import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import orkaLogo from '../../assets/orka_logo.png';
import loginBg from '../../assets/login_bg.png';
import { Sparkles, Mail, Lock, User } from 'lucide-react';
import { isSupabaseActive, supabase } from '../../shared/api/supabaseClient';
import { useAuthStore } from '../../entities/usuario/model/store';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isInitialized, isAuthenticated, navigate]);

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@orka.ai');
  const [password, setPassword] = useState('••••••••');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleModeChange = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setMessage(null);
    if (newMode === 'signup') {
      setEmail('');
      setPassword('');
    } else {
      setEmail('admin@orka.ai');
      setPassword('••••••••');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const targetPassword = password === '••••••••' ? 'admin123' : password; // default fallback if placeholders kept

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setMessage({ text: '⚠️ As senhas não coincidem.', type: 'error' });
        setLoading(false);
        return;
      }

      if (isSupabaseActive()) {
        try {
          const { error } = await supabase.auth.signUp({
            email,
            password: targetPassword,
            options: {
              data: {
                full_name: name
              }
            }
          });
          if (error) {
            setMessage({ text: `❌ Erro no cadastro: ${error.message}`, type: 'error' });
            setLoading(false);
            return;
          }
          setMessage({ text: '🎉 Conta criada com sucesso! Faça login abaixo.', type: 'success' });
          setMode('login');
          setPassword('');
          setConfirmPassword('');
          setLoading(false);
        } catch (err: any) {
          setMessage({ text: `❌ Ocorreu um erro: ${err.message || err}`, type: 'error' });
          setLoading(false);
        }
      } else {
        setTimeout(() => {
          setLoading(false);
          setMessage({ text: '🎉 Conta criada com sucesso (Modo Simulação)! Acessando...', type: 'success' });
          setTimeout(() => {
            login(email);
            navigate('/dashboard');
          }, 1200);
        }, 1000);
      }
    } else {
      // Login mode
      if (isSupabaseActive()) {
        try {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password: targetPassword
          });
          if (error) {
            setMessage({ text: `❌ Credenciais inválidas: ${error.message}`, type: 'error' });
            setLoading(false);
            return;
          }
          setLoading(false);
          login(email);
          navigate('/dashboard');
        } catch (err: any) {
          setMessage({ text: `❌ Ocorreu um erro: ${err.message || err}`, type: 'error' });
          setLoading(false);
        }
      } else {
        setTimeout(() => {
          setLoading(false);
          login(email);
          navigate('/dashboard');
        }, 1000);
      }
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setMessage({ 
      text: '🤖 Link de recuperação de senha enviado para ' + email + '!', 
      type: 'success' 
    });
  };

  return (
    <div className="login-container">
      <div 
        className="login-left" 
        style={{ backgroundImage: `url(${loginBg})` }}
      >
        <div className="login-left-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600, color: 'var(--color-primary)' }}>
              AI-First Command Center
            </span>
          </div>
          <h1 className="login-left-title">
            Automações & Inteligência Conectadas
          </h1>
          <p className="login-left-desc">
            Integre pipelines operacionais, analise leads em tempo real e orquestre agentes de linguagem em um único ecossistema centralizado.
          </p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-right-content">
          <div className="login-header">
            <img src={orkaLogo} alt="ORKA Logo" className="login-logo-img" />
            <div className="login-title-group">
              <h2 className="login-title">
                {mode === 'login' ? 'Bem-vindo ao ORKA CRM' : 'Crie sua Conta ORKA'}
              </h2>
              <p className="login-subtitle">
                {mode === 'login' 
                  ? 'Centralize toda sua operação em um único lugar.' 
                  : 'Cadastre-se e comece a automatizar sua operação agora.'}
              </p>
            </div>
          </div>

          {message && (
            <div 
              style={{ 
                padding: '12px 16px', 
                borderRadius: 'var(--border-radius-md)', 
                fontSize: '0.8rem', 
                lineHeight: 1.4,
                backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
                border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
              }}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {mode === 'signup' && (
              <div className="input-group">
                <span className="input-label">Nome Completo / Empresa</span>
                <div style={{ position: 'relative' }}>
                  <User 
                    size={16} 
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
                  />
                  <input 
                    type="text" 
                    placeholder="Ex: Beatriz Ramos"
                    className="form-input" 
                    style={{ paddingLeft: '42px', width: '100%' }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required 
                  />
                </div>
              </div>
            )}

            <div className="input-group">
              <span className="input-label">E-mail</span>
              <div style={{ position: 'relative' }}>
                <Mail 
                  size={16} 
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
                />
                <input 
                  type="email" 
                  className="form-input" 
                  style={{ paddingLeft: '42px', width: '100%' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="input-group">
              <span className="input-label">Senha</span>
              <div style={{ position: 'relative' }}>
                <Lock 
                  size={16} 
                  style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
                />
                <input 
                  type="password" 
                  placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : ''}
                  className="form-input" 
                  style={{ paddingLeft: '42px', width: '100%' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div className="input-group">
                <span className="input-label">Confirmar Senha</span>
                <div style={{ position: 'relative' }}>
                  <Lock 
                    size={16} 
                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
                  />
                  <input 
                    type="password" 
                    placeholder="Repita sua senha"
                    className="form-input" 
                    style={{ paddingLeft: '42px', width: '100%' }}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="login-options">
                <a href="#" className="login-link" onClick={handleForgotPassword}>
                  Esqueci minha senha
                </a>
              </div>
            )}

            <button 
              type="submit" 
              className="primary-btn" 
              style={{ width: '100%', justifyContent: 'center', height: '44px', marginTop: mode === 'signup' ? '8px' : '0' }}
              disabled={loading}
            >
              {loading 
                ? (mode === 'login' ? 'Acessando...' : 'Cadastrando...') 
                : (mode === 'login' ? 'Entrar' : 'Criar Conta')}
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
            {mode === 'login' ? (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Não tem uma conta?{' '}
                <button 
                  onClick={() => handleModeChange('signup')} 
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                >
                  Crie uma agora
                </button>
              </span>
            ) : (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Já possui uma conta?{' '}
                <button 
                  onClick={() => handleModeChange('login')} 
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                >
                  Fazer login
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
