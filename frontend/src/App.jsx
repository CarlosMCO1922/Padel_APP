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
  const padelCourtBlue = '#0D6E9F'; // Um azul usado em campos WPT
  const padelBallYellow = '#FFFF00'; // Amarelo vivo (pode ser ajustado)
  const padelAccentGreen = '#9CCC65'; // Um verde-limão alternativo

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: padelCourtBlue, // Cor principal será o azul
    },
    secondary: {
      main: padelBallYellow, // Cor secundária será o amarelo/verde
    },
    background: {
      default: '#121212', // Fundo escuro padrão
      paper: '#1E1E1E',   // Cor para os 'Paper' (caixas, etc.)
    },
    text: {
      primary: '#FFFFFF', // Texto branco para contraste máximo
      secondary: '#BDBDBD', // Cinzento claro para texto secundário
    },
    success: {
        main: padelAccentGreen, // Usar o verde para sucesso
    },
    // Podes ajustar error e warning se quiseres
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600, color: '#FFFFFF' }, // Títulos mais fortes e brancos
    h5: { fontWeight: 500, color: '#E0E0E0' },
    h6: { fontWeight: 500, color: '#CCCCCC' },
    caption: { color: '#A0A0A0' }, // Legendas um pouco mais subtis
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 'bold',
        },
        containedSecondary: { // Para botões amarelos, texto escuro fica melhor
            color: '#000000',
        }
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Garante que não há gradientes estranhos no dark mode
          border: '1px solid rgba(255, 255, 255, 0.08)', // Uma borda subtil
        }
      }
    },
    MuiToggleButton: {
        styleOverrides: {
            root: {
                textTransform: 'none',
                '&.Mui-selected': { // Estilo para botões selecionados
                    backgroundColor: padelBallYellow,
                    color: '#000', // Texto preto para contraste com amarelo
                    '&:hover': {
                        backgroundColor: '#FDD835', // Um amarelo um pouco mais escuro no hover
                    }
                }
            }
        }
    },
     MuiTableCell: {
        styleOverrides: {
            head: { // Cabeçalho das tabelas
                backgroundColor: '#252525',
                fontWeight: 'bold',
            }
        }
     }
  }
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