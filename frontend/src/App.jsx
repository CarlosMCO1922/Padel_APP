import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import ExercisesPage from './pages/ExercisesPage';
import PracticePlansPage from './pages/PracticePlansPage';
import PracticePlanDetailPage from './pages/PracticePlanDetailPage';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'; 
import ProtectedRoute from './components/ProtectedRoute'; 
import { useAuth } from './context/AuthContext';
import GameSessionsPage from './pages/GameSessionsPage'; 
import CreateGameSessionPage from './pages/CreateGameSessionPage';
import GameSessionDetailPage from './pages/GameSessionDetailPage';
import TacticalBoardLabPage from './pages/TacticalBoardLabPage';
import Layout from './components/Layout';

function App() {
  const { token } = useAuth(); // Obtém o token para redirecionamento inicial

  const darkTheme = createTheme({
  palette: {
    mode: 'dark', // Isto ativa o modo escuro
    // Podes personalizar outras cores aqui se quiseres
    // primary: {
    //   main: '#90caf9', // Exemplo de cor primária para modo escuro
    // },
    // secondary: {
    //   main: '#f48fb1', // Exemplo de cor secundária para modo escuro
    // },
    // background: {
    //   default: '#121212', // Cor de fundo padrão do Material Design para dark mode
    //   paper: '#1e1e1e',   // Cor para superfícies como Paper, Card, etc.
    // },
  },
  // Podes também personalizar tipografia, espaçamentos, etc.
  // typography: {
  //   fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  // },
});

  return (
    <>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Router>
          <Routes>
            {/* Se já há token, /login e /register redirecionam para /dashboard */}
            <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <LoginPage />} />
            <Route path="/register" element={token ? <Navigate to="/dashboard" /> : <RegisterPage />} />
            

            {/* Rotas Protegidas */}
            <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}> {/* <-- LAYOUT AQUI */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/exercises" element={<ExercisesPage />} />
              <Route path="/plans" element={<PracticePlansPage />} />
              <Route path="/plans/:planId" element={<PracticePlanDetailPage />} />
              <Route path="/sessions" element={<GameSessionsPage />} />
              <Route path="/sessions/new" element={<CreateGameSessionPage />} />
              <Route path="/sessions/:sessionId" element={<GameSessionDetailPage />} />
              <Route path="/lab/tactical-board" element={<TacticalBoardLabPage />} />
              {/* Adiciona outras rotas protegidas aqui dentro deste Layout */}
            </Route>
          </Route>

            {/* Rota Padrão */}
            <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </>
  );
}

export default App;