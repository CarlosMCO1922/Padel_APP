import axios from 'axios';

const API_URL = 'http://localhost:5000/api/students/';

// Obtém todos os alunos
const getStudents = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar alunos:", error);
        throw error.response?.data?.message || "Erro ao buscar alunos";
    }
};

// Cria um novo aluno
const createStudent = async (studentData) => {
    try {
        const response = await axios.post(API_URL, studentData);
        return response.data;
    } catch (error) {
        console.error("Erro ao criar aluno:", error);
        throw error.response?.data?.message || "Erro ao criar aluno";
    }
};

// Atualiza um aluno existente
const updateStudent = async (studentId, studentData) => { // <-- Adiciona esta
    try {
        const response = await axios.put(API_URL + studentId, studentData);
        return response.data;
    } catch (error) {
        console.error("Erro ao atualizar aluno:", error);
        throw error.response?.data?.message || "Erro ao atualizar aluno";
    }
};

// Apaga um aluno existente
const deleteStudent = async (studentId) => { // <-- Adiciona esta
    try {
        const response = await axios.delete(API_URL + studentId);
        return response.data;
    } catch (error) {
        console.error("Erro ao apagar aluno:", error);
        throw error.response?.data?.message || "Erro ao apagar aluno";
    }
};

const studentService = {
    getStudents,
    createStudent,
    updateStudent, // <-- Adiciona
    deleteStudent, // <-- Adiciona
};

export default studentService;