import { useState } from 'react';
import { api } from '../lib/api';
import Brand from './Brand';
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event) {
    event.preventDefault(); if (busy) return;
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true); setMessage('');
    try {
      if (mode === 'register') {
        await api('/auth/register', { method: 'POST', body: data });
        setMode('login'); setMessage('Conta criada! Entre com seu e-mail e senha.');
      } else onLogin(await api('/auth/login', { method: 'POST', body: data }));
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <main className="auth-layout" id="inicio">
    <section className="auth-story"><Brand large/><div><span className="eyebrow">SUA ROTINA. SEU RITMO.</span><h1>Pequenos hábitos.<br/><span>Grandes mudanças.</span></h1><p>Água, movimento e alimentação em um só lugar. Cuide da sua rotina e acompanhe cada conquista.</p><div className="story-chips"><span>◉ Hidratação</span><span>↗ Movimento</span><span>✦ Nutrição</span></div></div><small>Seu progresso começa com o próximo passo.</small></section>
    <section className="auth-panel"><div className="auth-box"><span className="eyebrow">BEM-VINDO AO FITLIFE</span><h2>{mode === 'login' ? 'Bom ter você aqui.' : 'Vamos começar?'}</h2><p className="muted">{mode === 'login' ? 'Entre para acompanhar o seu dia.' : 'Crie sua conta e construa sua rotina.'}</p>
    <div className="tabs"><button type="button" aria-pressed={mode === 'login'} disabled={busy} onClick={() => {setMode('login'); setMessage('');}}>Entrar</button><button type="button" aria-pressed={mode === 'register'} disabled={busy} onClick={() => {setMode('register'); setMessage('');}}>Criar conta</button></div>
    <form key={mode} onSubmit={submit} className="stack">
      {mode === 'register' && <label>Seu nome<input name="name" autoComplete="name" required maxLength="100" placeholder="Como podemos chamar você?"/></label>}
      <label>E-mail<input name="email" type="email" autoComplete="username" required maxLength="254" placeholder="voce@exemplo.com"/></label>
      <label>Senha<input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'register' ? 6 : undefined} required placeholder={mode === 'register' ? 'Pelo menos 6 caracteres' : 'Sua senha'}/></label>
      <button className="primary" disabled={busy}>{busy ? 'Aguarde...' : mode === 'login' ? 'Entrar na minha conta →' : 'Criar minha conta →'}</button>
    </form><p role="status" className="feedback">{message}</p><p className="auth-foot">Sua rotina é pessoal. Seus registros ficam na sua conta.</p></div></section>
  </main>;
}
export default AuthScreen;
