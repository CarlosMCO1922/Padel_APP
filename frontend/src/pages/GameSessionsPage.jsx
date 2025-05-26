import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
// import DeleteIcon from '@mui/icons-material/Delete'; // Para depois
import evaluationService from '../services/evaluationService';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

function GameSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await evaluationService.getGameSessions();
      setSessions(data);
    } catch (err) {
      setError(err.response?.data?.message || err.toString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleNavigateToNewSession = () => {
    // Navegaremos para uma nova página para criar/iniciar a sessão
    navigate('/sessions/new');
  };

  const handleViewSessionDetails = (sessionId) => {
    // Navegaremos para uma página para ver os detalhes e stats da sessão
    navigate(`/sessions/${sessionId}`);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Sessões de Avaliação
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNavigateToNewSession}
          >
            Iniciar Nova Sessão
          </Button>
        </Box>

        {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
        {error && <Alert severity="error" sx={{ my: 3 }}>{error}</Alert>}

        {!loading && !error && (
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="tabela de sessões de avaliação">
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Notas</TableCell>
                  <TableCell>Alunos</TableCell>
                  <TableCell align="center">Nº Stats</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Ainda não tens sessões de avaliação registadas.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => (
                    <TableRow key={session.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell component="th" scope="row">
                        {format(new Date(session.date), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>{session.notes || 'N/A'}</TableCell>
                      <TableCell>
                        {session.students?.map(s => s.student.name).join(', ') || 'N/A'}
                      </TableCell>
                      <TableCell align="center">{session._count?.stats || 0}</TableCell>
                      <TableCell align="right">
                        <IconButton color="default" onClick={() => handleViewSessionDetails(session.id)} aria-label="ver detalhes">
                            <VisibilityIcon />
                        </IconButton>
                        {/* <IconButton color="error" onClick={() => {}} aria-label="apagar">
                          <DeleteIcon />
                        </IconButton> */}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
      {/* TODO: Modal/Página para Adicionar/Realizar Sessão */}
    </Container>
  );
}

export default GameSessionsPage;