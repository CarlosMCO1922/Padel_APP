import React from 'react';
import { Container, Typography, Box, Paper, Button } from '@mui/material';
import TacticalBoard from '../components/TacticalBoard'; // Importa o nosso componente
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

function TacticalBoardLabPage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
          Voltar ao Dashboard
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          Laboratório da Prancheta Tática
        </Typography>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <TacticalBoard />
        </Paper>
      </Box>
    </Container>
  );
}

export default TacticalBoardLabPage;