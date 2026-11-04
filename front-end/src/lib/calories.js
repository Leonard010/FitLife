export function estimateCalories({ weight, height, age, sex, activity }) {
  const values = [weight, height, age, activity].map(Number);
  if (values.some(value => !Number.isFinite(value)) || weight < 30 || weight > 400 || height < 100 || height > 250 || age < 19 || age > 78 || !['male', 'female'].includes(sex) || ![1.2, 1.375, 1.55, 1.725].includes(Number(activity))) throw new Error('Confira peso, altura, idade e atividade. Estimativa para adultos de 19 a 78 anos.');
  const resting = 10 * Number(weight) + 6.25 * Number(height) - 5 * Number(age) + (sex === 'male' ? 5 : -161);
  return { resting: Math.round(resting), daily: Math.round(resting * Number(activity)) };
}
export function portionCalories(grams, per100) {
  if (!Number.isFinite(grams) || !Number.isFinite(per100) || grams <= 0 || grams > 10000 || per100 < 0 || per100 > 1000) throw new Error('Confira os valores da porção e do rótulo.');
  return Math.round(grams * per100 / 100);
}
