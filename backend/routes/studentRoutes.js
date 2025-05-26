// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/authMiddleware'); // Importa o nosso middleware

const prisma = new PrismaClient();

// --- Rotas Protegidas ---

// GET /api/students - Obter todos os alunos do treinador logado
router.get('/', protect, async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      where: {
        trainerId: req.user.id,
      },
      orderBy: {
          name: 'asc'
      }
    });
    res.status(200).json(students);
  } catch (error) {
    console.error("Erro ao buscar alunos:", error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// POST /api/students - Criar um novo aluno para o treinador logado
router.post('/', protect, async (req, res) => {
  const { name, contact_info, skill_level, notes } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'O nome é obrigatório.' });
  }

  try {
    const newStudent = await prisma.student.create({
      data: {
        name,
        contact_info,
        skill_level,
        notes,
        trainerId: req.user.id,
      },
    });
    res.status(201).json(newStudent);
  } catch (error) {
    console.error("Erro ao criar aluno:", error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// GET /api/students/:id - Obter um aluno específico
router.get('/:id', protect, async (req, res) => {
    const { id } = req.params;
    try {
        const student = await prisma.student.findUnique({
            where: { id: id },
        });

        // Verifica se o aluno existe E se pertence ao treinador logado
        if (!student || student.trainerId !== req.user.id) {
            return res.status(404).json({ message: 'Aluno não encontrado.' });
        }

        res.status(200).json(student);
    } catch (error) {
        console.error("Erro ao buscar aluno:", error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// PUT /api/students/:id - Atualizar um aluno específico
router.put('/:id', protect, async (req, res) => {
    const { id } = req.params;
    const { name, contact_info, skill_level, notes } = req.body;

    try {
        // Primeiro, verifica se o aluno existe e pertence ao treinador
        const student = await prisma.student.findUnique({
            where: { id: id },
        });

        if (!student || student.trainerId !== req.user.id) {
            return res.status(404).json({ message: 'Aluno não encontrado ou não autorizado.' });
        }

        // Se existir e pertencer, atualiza
        const updatedStudent = await prisma.student.update({
            where: { id: id },
            data: {
                name,
                contact_info,
                skill_level,
                notes,
            },
        });
        res.status(200).json(updatedStudent);
    } catch (error) {
        console.error("Erro ao atualizar aluno:", error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// DELETE /api/students/:id - Apagar um aluno específico
router.delete('/:id', protect, async (req, res) => {
    const { id } = req.params;

    try {
        // Primeiro, verifica se o aluno existe e pertence ao treinador
        const student = await prisma.student.findUnique({
            where: { id: id },
        });

        if (!student || student.trainerId !== req.user.id) {
            return res.status(404).json({ message: 'Aluno não encontrado ou não autorizado.' });
        }

        // Se existir e pertencer, apaga
        await prisma.student.delete({
            where: { id: id },
        });

        res.status(200).json({ message: 'Aluno apagado com sucesso.' });
        // Ou podes enviar 204 No Content: res.status(204).send();

    } catch (error) {
        console.error("Erro ao apagar aluno:", error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});


module.exports = router;