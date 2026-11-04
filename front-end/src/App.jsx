import { useEffect, useState } from 'react';
import { api } from './lib/api';
import { portionCalories } from './lib/calories';
import AuthScreen from './components/AuthScreen';
import Brand from './components/Brand';
import CalorieCalculator from './components/CalorieCalculator';
import WeekChart from './components/WeekChart';
import './App.css';

function todayLocal() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
const defaults = { water_ml: 0, cardio_minutes: 0, water_goal_ml: 2000, cardio_goal_minutes: 30, calorie_goal: 2000 };

function MetricCard({ title, symbol, color, value, goal, unit, children }) {
  const safeGoal = Number(goal) > 0 ? Number(goal) : 1;
  return <article className="metric-card" style={{'--metric-color': color}}><div className="metric-heading"><span className="metric-icon" aria-hidden="true">{symbol}</span><h2>{title}</h2></div><div className="metric-value">{value.toLocaleString('pt-BR')}<small>{unit}</small></div><p className="muted">de {goal.toLocaleString('pt-BR')} {unit} · {Math.round(value / safeGoal * 100)}%</p><progress aria-label={`Progresso de ${title}`} value={Math.min(value, safeGoal)} max={safeGoal}/>{children}</article>;
}

function DayDashboard({ user, date, onDateChange, onLogout }) {
  const [record, setRecord] = useState(defaults);
  const [meals, setMeals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [week, setWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dirty, setDirty] = useState(false);
  const [retry, setRetry] = useState(0);
  const [mealName, setMealName] = useState('');
  const [mealMode, setMealMode] = useState('direct');
  const [mealKcal, setMealKcal] = useState('');
  const [grams, setGrams] = useState('');
  const [per100, setPer100] = useState('');
  const [taskName, setTaskName] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const options = { signal: controller.signal };
        const [daily, food, todos, summary] = await Promise.all([
          api(`/daily-records/${date}`, options), api(`/meals?date=${date}`, options),
          api(`/tasks?date=${date}`, options), api(`/weekly-summary?date=${date}`, options),
        ]);
        if (controller.signal.aborted) return;
        setRecord(daily); setMeals(food); setTasks(todos); setWeek(summary); setError('');
      } catch (err) { if (!controller.signal.aborted) setError(err.message); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    load(); return () => controller.abort();
  }, [date, retry]);

  useEffect(() => {
    if (!dirty) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function change(field, value) {
    setRecord(current => ({...current, [field]: value})); setDirty(true); setNotice('');
  }
  function leave(action) {
    if (busy) return;
    if (dirty && !window.confirm('Há metas ou valores ainda não salvos. Deseja sair deste dia e descartar essas alterações?')) return;
    action();
  }
  async function action(operation) {
    if (busy) return;
    setBusy(true); setNotice('');
    try {
      await operation();
      try { setWeek(await api(`/weekly-summary?date=${date}`)); }
      catch { setNotice('Ação concluída. Não foi possível atualizar o gráfico; tente atualizar a semana.'); }
    } catch (err) { setNotice(err.message); }
    finally { setBusy(false); }
  }
  function save() {
    action(async () => { await api(`/daily-records/${date}`, { method: 'PUT', body: record }); setDirty(false); setNotice('Acompanhamento salvo com sucesso.'); });
  }
  function addMeal(event) {
    event.preventDefault();
    if (!mealName.trim()) return;
    let calories;
    try { calories = mealMode === 'portion' ? portionCalories(Number(grams), Number(per100)) : Number(mealKcal); }
    catch (err) { setNotice(err.message); return; }
    if (!Number.isInteger(calories) || calories < 0 || calories > 50000) { setNotice('Informe calorias válidas entre 0 e 50.000.'); return; }
    action(async () => {
      const meal = await api('/meals', { method: 'POST', body: {name: mealName.trim(), date, calories} });
      setMeals(current => [...current, meal]); setMealName(''); setMealKcal(''); setGrams(''); setPer100(''); setNotice('Refeição adicionada ao consumo do dia.');
    });
  }
  function addTask(event) {
    event.preventDefault(); if (!taskName.trim()) return;
    action(async () => { const task = await api('/tasks', {method: 'POST', body: {name: taskName.trim(), date}}); setTasks(current => [...current, task]); setTaskName(''); });
  }
  const consumed = meals.reduce((sum, meal) => sum + Number(meal.calories || 0), 0);
  const completed = tasks.filter(task => task.completed).length;
  const unavailable = loading || Boolean(error);

  return <div className="app-shell" id="inicio"><aside className="sidebar"><Brand/><span className="nav-label">SEU ESPAÇO</span><nav aria-label="Navegação principal"><a href="#hoje" aria-label="Meu dia">◉ <span>Meu dia</span></a><a href="#semana" aria-label="Minha semana">▥ <span>Minha semana</span></a><a href="#alimentacao" aria-label="Alimentação">✦ <span>Alimentação</span></a><a href="#calculadora" aria-label="Calculadora">⌗ <span>Calculadora</span></a></nav><div className="sidebar-note"><strong>Consistência, não perfeição.</strong><p>Um pequeno passo hoje faz parte da sua evolução.</p></div><button className="ghost" disabled={busy} onClick={() => leave(onLogout)}>Sair da conta ↗</button></aside>
  <main className="dashboard"><header className="topbar"><span>Seu espaço de bem-estar</span><div className="profile"><span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span><span>{user.name}</span><button className="mobile-logout ghost" disabled={busy} onClick={() => leave(onLogout)}>Sair</button></div></header>
  <section className="day-heading" id="hoje"><div><span className="eyebrow">VAMOS CUIDAR DE VOCÊ?</span><h1>Seu dia, em equilíbrio<span>.</span></h1><p className="muted">Acompanhe seus hábitos e celebre cada avanço.</p></div><label className="date-label">Data do acompanhamento<input type="date" min="1000-01-07" max="9999-12-25" value={date} disabled={busy} onChange={e => {if(e.target.value && e.target.value !== date) leave(() => onDateChange(e.target.value));}}/></label></section>
  {loading && <p role="status" className="notice">Carregando seu dia...</p>}
  {error && <div role="alert" className="notice error">{error}<button onClick={() => {setLoading(true); setError(''); setRetry(value => value + 1);}}>Tentar novamente</button></div>}
  <p className="notice" role="status">{notice}</p>
  <fieldset disabled={unavailable || busy} className="daily-controls">
    <div className="metrics-grid">
      <MetricCard title="Hidratação" symbol="◉" color="#4c9aff" value={record.water_ml} goal={record.water_goal_ml} unit="ml"><div className="stepper"><button className="ghost" aria-label="Remover 250 ml" onClick={() => change('water_ml', Math.max(0, record.water_ml - 250))}>−</button><button className="soft" disabled={record.water_ml >= 8000} onClick={() => change('water_ml', Math.min(8000, record.water_ml + 250))}>+ 250 ml</button></div><label>Meta diária · até 8 litros<input type="number" min="1" max="8000" required value={record.water_goal_ml} onChange={e => change('water_goal_ml', e.target.value === '' ? '' : Number(e.target.value))}/></label></MetricCard>
      <MetricCard title="Movimento" symbol="↗" color="#ae93ff" value={record.cardio_minutes} goal={record.cardio_goal_minutes} unit="min"><div className="stepper"><button className="ghost" aria-label="Remover 10 minutos" onClick={() => change('cardio_minutes', Math.max(0, record.cardio_minutes - 10))}>−</button><button className="soft" disabled={record.cardio_minutes >= 120} onClick={() => change('cardio_minutes', Math.min(120, record.cardio_minutes + 10))}>+ 10 minutos</button></div><label>Meta diária · até 120 minutos<input type="number" min="1" max="120" required value={record.cardio_goal_minutes} onChange={e => change('cardio_goal_minutes', e.target.value === '' ? '' : Number(e.target.value))}/></label></MetricCard>
      <MetricCard title="Energia" symbol="✦" color="#ffb46b" value={consumed} goal={record.calorie_goal} unit="kcal"><p className="remaining">{consumed <= record.calorie_goal ? `${record.calorie_goal - consumed} kcal restantes` : `${consumed - record.calorie_goal} kcal acima da meta`}</p><a className="food-link" href="#alimentacao">Registrar alimentação →</a><label>Meta diária de calorias<input type="number" min="1" max="50000" required value={record.calorie_goal} onChange={e => change('calorie_goal', e.target.value === '' ? '' : Number(e.target.value))}/></label></MetricCard>
    </div>
    <div className="save-row"><p className="muted">{dirty ? '● Você tem alterações não salvas.' : 'Metas e acompanhamento do dia selecionado.'}</p><button className="primary" onClick={save} disabled={!dirty || !Number.isInteger(record.water_goal_ml) || record.water_goal_ml < 1 || record.water_goal_ml > 8000 || !Number.isInteger(record.cardio_goal_minutes) || record.cardio_goal_minutes < 1 || record.cardio_goal_minutes > 120 || !Number.isInteger(record.calorie_goal) || record.calorie_goal < 1 || record.calorie_goal > 50000}>{busy ? 'Aguarde...' : 'Salvar meu dia'}</button></div><p className="fine">Os limites são opções do app, não recomendações de consumo ou exercício. Metas são salvas para a data selecionada.</p>
  </fieldset>
  {week && <WeekChart summary={week}/>}
  <button className="ghost refresh-week" disabled={busy || loading} onClick={() => action(async () => {setWeek(await api(`/weekly-summary?date=${date}`));})}>↻ Atualizar semana</button>
  <fieldset className="daily-controls" disabled={unavailable || busy}>
  <div className="two-columns"><section className="panel" id="alimentacao"><div className="section-title"><div><span className="eyebrow">NUTRIÇÃO NO SEU RITMO</span><h2>Alimentação do dia</h2></div><span className="pill">{meals.length} registros</span></div><p className="muted">Adicione calorias diretamente ou calcule a porção usando o rótulo.</p><form onSubmit={addMeal} className="stack"><label>Alimento ou refeição<input value={mealName} onChange={e => setMealName(e.target.value)} required maxLength="150" placeholder="Ex.: arroz do almoço"/></label><label>Como calcular<select value={mealMode} onChange={e => setMealMode(e.target.value)}><option value="direct">Informar calorias totais</option><option value="portion">Calcular porção em gramas</option></select></label>{mealMode === 'direct' ? <label>Calorias da refeição (kcal)<input type="number" required min="0" max="50000" value={mealKcal} onChange={e => setMealKcal(e.target.value)} placeholder="Ex.: 450"/></label> : <><div className="two-inputs"><label>Porção consumida (g)<input type="number" required min="0.1" step="0.1" max="10000" value={grams} onChange={e => setGrams(e.target.value)}/></label><label>kcal por 100 g<input type="number" required min="0" max="1000" step="0.1" value={per100} onChange={e => setPer100(e.target.value)}/></label></div><p className="fine">Use os dados do rótulo ou de uma fonte nutricional. O app não identifica alimentos automaticamente.</p>{grams && per100 && <p className="portion-result">Sua porção: {Math.round(Number(grams) * Number(per100) / 100)} kcal</p>}</>}<button className="primary">Adicionar ao consumo do dia</button></form><ul className="entry-list">{meals.map(meal => <li key={meal.id}><div><strong>{meal.name}</strong><small>{Number(meal.calories || 0)} kcal</small></div><button className="delete-button" aria-label={`Remover ${meal.name}`} onClick={() => action(async () => {await api(`/meals/${meal.id}`, {method: 'DELETE'}); setMeals(current => current.filter(item => item.id !== meal.id));})}>Remover</button></li>)}</ul>{!meals.length && <p className="empty">Sua primeira refeição do dia começa aqui.</p>}</section>
  <section className="panel" id="tarefas"><div className="section-title"><div><span className="eyebrow">PEQUENAS CONQUISTAS</span><h2>Hábitos e tarefas</h2></div><span className="pill">{completed}/{tasks.length}</span></div><p className="muted">O que você quer fazer por você hoje?</p><form onSubmit={addTask} className="inline-form"><label className="grow">Nova tarefa<input required maxLength="150" value={taskName} onChange={e => setTaskName(e.target.value)} placeholder="Ex.: caminhar ao ar livre"/></label><button className="primary">Adicionar</button></form><ul className="entry-list">{tasks.map(task => <li key={task.id}><label className={`task-check ${task.completed ? 'done' : ''}`}><input type="checkbox" checked={task.completed} onChange={() => action(async () => {const updated = await api(`/tasks/${task.id}`, {method: 'PATCH', body: {completed: !task.completed}}); setTasks(current => current.map(item => item.id === task.id ? {...item, completed: updated.completed} : item));})}/><span>{task.name}</span></label><button className="delete-button" aria-label={`Remover ${task.name}`} onClick={() => action(async () => {await api(`/tasks/${task.id}`, {method: 'DELETE'}); setTasks(current => current.filter(item => item.id !== task.id));})}>Remover</button></li>)}</ul>{!tasks.length && <p className="empty">Um passo de cada vez. Adicione seu primeiro hábito.</p>}</section></div>
  <CalorieCalculator onApply={value => {change('calorie_goal', value); setNotice('Estimativa aplicada à meta. Clique em “Salvar meu dia” para guardar.'); document.querySelector('#hoje')?.scrollIntoView({behavior: 'smooth'});}}/>
  </fieldset><footer className="footer"><Brand/><p>Cuide de hoje. Acompanhe sua evolução.</p></footer></main></div>;
}

function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [date, setDate] = useState(todayLocal);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const started = Date.now();
    async function check() {
      let account = null;
      try { account = await api('/auth/me', {signal: controller.signal}); }
      catch (error) { if (!disposed && error.status !== 401) setMessage('Servidor indisponível. Confira se o backend está rodando.'); }
      finally { clearTimeout(timer); }
      // A breve abertura é dispensada quando a pessoa prefere menos movimento.
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const delay = reduced ? 0 : Math.max(0, 800 - (Date.now() - started));
      timerId = setTimeout(() => { if (!disposed) {setUser(account); setChecking(false);} }, delay);
    }
    let disposed = false; let timerId;
    check(); return () => {disposed = true; controller.abort(); clearTimeout(timer); clearTimeout(timerId);};
  }, []);
  async function logout() {
    try { await api('/auth/logout', {method: 'POST'}); setUser(null); setMessage(''); }
    catch (error) { setMessage(error.message); }
  }
  if (checking) return <main className="splash"><Brand large/><p role="status">Preparando seu espaço de bem-estar...</p><div className="splash-line"/></main>;
  return <>{message && <p role="alert" className="global-message">{message}</p>}{user ? <DayDashboard key={`${user.id}:${date}`} user={user} date={date} onDateChange={setDate} onLogout={logout}/> : <AuthScreen onLogin={account => {setUser(account); setDate(todayLocal()); setMessage('');}}/>}</>;
}
export default App;
