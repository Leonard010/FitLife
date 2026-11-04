import { useState } from 'react';
const metrics = {water_ml: ['Água', 'ml', '#4c9aff'], cardio_minutes: ['Cardio', 'min', '#ae93ff'], calories: ['Calorias', 'kcal', '#ffb46b']};
function WeekChart({ summary }) {
  const [metric, setMetric] = useState('water_ml');
  const [label, unit, color] = metrics[metric];
  const max = Math.max(1, ...summary.days.map(day => day[metric]));
  const total = summary.days.reduce((sum, day) => sum + day[metric], 0);
  const format = date => date.split('-').reverse().slice(0, 2).join('/');
  return <section className="panel" id="semana"><div className="section-title"><div><span className="eyebrow">CADA DIA CONTA</span><h2>Sua semana em movimento</h2><p className="muted">{format(summary.start)} a {format(summary.end)} · segunda a domingo</p></div><label className="metric-select">Exibir<select value={metric} onChange={e => setMetric(e.target.value)}>{Object.entries(metrics).map(([key, value]) => <option key={key} value={key}>{value[0]}</option>)}</select></label></div>
    <p><strong>{total.toLocaleString('pt-BR')} {unit}</strong><span className="muted"> de {label.toLowerCase()} registrados na semana</span></p>
    <div className="chart" role="img" aria-label={`Gráfico semanal de ${label}. Total ${total} ${unit}. Valores detalhados na tabela abaixo.`}>
      {summary.days.map((day, index) => <div className="chart-column" key={day.date}><small>{day[metric]}</small><div className="bar-track"><div className="bar" style={{height: `${day[metric] / max * 100}%`, background: color}}/></div><span>{['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'][index]}</span><small>{format(day.date)}</small></div>)}
    </div>
    <details><summary>Ver dados completos da semana</summary><div className="table-scroll"><table><caption>Registros salvos no banco</caption><thead><tr><th>Dia</th><th>Água</th><th>Cardio</th><th>Calorias</th><th>Refeições</th><th>Tarefas</th></tr></thead><tbody>{summary.days.map(day => <tr key={day.date}><th scope="row">{format(day.date)}</th><td>{day.water_ml} ml</td><td>{day.cardio_minutes} min</td><td>{day.calories} kcal</td><td>{day.meal_count}</td><td>{day.completed_tasks}/{day.task_count}</td></tr>)}</tbody></table></div></details>
  </section>;
}
export default WeekChart;
