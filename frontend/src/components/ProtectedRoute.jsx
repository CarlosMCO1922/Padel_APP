import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

const ProtectedRoute = () => {
  const { token, loading } = useAuth(); // Usa o nosso hook para obter o token e o estado de loading

  // Se ainda estamos a verificar o token inicial, mostra um loader
  if (loading) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
        </Box>
    );
  }

  // Se não há token (e já não estamos a carregar), redireciona para /login
  if (!token) {
    return <Navigate to="/login" replace />; // 'replace' impede de voltar à página protegida no botão "back"
  }

  // Se há token, renderiza o conteúdo da rota (a página protegida)
  return <Outlet />;
};

export default ProtectedRoute;