import axios from 'axios';

const API_URL = 'http://localhost:5000/api/sessions/'; // URL base para as sessões de jogo

// Criar uma nova sessão de jogo
// sessionData deve incluir: date (opcional), notes (opcional), studentIds (array de IDs)
const createGameSession = async (sessionData) => {
    try {
        const response = await axios.post(API_URL, sessionData);
        return response.data;
    } catch (error) {
        console.error("Erro ao criar sessão de jogo:", error);
        throw error.response?.data?.message || "Erro ao criar sessão de jogo";
    }
};

// Obter todas as sessões de jogo do treinador
const getGameSessions = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar sessões de jogo:", error);
        throw error.response?.data?.message || "Erro ao buscar sessões de jogo";
    }
};

// Obter uma sessão de jogo específica pelo ID (com alunos e estatísticas)
const getGameSessionById = async (sessionId) => {
    try {
        const response = await axios.get(API_URL + sessionId);
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar detalhes da sessão:", error);
        throw error.response?.data?.message || "Erro ao buscar detalhes da sessão";
    }
};

// Adicionar uma estatística a uma sessão de jogo
// statData deve incluir: studentId, stat_type, stroke_type, point_outcome
const addStatToSession = async (sessionId, statData) => {
    try {
        const response = await axios.post(`${API_URL}${sessionId}/stats`, statData);
        return response.data;
    } catch (error) {
        console.error("Erro ao adicionar estatística:", error);
        throw error.response?.data?.message || "Erro ao adicionar estatística";
    }
};

// TODO: Adicionar deleteGameSession se necessário

const evaluationService = {
    createGameSession,
    getGameSessions,
    getGameSessionById,
    addStatToSession,
};

export default evaluationService;