import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
// Podes instalar jwt-decode para ler dados do token: npm install jwt-decode
// import { jwtDecode } from 'jwt-decode'; // Descomenta se instalares

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null); // Poderemos guardar dados do user aqui
  const [loading, setLoading] = useState(true); // Para saber se já verificámos o token inicial

  // Efeito para verificar o token ao carregar a app
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      // Opcional: Aqui poderias verificar o token com a API ou decodificá-lo
      // Ex: const decoded = jwtDecode(storedToken); setUser(decoded);
      // Configura o Axios para enviar o token em todos os pedidos futuros
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setLoading(false); // Terminámos a verificação inicial
  }, []);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    // Opcional: Decodificar ou buscar dados do user
    // const decoded = jwtDecode(newToken); setUser(decoded);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  // O valor que será partilhado com os componentes filhos
  const value = {
    token,
    user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar o contexto facilmente
export const useAuth = () => {
  return useContext(AuthContext);
};