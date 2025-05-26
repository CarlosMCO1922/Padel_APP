import axios from 'axios';

const API_URL = 'http://localhost:5000/api/plans/'; // URL base para os planos

// Obter todos os planos de treino do treinador
const getPracticePlans = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar planos de treino:", error);
        throw error.response?.data?.message || "Erro ao buscar planos de treino";
    }
};

// Criar um novo plano de treino
// practicePlanData deve incluir: title, date, notes, e um array 'exercises'
// exercises: [{ exerciseId: '...', order: 1, sets: 3, reps: '10', rest_seconds: 60 }, ...]
const createPracticePlan = async (practicePlanData) => {
    try {
        const response = await axios.post(API_URL, practicePlanData);
        return response.data;
    } catch (error) {
        console.error("Erro ao criar plano de treino:", error);
        throw error.response?.data?.message || "Erro ao criar plano de treino";
    }
};

// Obter um plano de treino específico pelo ID (com exercícios detalhados)
const getPracticePlanById = async (planId) => {
    try {
        const response = await axios.get(API_URL + planId);
        return response.data;
    } catch (error){
        console.error("Erro ao buscar detalhes do plano:", error);
        throw error.response?.data?.message || "Erro ao buscar detalhes do plano";
    }
};

// Apagar um plano de treino
const deletePracticePlan = async (planId) => {
    try {
        const response = await axios.delete(API_URL + planId);
        return response.data;
    } catch (error) {
        console.error("Erro ao apagar plano de treino:", error);
        throw error.response?.data?.message || "Erro ao apagar plano de treino";
    }
};

// Atualizar um plano de treino (informações básicas)
const updatePracticePlan = async (planId, planData) => {
    try {
        // Remove o array 'exercises' e outras contagens/detalhes que não devem ser enviados para este PUT
        const { exercises, PracticePlanExercises, _count, ...basicPlanData } = planData;
        const response = await axios.put(API_URL + planId, basicPlanData);
        return response.data;
    } catch (error) {
        console.error("Erro ao atualizar plano de treino:", error);
        throw error.response?.data?.message || "Erro ao atualizar plano de treino";
    }
};

const practicePlanService = {
    getPracticePlans,
    createPracticePlan,
    getPracticePlanById,
    deletePracticePlan,
    updatePracticePlan, // <-- Adiciona aqui
};

export default practicePlanService;