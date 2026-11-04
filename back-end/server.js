const express = require("express");
const cors = require("cors");
const { randomUUID } = require("node:crypto");
const pool = require("./db");
const bcrypt = require("bcrypt");
const session = require("express-session");

const app = express();
const PORT = Number(process.env.PORT || 3002);

function isValidDate(date) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsedDate = new Date(`${date}T00:00:00Z`);

  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date &&
    date >= "1000-01-01"
  );
}

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());

if (!process.env.SESSION_SECRET) {
  throw new Error("Configure SESSION_SECRET no arquivo .env.");
}

app.use(
  session({
    name: "fitlife.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 8,
    },
  }),
);

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({
      message: "Entre na sua conta para continuar.",
    });
  }

  next();
}

app.get("/", (req, res) => {
  res.json({
    message: "Backend do FitLife funcionando!",
  });
});

app.get("/meals", requireAuth, async (req, res) => {
  const date = req.query.date;

  if (!isValidDate(date)) {
    return res.status(400).json({
      message: "Informe uma data válida no formato AAAA-MM-DD.",
    });
  }

  try {
    const [meals] = await pool.execute(
      `SELECT id, name, calories, created_at
       FROM meals
       WHERE user_id = ? AND record_date = ?
       ORDER BY created_at, id`,
      [req.session.userId, date],
    );

    return res.json(meals);
  } catch (error) {
    console.error("Erro ao listar refeições:", error.code);

    return res.status(500).json({
      message: "Não foi possível carregar as refeições.",
    });
  }
});

app.post("/meals", requireAuth, async (req, res) => {
  const { name, date, calories = 0 } = req.body ?? {};

  if (
    typeof name !== "string" ||
    name.trim() === "" ||
    name.trim().length > 150
  ) {
    return res.status(400).json({
      message: "Informe um nome entre 1 e 150 caracteres.",
    });
  }

  if (!isValidDate(date)) {
    return res.status(400).json({
      message: "Informe uma data válida.",
    });
  }

  if (!Number.isInteger(calories) || calories < 0 || calories > 50000) {
    return res.status(400).json({ message: "Informe calorias entre 0 e 50.000." });
  }

  const newMeal = {
    id: randomUUID(),
    name: name.trim(),
    record_date: date,
    calories,
  };

  try {
    await pool.execute(
      `INSERT INTO meals (id, name, user_id, record_date, calories)
       VALUES (?, ?, ?, ?, ?)`,
      [newMeal.id, newMeal.name, req.session.userId, date, calories],
    );

    return res.status(201).json(newMeal);
  } catch (error) {
    console.error("Erro ao cadastrar refeição:", error.code);

    return res.status(500).json({
      message: "Não foi possível cadastrar a refeição.",
    });
  }
});

app.delete("/meals/:id", requireAuth, async (req, res) => {
  try {
    const [result] = await pool.execute(
      "DELETE FROM meals WHERE id = ? AND user_id = ?",
      [req.params.id, req.session.userId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Refeição não encontrada.",
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao remover refeição:", error.code);

    return res.status(500).json({
      message: "Não foi possível remover a refeição.",
    });
  }
});

app.get("/tasks", requireAuth, async (req, res) => {
  const date = req.query.date;

  if (!isValidDate(date)) {
    return res.status(400).json({
      message: "Informe uma data válida.",
    });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id, name, completed, created_at
       FROM tasks
       WHERE user_id = ? AND record_date = ?
       ORDER BY created_at, id`,
      [req.session.userId, date],
    );

    return res.json(
      rows.map((task) => ({
        ...task,
        completed: Boolean(task.completed),
      })),
    );
  } catch (error) {
    console.error("Erro ao listar tarefas:", error.code);

    return res.status(500).json({
      message: "Não foi possível carregar as tarefas.",
    });
  }
});

app.post("/tasks", requireAuth, async (req, res) => {
  const { name, date } = req.body ?? {};

  if (
    typeof name !== "string" ||
    name.trim() === "" ||
    name.trim().length > 150
  ) {
    return res.status(400).json({
      message: "Informe um nome entre 1 e 150 caracteres.",
    });
  }

  if (!isValidDate(date)) {
    return res.status(400).json({
      message: "Informe uma data válida.",
    });
  }

  const newTask = {
    id: randomUUID(),
    name: name.trim(),
    completed: false,
    record_date: date,
  };

  try {
    await pool.execute(
      `INSERT INTO tasks
       (id, name, completed, user_id, record_date)
       VALUES (?, ?, ?, ?, ?)`,
      [newTask.id, newTask.name, newTask.completed, req.session.userId, date],
    );

    return res.status(201).json(newTask);
  } catch (error) {
    console.error("Erro ao cadastrar tarefa:", error.code);

    return res.status(500).json({
      message: "Não foi possível cadastrar a tarefa.",
    });
  }
});

app.patch("/tasks/:id", requireAuth, async (req, res) => {
  const completed = req.body?.completed;

  if (typeof completed !== "boolean") {
    return res.status(400).json({
      message: "Informe completed como true ou false.",
    });
  }

  try {
    const [result] = await pool.execute(
      "UPDATE tasks SET completed = ? WHERE id = ? AND user_id = ?",
      [completed, req.params.id, req.session.userId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Tarefa não encontrada.",
      });
    }

    return res.json({
      id: req.params.id,
      completed,
    });
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error.code);

    return res.status(500).json({
      message: "Não foi possível atualizar a tarefa.",
    });
  }
});

app.delete("/tasks/:id", requireAuth, async (req, res) => {
  try {
    const [result] = await pool.execute(
      "DELETE FROM tasks WHERE id = ? AND user_id = ?",
      [req.params.id, req.session.userId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Tarefa não encontrada.",
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao remover tarefa:", error.code);

    return res.status(500).json({
      message: "Não foi possível remover a tarefa.",
    });
  }
});

app.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body ?? {};

  if (
    typeof name !== "string" ||
    name.trim().length === 0 ||
    name.trim().length > 100
  ) {
    return res.status(400).json({
      message: "Informe um nome entre 1 e 100 caracteres.",
    });
  }

  if (
    typeof email !== "string" ||
    email.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return res.status(400).json({
      message: "Informe um e-mail válido.",
    });
  }

  if (
    typeof password !== "string" ||
    password.length < 6 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({
      message: "Use uma senha com pelo menos 6 caracteres e até 72 bytes.",
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const user = {
      id: randomUUID(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
    };

    await pool.execute(
      "INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)",
      [user.id, user.name, user.email, passwordHash],
    );

    return res.status(201).json(user);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Este e-mail já está cadastrado.",
      });
    }

    console.error("Erro ao cadastrar usuário:", error.code);

    return res.status(500).json({
      message: "Não foi possível cadastrar o usuário.",
    });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.trim() === "" ||
    password === "" ||
    email.trim().length > 254 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({
      message: "Informe e-mail e senha válidos.",
    });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT id, name, email, password_hash FROM users WHERE email = ?",
      [email.trim().toLowerCase()],
    );

    const user = rows[0];

    const validPassword = user
      ? await bcrypt.compare(password, user.password_hash)
      : false;

    if (!validPassword) {
      return res.status(401).json({
        message: "E-mail ou senha incorretos.",
      });
    }

    req.session.regenerate((error) => {
      if (error) {
        console.error("Erro ao iniciar sessão:", error.message);

        return res.status(500).json({
          message: "Não foi possível iniciar a sessão.",
        });
      }

      req.session.userId = user.id;

      req.session.save((error) => {
        if (error) {
          console.error("Erro ao salvar sessão:", error.message);

          return res.status(500).json({
            message: "Não foi possível salvar a sessão.",
          });
        }

        return res.json({
          id: user.id,
          name: user.name,
          email: user.email,
        });
      });
    });
  } catch (error) {
    console.error("Erro no login:", error.code);

    return res.status(500).json({
      message: "Não foi possível realizar o login.",
    });
  }
});

app.get("/auth/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({
      message: "Você não está conectado.",
    });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT id, name, email FROM users WHERE id = ?",
      [req.session.userId],
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Usuário não encontrado.",
      });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error("Erro ao consultar sessão:", error.code);

    return res.status(500).json({
      message: "Não foi possível consultar a sessão.",
    });
  }
});

app.post("/auth/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        message: "Não foi possível sair.",
      });
    }

    res.clearCookie("fitlife.sid", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    return res.status(204).send();
  });
});

app.get("/auth/check", requireAuth, (req, res) => {
  res.json({
    message: "Sessão ativa!",
  });
});

app.get("/daily-records/:date", requireAuth, async (req, res) => {
  const date = req.params.date;

  const parsedDate = new Date(`${date}T00:00:00Z`);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date ||
    date < "1000-01-01"
  ) {
    return res.status(400).json({
      message: "Informe uma data válida no formato AAAA-MM-DD.",
    });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT water_ml, cardio_minutes, water_goal_ml, cardio_goal_minutes, calorie_goal
       FROM daily_records
       WHERE user_id = ? AND record_date = ?`,
      [req.session.userId, date],
    );

    return res.json({
      date,
      ...(rows[0] ?? {
        water_ml: 0,
        cardio_minutes: 0,
        water_goal_ml: 2000,
        cardio_goal_minutes: 30,
        calorie_goal: 2000,
      }),
    });
  } catch (error) {
    console.error("Erro ao consultar registro diário:", error.code);

    return res.status(500).json({
      message: "Não foi possível carregar o registro diário.",
    });
  }
});

app.put("/daily-records/:date", requireAuth, async (req, res) => {
  const date = req.params.date;
  const parsedDate = new Date(`${date}T00:00:00Z`);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date ||
    date < "1000-01-01"
  ) {
    return res.status(400).json({
      message: "Informe uma data válida no formato AAAA-MM-DD.",
    });
  }

  const { water_ml, cardio_minutes, water_goal_ml, cardio_goal_minutes, calorie_goal } = req.body ?? {};

  const validInteger = (value) =>
    Number.isInteger(value) && value <= 2147483647;

  if (
    !validInteger(water_ml) ||
    water_ml < 0 || water_ml > 8000 ||
    !validInteger(cardio_minutes) ||
    cardio_minutes < 0 || cardio_minutes > 120 ||
    !validInteger(water_goal_ml) ||
    water_goal_ml <= 0 || water_goal_ml > 8000 ||
    !validInteger(cardio_goal_minutes) || cardio_goal_minutes < 1 || cardio_goal_minutes > 120 ||
    !validInteger(calorie_goal) || calorie_goal < 1 || calorie_goal > 50000
  ) {
    return res.status(400).json({
      message:
        "Informe quantidades inteiras válidas e uma meta maior que zero.",
    });
  }

  try {
    await pool.execute(
      `INSERT INTO daily_records
        (id, user_id, record_date, water_ml, cardio_minutes, water_goal_ml, cardio_goal_minutes, calorie_goal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         water_ml = ?,
         cardio_minutes = ?,
         water_goal_ml = ?, cardio_goal_minutes = ?, calorie_goal = ?`,
      [
        randomUUID(),
        req.session.userId,
        date,
        water_ml,
        cardio_minutes,
        water_goal_ml, cardio_goal_minutes, calorie_goal,
        water_ml,
        cardio_minutes,
        water_goal_ml, cardio_goal_minutes, calorie_goal,
      ],
    );

    return res.json({
      date,
      water_ml,
      cardio_minutes,
      water_goal_ml, cardio_goal_minutes, calorie_goal,
    });
  } catch (error) {
    console.error("Erro ao salvar registro diário:", error.code);

    return res.status(500).json({
      message: "Não foi possível salvar o registro diário.",
    });
  }
});

app.get("/weekly-summary", requireAuth, async (req, res) => {
  const date = req.query.date;

  if (!isValidDate(date)) {
    return res.status(400).json({
      message: "Informe uma data válida.",
    });
  }

  const monday = new Date(`${date}T00:00:00Z`);
  const daysSinceMonday = (monday.getUTCDay() + 6) % 7;

  monday.setUTCDate(monday.getUTCDate() - daysSinceMonday);

  const dates = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setUTCDate(day.getUTCDate() + index);

    return day.toISOString().slice(0, 10);
  });

  const start = dates[0];
  const end = dates[6];
  const userId = req.session.userId;

  try {
    const [dailyRows] = await pool.execute(
      `SELECT DATE_FORMAT(record_date, '%Y-%m-%d') AS date,
              water_ml, cardio_minutes, water_goal_ml, cardio_goal_minutes, calorie_goal
       FROM daily_records
       WHERE user_id = ? AND record_date BETWEEN ? AND ?`,
      [userId, start, end],
    );

    const [mealRows] = await pool.execute(
      `SELECT DATE_FORMAT(record_date, '%Y-%m-%d') AS date,
              COUNT(*) AS meal_count, SUM(calories) AS calories
       FROM meals
       WHERE user_id = ? AND record_date BETWEEN ? AND ?
       GROUP BY record_date`,
      [userId, start, end],
    );

    const [taskRows] = await pool.execute(
      `SELECT DATE_FORMAT(record_date, '%Y-%m-%d') AS date,
              COUNT(*) AS task_count,
              SUM(completed) AS completed_tasks
       FROM tasks
       WHERE user_id = ? AND record_date BETWEEN ? AND ?
       GROUP BY record_date`,
      [userId, start, end],
    );

    const dailyByDate = new Map(dailyRows.map((row) => [row.date, row]));

    const mealsByDate = new Map(mealRows.map((row) => [row.date, row]));

    const tasksByDate = new Map(taskRows.map((row) => [row.date, row]));

    const days = dates.map((day) => {
      const daily = dailyByDate.get(day);
      const meals = mealsByDate.get(day);
      const tasks = tasksByDate.get(day);

      return {
        date: day,
        water_ml: daily?.water_ml ?? 0,
        cardio_minutes: daily?.cardio_minutes ?? 0,
        water_goal_ml: daily?.water_goal_ml ?? null,
        meal_count: Number(meals?.meal_count ?? 0),
        calories: Number(meals?.calories ?? 0),
        calorie_goal: daily?.calorie_goal ?? null,
        cardio_goal_minutes: daily?.cardio_goal_minutes ?? null,
        task_count: Number(tasks?.task_count ?? 0),
        completed_tasks: Number(tasks?.completed_tasks ?? 0),
      };
    });

    return res.json({ start, end, days });
  } catch (error) {
    console.error("Erro ao consultar semana:", error.code);

    return res.status(500).json({
      message: "Não foi possível carregar o resumo semanal.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
