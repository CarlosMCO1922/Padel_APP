// routes/exerciseRoutes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/authMiddleware');

const prisma = new PrismaClient();

// GET /api/exercises - Obter todos os exercícios do treinador logado
router.get('/', protect, async (req, res) => {
    try {
        const exercises = await prisma.exercise.findMany({
            where: { trainerId: req.user.id },
            orderBy: { name: 'asc' },
        });
        res.status(200).json(exercises);
    } catch (error) {
        console.error("Erro ao buscar exercícios:", error);
        res.status(500).json({ message: 'Erro interno.' });
    }
});

// POST /api/exercises - Criar um novo exercício
router.post('/', protect, async (req, res) => {
    const { name, description, type, duration_minutes, material, tactical_board_data } = req.body;

    if (!name || !type) {
        return res.status(400).json({ message: 'Nome e Tipo são obrigatórios.' });
    }

    // Valida se o 'type' é um valor válido do Enum (opcional mas bom)
    const validTypes = ['TECNICO', 'TATICO', 'FISICO', 'AQUECIMENTO', 'VOLTA_A_CALMA'];
    if (!validTypes.includes(type.toUpperCase())) {
        return res.status(400).json({ message: 'Tipo de exercício inválido.' });
    }

    try {
        const newExercise = await prisma.exercise.create({
            data: {
                name,
                description,
                type: type.toUpperCase(), // Garante que guarda em maiúsculas como no Enum
                duration_minutes,
                material,
                tactical_board_data, // Prisma lida com JSON
                trainerId: req.user.id,
            },
        });
        res.status(201).json(newExercise);
    } catch (error) {
        console.error("Erro ao criar exercício:", error);
        res.status(500).json({ message: 'Erro interno.' });
    }
});

// GET /api/exercises/:id - Obter um exercício específico
router.get('/:id', protect, async (req, res) => {
    const { id } = req.params;
    try {
        const exercise = await prisma.exercise.findUnique({ where: { id } });
        if (!exercise || exercise.trainerId !== req.user.id) {
            return res.status(404).json({ message: 'Exercício não encontrado.' });
        }
        res.status(200).json(exercise);
    } catch (error) {
        console.error("Erro ao buscar exercício:", error);
        res.status(500).json({ message: 'Erro interno.' });
    }
});

// PUT /api/exercises/:id - Atualizar um exercício
router.put('/:id', protect, async (req, res) => {
    const { id } = req.params;
    const { name, description, type, duration_minutes, material, tactical_board_data } = req.body;

    try {
        const exercise = await prisma.exercise.findUnique({ where: { id } });
        if (!exercise || exercise.trainerId !== req.user.id) {
            return res.status(404).json({ message: 'Exercício não encontrado.' });
        }

        const updatedExercise = await prisma.exercise.update({
            where: { id },
            data: {
                name,
                description,
                type: type ? type.toUpperCase() : undefined, // Atualiza só se for fornecido
                duration_minutes,
                material,
                tactical_board_data,
            },
        });
        res.status(200).json(updatedExercise);
    } catch (error) {
        console.error("Erro ao atualizar exercício:", error);
        res.status(500).json({ message: 'Erro interno.' });
    }
});

// DELETE /api/exercises/:id - Apagar um exercício
router.delete('/:id', protect, async (req, res) => {
    const { id } = req.params;
    try {
        const exercise = await prisma.exercise.findUnique({ where: { id } });
        if (!exercise || exercise.trainerId !== req.user.id) {
            return res.status(404).json({ message: 'Exercício não encontrado.' });
        }

        // IMPORTANTE: Antes de apagar, verificar se está a ser usado em algum plano?
        // Por agora, vamos apagar diretamente, mas no futuro podemos adicionar essa verificação.
        await prisma.exercise.delete({ where: { id } });
        res.status(200).json({ message: 'Exercício apagado com sucesso.' });
    } catch (error) {
         // Se der erro porque está a ser usado (FK constraint), dá um erro mais amigável
        if (error.code === 'P2003' || error.code === 'P2014') {
             return res.status(409).json({ message: 'Não é possível apagar. O exercício está a ser usado num plano de treino.' });
        }
        console.error("Erro ao apagar exercício:", error);
        res.status(500).json({ message: 'Erro interno.' });
    }
});

module.exports = router;