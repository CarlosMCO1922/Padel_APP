// routes/practicePlanRoutes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/authMiddleware');

const prisma = new PrismaClient();

// GET /api/plans - Obter todos os planos de treino do treinador logado
router.get('/', protect, async (req, res) => {
    try {
        const plans = await prisma.practicePlan.findMany({
            where: { trainerId: req.user.id },
            orderBy: { date: 'desc' }, // Ordena pelos mais recentes
            include: {
                // Inclui a contagem de exercícios em cada plano
                _count: {
                    select: { PracticePlanExercises: true },
                }
            }
        });
        res.status(200).json(plans);
    } catch (error) {
        console.error("Erro ao buscar planos:", error);
        res.status(500).json({ message: 'Erro interno.' });
    }
});

// POST /api/plans - Criar um novo plano de treino
router.post('/', protect, async (req, res) => {
    // Esperamos receber: title, date, notes, e um array 'exercises'
    // 'exercises' deve ser [{ exerciseId: '...', order: 1, ...outros_dados }, ...]
    const { title, date, duration_minutes, notes, exercises } = req.body;

    if (!title || !date || !exercises || !Array.isArray(exercises) || exercises.length === 0) {
        return res.status(400).json({ message: 'Título, Data e pelo menos um Exercício são obrigatórios.' });
    }

    try {
        const newPlan = await prisma.practicePlan.create({
            data: {
                title,
                date: new Date(date), // Garante que é um objeto Date
                duration_minutes,
                notes,
                trainerId: req.user.id,
                // Cria as entradas na tabela de junção (PracticePlanExercise)
                PracticePlanExercises: {
                    create: exercises.map(ex => ({
                        exerciseId: ex.exerciseId,
                        order: ex.order,
                        sets: ex.sets,
                        reps: ex.reps,
                        rest_seconds: ex.rest_seconds,
                    }))
                }
            },
            // Inclui os exercícios criados na resposta
            include: {
                PracticePlanExercises: {
                    include: {
                        exercise: true // Inclui os detalhes de cada exercício
                    }
                }
            }
        });
        res.status(201).json(newPlan);
    } catch (error) {
        console.error("Erro ao criar plano:", error);
        // Verifica se o erro é por um exerciseId não existir (P2025) ou FK (P2003)
         if (error.code === 'P2025' || error.code === 'P2003') {
            return res.status(400).json({ message: 'Um ou mais IDs de exercício são inválidos ou não pertencem a si.' });
        }
        res.status(500).json({ message: 'Erro interno.' });
    }
});

// GET /api/plans/:id - Obter um plano específico com detalhes
router.get('/:id', protect, async (req, res) => {
    const { id } = req.params;
    try {
        const plan = await prisma.practicePlan.findUnique({
            where: { id: id },
            include: {
                PracticePlanExercises: {
                    orderBy: { order: 'asc' }, // Ordena os exercícios pela ordem definida
                    include: {
                        exercise: true // Inclui os detalhes completos de cada exercício
                    }
                }
            }
        });

        // Verifica se o plano existe E se pertence ao treinador logado
        if (!plan || plan.trainerId !== req.user.id) {
            return res.status(404).json({ message: 'Plano não encontrado.' });
        }

        res.status(200).json(plan);
    } catch (error) {
        console.error("Erro ao buscar plano:", error);
        res.status(500).json({ message: 'Erro interno.' });
    }
});

// DELETE /api/plans/:id - Apagar um plano específico
router.delete('/:id', protect, async (req, res) => {
    const { id } = req.params;

    try {
        const plan = await prisma.practicePlan.findUnique({ where: { id } });

        if (!plan || plan.trainerId !== req.user.id) {
            return res.status(404).json({ message: 'Plano não encontrado.' });
        }

        // Para apagar um plano, precisamos apagar primeiro as entradas na tabela de junção
        // Fazemos isto dentro de uma transação para garantir que ou tudo funciona, ou nada funciona
        await prisma.$transaction([
            prisma.practicePlanExercise.deleteMany({ where: { practicePlanId: id } }),
            prisma.practicePlan.delete({ where: { id } }),
        ]);

        res.status(200).json({ message: 'Plano apagado com sucesso.' });
    } catch (error) {
        console.error("Erro ao apagar plano:", error);
        res.status(500).json({ message: 'Erro interno.' });
    }
});

router.put('/:id', protect, async (req, res) => {
    const { id } = req.params;
    const { title, date, notes, duration_minutes } = req.body; // Adicionado duration_minutes

    if (!title || !date) {
        return res.status(400).json({ message: 'Título e Data são obrigatórios.' });
    }

    try {
        // Verifica se o plano existe e pertence ao treinador logado
        const plan = await prisma.practicePlan.findUnique({
            where: { id: id },
        });

        if (!plan || plan.trainerId !== req.user.id) {
            return res.status(404).json({ message: 'Plano não encontrado ou não autorizado.' });
        }

        // Atualiza apenas os campos básicos do plano
        const updatedPlan = await prisma.practicePlan.update({
            where: { id: id },
            data: {
                title,
                date: new Date(date),
                notes,
                duration_minutes, // Adicionado
            },
            // Inclui os exercícios para consistência, mas não os modifica aqui
            include: {
                _count: {
                    select: { PracticePlanExercises: true },
                }
            }
        });
        res.status(200).json(updatedPlan);
    } catch (error) {
        console.error("Erro ao atualizar plano:", error);
        res.status(500).json({ message: 'Erro interno ao atualizar o plano.' });
    }
});

module.exports = router;
