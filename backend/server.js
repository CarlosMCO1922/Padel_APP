// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client'); // Importa o PrismaClient
const bcrypt = require('bcryptjs'); // Importa o bcrypt
const jwt = require('jsonwebtoken'); // Importa o jsonwebtoken
const studentRoutes = require('./routes/studentRoutes');
const exerciseRoutes = require('./routes/exerciseRoutes');
const practicePlanRoutes = require('./routes/practicePlanRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');

const prisma = new PrismaClient(); // Cria uma instância do PrismaClient
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/students', studentRoutes);

// Rota de Teste
app.get('/', (req, res) => {
  res.send('Olá, Backend Padel Coach App!');
});

// --- ROTAS DE AUTENTICAÇÃO ---

// Rota de Registo (POST /api/auth/register)
app.post('/api/auth/register', async (req, res) => {
  const { email, name, password } = req.body;

  // Validação básica
  if (!email || !name || !password) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  try {
    // Verificar se o treinador já existe
    const existingTrainer = await prisma.trainer.findUnique({
      where: { email },
    });

    if (existingTrainer) {
      return res.status(409).json({ message: 'Este email já está registado.' });
    }

    // Encriptar a password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Criar o novo treinador na base de dados
    const newTrainer = await prisma.trainer.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    // Responder (sem enviar a password!)
    res.status(201).json({
      id: newTrainer.id,
      email: newTrainer.email,
      name: newTrainer.name,
    });

  } catch (error) {
    console.error("Erro no registo:", error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Rota de Login (POST /api/auth/login)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email e password são obrigatórios.' });
  }

  try {
    // Encontrar o treinador pelo email
    const trainer = await prisma.trainer.findUnique({
      where: { email },
    });

    // Se não encontrar ou a password estiver errada, dar erro genérico (segurança)
    if (!trainer) {
        return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // Comparar a password fornecida com a guardada (encriptada)
    const isMatch = await bcrypt.compare(password, trainer.password);

    if (!isMatch) {
        return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // Se tudo estiver OK, criar um JWT
    const payload = {
        id: trainer.id,
        email: trainer.email,
        name: trainer.name,
    };

    const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' } // O token expira em 1 hora (podes ajustar)
    );

    // Enviar o token ao utilizador
    res.status(200).json({ token });

  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// --- FIM DAS ROTAS DE AUTENTICAÇÃO ---

// --- ROTAS DE ALUNOS ---
app.use('/api/students', studentRoutes);

// --- ROTAS DE EXERCÍCIOS ---
app.use('/api/exercises', exerciseRoutes); 

// --- ROTAS DE PLANOS DE TREINO ---
app.use('/api/plans', practicePlanRoutes);
app.use('/api/sessions', evaluationRoutes);

// Iniciar o Servidor
app.listen(PORT, () => {
  console.log(`Servidor a correr na porta ${PORT}`);
});