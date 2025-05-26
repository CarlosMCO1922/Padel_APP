import axios from 'axios';

const API_URL = 'http://localhost:5000/api/exercises/';

// Obter todos os exercícios do treinador
const getExercises = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar exercícios:", error);
        throw error.response?.data?.message || "Erro ao buscar exercícios";
    }
};

// Criar um novo exercício
const createExercise = async (exerciseData) => {
    try {
        const response = await axios.post(API_URL, exerciseData);
        return response.data;
    } catch (error) {
        console.error("Erro ao criar exercício:", error);
        throw error.response?.data?.message || "Erro ao criar exercício";
    }
};

// Atualizar um exercício existente
const updateExercise = async (exerciseId, exerciseData) => {
    try {
        const response = await axios.put(API_URL + exerciseId, exerciseData);
        return response.data;
    } catch (error) {
        console.error("Erro ao atualizar exercício:", error);
        throw error.response?.data?.message || "Erro ao atualizar exercício";
    }
};

// Apagar um exercício existente
const deleteExercise = async (exerciseId) => {
    try {
        const response = await axios.delete(API_URL + exerciseId);
        return response.data;
    } catch (error) {
        console.error("Erro ao apagar exercício:", error);
        throw error.response?.data?.message || "Erro ao apagar exercício";
    }
};

const exerciseService = {
    getExercises,
    createExercise,
    updateExercise,
    deleteExercise,
};

export default exerciseService;