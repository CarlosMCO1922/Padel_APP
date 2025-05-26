import React from 'react';
import { Container, Typography, Button, Box, Grid } from '@mui/material'; // Grid adicionado para layout
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Certifica-te que este caminho está correto
import GroupIcon from '@mui/icons-material/Group'; // Ícone para Alunos
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'; // Ícone para Exercícios
import EventNoteIcon from '@mui/icons-material/EventNote'; // Ícone para Planos de Treino
import ScoreboardIcon from '@mui/icons-material/Scoreboard'; // Ícone para Avaliação de Jogo
import ScienceIcon from '@mui/icons-material/Science';

function DashboardPage() {
  const navigate = useNavigate();
  const { logout } = useAuth(); // Obtém a função de logout do contexto

  const handleLogout = () => {
    logout(); // Limpa o token e o estado do utilizador no contexto
    navigate('/login'); // Redireciona para a página de login
  };

  // Array para os botões de navegação para facilitar a renderização
  const navigationButtons = [
    { label: 'Gerir Alunos', icon: <GroupIcon />, path: '/students' },
    { label: 'Gerir Exercícios', icon: <FitnessCenterIcon />, path: '/exercises' },
    { label: 'Gerir Planos de Treino', icon: <EventNoteIcon />, path: '/plans' },
    { label: 'Avaliação de Jogo', icon: <ScoreboardIcon />, path: '/sessions' },
  ];

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          mt: 4, // margin-top
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center', // Centraliza o conteúdo do Box principal
          gap: 3, // Espaço entre os elementos filhos diretos
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Bem-vindo ao Padel Coach App!
        </Typography>
        <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
          Esta é a tua área principal. Seleciona uma opção abaixo para começar:
        </Typography>

        {/* Grid para os botões de navegação */}
        <Grid container spacing={2} justifyContent="center" sx={{ mb: 3, maxWidth: '700px' }}>
          {navigationButtons.map((item) => (
            <Grid item xs={12} sm={6} key={item.label}> {/* 2 colunas em ecrãs sm, 1 em xs */}
              <Button
                variant="contained"
                startIcon={item.icon}
                onClick={() => navigate(item.path)}
                fullWidth // Faz o botão ocupar a largura da célula do Grid
                sx={{ py: 1.5 }} // py: padding vertical
              >
                {item.label}
              </Button>
            </Grid>
          ))}
        </Grid>

        <Button
          variant="outlined" // Para diferenciar
          startIcon={<ScienceIcon />}
          onClick={() => navigate('/lab/tactical-board')}
          sx={{ flexGrow: 1 }}
        >
          Lab Prancheta
        </Button>

        <Button
          variant="contained"
          color="secondary"
          onClick={handleLogout}
          sx={{ minWidth: '200px' }} // Largura mínima para o botão de logout
        >
          Sair (Logout)
        </Button>
      </Box>
    </Container>
  );
}

export default DashboardPage;