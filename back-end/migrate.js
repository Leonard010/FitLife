const pool = require('./db');
async function migrate() {
  const columns = [
    ['meals', 'calories', 'INT NOT NULL DEFAULT 0'],
    ['daily_records', 'cardio_goal_minutes', 'INT NOT NULL DEFAULT 30'],
    ['daily_records', 'calorie_goal', 'INT NOT NULL DEFAULT 2000'],
  ];
  try {
    for (const [table, column, definition] of columns) {
      const [rows] = await pool.execute('SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?', [table, column]);
      if (!rows.length) {
        await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
        console.log(`Adicionado: ${table}.${column}`);
      } else console.log(`Já existe: ${table}.${column}`);
    }
    console.log('Migração concluída. Registros preservados.');
  } catch (error) { console.error('Migração falhou:', error.code); process.exitCode = 1; }
  finally { await pool.end(); }
}
migrate();
