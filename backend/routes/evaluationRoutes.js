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

// DELETE /api/sessions/:sessionId - Apagar uma sessão de jogo específica
router.delete('/:sessionId', protect, async (req, res) => {
    const { sessionId } = req.params;

    try {
        // Verifica se a sessão existe e pertence ao treinador logado
        const session = await prisma.gameSession.findUnique({
            where: { id: sessionId },
        });

        if (!session || session.trainerId !== req.user.id) {
            return res.status(404).json({ message: 'Sessão não encontrada ou não autorizado.' });
        }

        // Apagar primeiro as entradas dependentes (GameSessionStudent e Stat)
        // ou confiar no onDelete: Cascade definido no schema.
        // Se onDelete: Cascade está no schema para GameSessionStudent e Stat em relação a GameSession,
        // o Prisma trata disso. Vamos confirmar.
        // No schema, Stat e GameSessionStudent têm onDelete: Cascade. Ótimo.

        await prisma.gameSession.delete({
            where: { id: sessionId },
        });

        res.status(200).json({ message: 'Sessão de avaliação apagada com sucesso.' });
    } catch (error) {
        console.error("Erro ao apagar sessão de avaliação:", error);
        // P2003: Foreign key constraint failed on the field: `Stat_gameSessionId_fkey (index)`
        // ou similar se houver dependências não tratadas por cascade
        if (error.code === 'P2003') {
             return res.status(409).json({ message: 'Não é possível apagar. Verifique dependências.' });
        }
        res.status(500).json({ message: 'Erro interno ao apagar a sessão.' });
    }
});

// DELETE /api/sessions/:sessionId/stats/last - Apagar a última estatística registada para uma sessão
router.delete('/:sessionId/stats/last', protect, async (req, res) => {
    const { sessionId } = req.params;

    try {
        // Verifica se a sessão existe e pertence ao treinador logado
        const session = await prisma.gameSession.findUnique({
            where: { id: sessionId },
        });

        if (!session || session.trainerId !== req.user.id) {
            return res.status(404).json({ message: 'Sessão não encontrada ou não autorizado.' });
        }

        // Encontra a estatística mais recente para esta sessão
        const lastStat = await prisma.stat.findFirst({
            where: { gameSessionId: sessionId },
            orderBy: { timestamp: 'desc' }, // Assume que 'timestamp' ou 'createdAt' regista a ordem
        });

        if (!lastStat) {
            return res.status(404).json({ message: 'Nenhuma estatística encontrada para apagar nesta sessão.' });
        }

        // Apaga a última estatística encontrada
        await prisma.stat.delete({
            where: { id: lastStat.id },
        });

        res.status(200).json({ message: 'Última estatística apagada com sucesso.', deletedStatId: lastStat.id });

    } catch (error) {
        console.error("Erro ao apagar última estatística:", error);
        res.status(500).json({ message: 'Erro interno ao apagar a última estatística.' });
    }
});

module.exports = router;