// frontend/src/pages/GameSessionsPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete'; // Importa o ícone de apagar
import evaluationService from '../services/evaluationService';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

function GameSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Estados para o modal de confirmação de eliminação
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);


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
    navigate('/sessions/new');
  };

  const handleViewSessionDetails = (sessionId) => {
    navigate(`/sessions/${sessionId}`);
  };

  // Handlers para apagar sessão
  const handleOpenDeleteModal = (session) => {
    setSessionToDelete(session);
    setDeleteError('');
    setDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setSessionToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await evaluationService.deleteGameSession(sessionToDelete.id);
      setDeleteLoading(false);
      handleCloseDeleteModal();
      loadSessions(); // Recarrega a lista de sessões
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Erro ao apagar sessão.');
      setDeleteLoading(false);
    }
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
                        <IconButton
                            color="error" // Cor para o botão de apagar
                            onClick={() => handleOpenDeleteModal(session)}
                            aria-label="apagar sessão"
                        >
                            <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Modal de Confirmação de Eliminação de Sessão */}
      {sessionToDelete && (
        <Dialog open={deleteModalOpen} onClose={handleCloseDeleteModal}>
          <DialogTitle>Confirmar Eliminação da Sessão</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Tem a certeza que deseja apagar a sessão de {format(new Date(sessionToDelete.date), 'dd/MM/yyyy')}?
              Todas as estatísticas associadas serão perdidas permanentemente.
            </DialogContentText>
            {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
          </DialogContent>
          <DialogActions sx={{p:2}}>
            <Button onClick={handleCloseDeleteModal} disabled={deleteLoading}>Cancelar</Button>
            <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleteLoading}>
              {deleteLoading ? <CircularProgress size={24} /> : 'Apagar Sessão'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
}

export default GameSessionsPage;