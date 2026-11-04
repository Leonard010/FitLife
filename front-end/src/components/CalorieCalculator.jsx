import { useState } from 'react';
import { estimateCalories } from '../lib/calories';
function CalorieCalculator({ onApply }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  function calculate(event) {
    event.preventDefault(); setError(''); setResult(null);
    try { setResult(estimateCalories(Object.fromEntries(new FormData(event.currentTarget)))); }
    catch (err) { setError(err.message); }
  }
  return <section className="panel" id="calculadora"><div className="section-title"><div><span className="eyebrow">CONHEÇA SEU PONTO DE PARTIDA</span><h2>Calculadora de calorias</h2></div><span className="pill">Estimativa diária</span></div>
    <p className="muted">Estime seu gasto para manutenção e, se desejar, use o resultado como meta do dia selecionado.</p>
    <form onSubmit={calculate} className="calculator-grid">
      <label>Peso (kg)<input name="weight" type="number" min="30" max="400" step="0.1" required placeholder="70"/></label>
      <label>Altura (cm)<input name="height" type="number" min="100" max="250" step="0.1" required placeholder="175"/></label>
      <label>Idade<input name="age" type="number" min="19" max="78" required placeholder="25"/></label>
      <label>Sexo usado na fórmula<select name="sex"><option value="male">Masculino</option><option value="female">Feminino</option></select></label>
      <label className="activity-field">Atividade habitual<select name="activity"><option value="1.2">Sedentária · fator 1,20</option><option value="1.375">Leve · fator 1,375</option><option value="1.55">Moderada · fator 1,55</option><option value="1.725">Intensa · fator 1,725</option></select></label>
      <button className="primary">Calcular estimativa</button>
    </form>
    {error && <p role="alert">{error}</p>}
    {result && <div className="calculator-result"><div><small>Estimativa de manutenção</small><strong>{result.daily.toLocaleString('pt-BR')} <span>kcal/dia</span></strong><small>Gasto em repouso: {result.resting} kcal/dia</small></div><button type="button" className="primary" onClick={() => onApply(result.daily)}>Usar como meta do dia</button></div>}
    <p className="fine">Estimativa para adultos de 19 a 78 anos, não uma prescrição. Equação de Mifflin–St Jeor com multiplicador de atividade aproximado. Necessidades individuais variam. <a href="https://pubmed.ncbi.nlm.nih.gov/2305711/" target="_blank" rel="noreferrer">Ver referência</a>.</p>
  </section>;
}
export default CalorieCalculator;
