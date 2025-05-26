// routes/evaluationRoutes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { protect } = require('../middleware/authMiddleware');

const prisma = new PrismaClient();

// --- Rotas para Sessões de Jogo ---

// POST /api/sessions - Criar uma nova sessão de jogo
router.post('/', protect, async (req, res) => {
    const { date, notes, studentIds } = req.body; // studentIds deve ser um array de IDs

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ message: 'Pelo menos um aluno é obrigatório.' });
    }

    try {
        const newSession = await prisma.gameSession.create({
            data: {
                date: date ? new Date(date) : new Date(),
                notes,
                trainerId: req.user.id,
                students: {
                    create: studentIds.map(id => ({ studentId: id })),
                },
            },
            include: {
                students: { include: { student: true } }
            }
        });
        res.status(201).json(newSession);
    } catch (error) {
        console.error("Erro ao criar sessão:", error);
        if (error.code === 'P2025' || error.code === 'P2003') {
             return res.status(400).json({ message: 'Um ou mais IDs de aluno são inválidos.' });
        }
        res.status(500).json({ message: 'Erro interno.' });
    }
});

// GET /api/sessions - Obter todas as sessões do treinador
router.get('/', protect, async (req, res) => {
    try {
        const sessions = await prisma.gameSession.findMany({
            where: { trainerId: req.user.id },
            orderBy: { date: 'desc' },
            include: {
                students: { select: { student: { select: { id: true, name: true } } } },
                _count: { select: { stats: true } }
            }
        });
        res.status(200).json(sessions);
    } catch (error) {
        console.error("Erro ao buscar sessões:", error);
        res.status(500).json({ message: 'Erro interno.' });
    }
});

// GET /api/sessions/:id - Obter uma sessão específica com estatísticas
 router.get('/:id', protect, async (req, res) => {
    const { id } = req.params;
    try {
        const session = await prisma.gameSession.findUnique({
            where: { id: id },
            include: {
                students: { include: { student: true } },
                stats: { // Inclui todas as estatísticas
                    orderBy: { timestamp: 'asc' },
                    include: { student: true } // Inclui o aluno de cada stat
                }
            }
        });

        if (!session || session.trainerId !== req.user.id) {
            return res.status(404).json({ message: 'Sessão não encontrada.' });
        }
        res.status(200).json(session);
    } catch (error) {
        console.error("Erro ao buscar sessão:", error);
        res.status(500).json({ message: 'Erro interno.' });
    }
});

// --- Rota para Adicionar Estatísticas ---

// POST /api/sessions/:sessionId/stats - Adicionar uma estatística a uma sessão
router.post('/:sessionId/stats', protect, async (req, res) => {
    const { sessionId } = req.params;
    const { studentId, stat_type, stroke_type, point_outcome } = req.body;

    if (!studentId || !stat_type || !stroke_type || !point_outcome) {
        return res.status(400).json({ message: 'Todos os campos da estatística são obrigatórios.' });
    }

    try {
        // Verifica se a sessão existe e pertence ao treinador
        const session = await prisma.gameSession.findUnique({ where: { id: sessionId } });
        if (!session || session.trainerId !== req.user.id) {
            return res.status(404).json({ message: 'Sessão não encontrada.' });
        }
        // TODO: Adicionar verificação se o studentId pertence a esta sessão? (Opcional)

        const newStat = await prisma.stat.create({
            data: {
                stat_type,
                stroke_type,
                point_outcome,
                gameSessionId: sessionId,
                studentId,
            }
        });
        res.status(201).json(newStat);
    } catch (error) {
        console.error("Erro ao adicionar estatística:", error);
        res.status(500).json({ message: 'Erro interno.' });
    }
});

// TODO: Adicionar rotas DELETE para Sessões e talvez para Stats

module.exports = router;