import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField,
  MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import exerciseService from '../services/exerciseService';

const exerciseTypes = ['TECNICO', 'TATICO', 'FISICO', 'AQUECIMENTO', 'VOLTA_A_CALMA'];

function ExercisesPage() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Adicionar Exercício
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newExerciseData, setNewExerciseData] = useState({
    name: '', description: '', type: '', duration_minutes: '', material: '',
  });
  const [addModalLoading, setAddModalLoading] = useState(false);
  const [addModalError, setAddModalError] = useState('');

  // Editar Exercício
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [editModalLoading, setEditModalLoading] = useState(false);
  const [editModalError, setEditModalError] = useState('');

  // Apagar Exercício
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  const [deleteModalLoading, setDeleteModalLoading] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState('');

  const loadExercises = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await exerciseService.getExercises();
      setExercises(data);
    } catch (err) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExercises();
  }, []);

  // --- Handlers Adicionar ---
  const handleOpenAddModal = () => {
    setNewExerciseData({ name: '', description: '', type: '', duration_minutes: '', material: '' });
    setAddModalError('');
    setAddModalOpen(true);
  };
  const handleCloseAddModal = () => setAddModalOpen(false);
  const handleNewExerciseChange = (e) => {
    const { name, value } = e.target;
    setNewExerciseData(prev => ({
      ...prev,
      [name]: name === 'duration_minutes' ? (value === '' ? '' : parseInt(value, 10)) : value
    }));
  };
  const handleAddNewExercise = async () => {
    if (!newExerciseData.name || !newExerciseData.type) {
      setAddModalError('Nome e Tipo são obrigatórios.');
      return;
    }
    setAddModalLoading(true);
    setAddModalError('');
    try {
      const dataToSubmit = { ...newExerciseData, duration_minutes: newExerciseData.duration_minutes === '' ? null : newExerciseData.duration_minutes };
      await exerciseService.createExercise(dataToSubmit);
      setAddModalLoading(false);
      handleCloseAddModal();
      loadExercises();
    } catch (err) {
      setAddModalError(err.response?.data?.message || err.toString());
      setAddModalLoading(false);
    }
  };

  // --- Handlers Editar ---
  const handleOpenEditModal = (exercise) => {
    setCurrentExercise({ ...exercise, duration_minutes: exercise.duration_minutes || '' }); // Garante que é string para o TextField type="number"
    setEditModalError('');
    setEditModalOpen(true);
  };
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setCurrentExercise(null);
  };
  const handleEditExerciseChange = (e) => {
    const { name, value } = e.target;
    setCurrentExercise(prev => ({
      ...prev,
      [name]: name === 'duration_minutes' ? (value === '' ? '' : parseInt(value, 10)) : value
    }));
  };
  const handleUpdateExercise = async () => {
    if (!currentExercise || !currentExercise.name || !currentExercise.type) {
      setEditModalError('Nome e Tipo são obrigatórios.');
      return;
    }
    setEditModalLoading(true);
    setEditModalError('');
    try {
      const dataToSubmit = { ...currentExercise, duration_minutes: currentExercise.duration_minutes === '' ? null : currentExercise.duration_minutes };
      await exerciseService.updateExercise(currentExercise.id, dataToSubmit);
      setEditModalLoading(false);
      handleCloseEditModal();
      loadExercises();
    } catch (err) {
      setEditModalError(err.response?.data?.message || err.toString());
      setEditModalLoading(false);
    }
  };

  // --- Handlers Apagar ---
  const handleOpenDeleteModal = (exercise) => {
    setExerciseToDelete(exercise);
    setDeleteModalError('');
    setDeleteModalOpen(true);
  };
  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setExerciseToDelete(null);
  };
  const handleConfirmDelete = async () => {
    if (!exerciseToDelete) return;
    setDeleteModalLoading(true);
    setDeleteModalError('');
    try {
      await exerciseService.deleteExercise(exerciseToDelete.id);
      setDeleteModalLoading(false);
      handleCloseDeleteModal();
      loadExercises();
    } catch (err) {
      setDeleteModalError(err.response?.data?.message || err.toString());
      setDeleteModalLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Meus Exercícios
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddModal}>
            Adicionar Exercício
          </Button>
        </Box>

        {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
        {error && <Alert severity="error" sx={{ my: 3 }}>{error}</Alert>}

        {!loading && !error && (
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="tabela de exercícios">
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Duração (min)</TableCell>
                  <TableCell>Material</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exercises.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center">Ainda não tens exercícios registados.</TableCell></TableRow>
                ) : (
                  exercises.map((exercise) => (
                    <TableRow key={exercise.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell component="th" scope="row">{exercise.name}</TableCell>
                      <TableCell>{exercise.type}</TableCell>
                      <TableCell>{exercise.duration_minutes || 'N/A'}</TableCell>
                      <TableCell>{exercise.material || 'N/A'}</TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" onClick={() => handleOpenEditModal(exercise)} aria-label="editar">
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleOpenDeleteModal(exercise)} aria-label="apagar">
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

      {/* Modal Adicionar Exercício */}
      <Dialog open={addModalOpen} onClose={handleCloseAddModal} disableRestoreFocus>
        <DialogTitle>Adicionar Novo Exercício</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>Preenche os dados do novo exercício.</DialogContentText>
          {addModalError && <Alert severity="error" sx={{ mb: 2 }}>{addModalError}</Alert>}
          <TextField autoFocus margin="dense" name="name" label="Nome do Exercício *" type="text" fullWidth variant="standard" value={newExerciseData.name} onChange={handleNewExerciseChange} disabled={addModalLoading} />
          <FormControl fullWidth margin="dense" variant="standard" disabled={addModalLoading} error={!!addModalError && newExerciseData.type === ''}>
            <InputLabel id="type-add-label">Tipo *</InputLabel>
            <Select labelId="type-add-label" name="type" value={newExerciseData.type} onChange={handleNewExerciseChange} label="Tipo *">
              {exerciseTypes.map((type) => (<MenuItem key={type} value={type}>{type.charAt(0) + type.slice(1).toLowerCase()}</MenuItem>))}
            </Select>
          </FormControl>
          <TextField margin="dense" name="description" label="Descrição" type="text" fullWidth multiline rows={3} variant="standard" value={newExerciseData.description} onChange={handleNewExerciseChange} disabled={addModalLoading} />
          <TextField margin="dense" name="duration_minutes" label="Duração Sugerida (minutos)" type="number" fullWidth variant="standard" value={newExerciseData.duration_minutes} onChange={handleNewExerciseChange} disabled={addModalLoading} InputProps={{ inputProps: { min: 0 } }} />
          <TextField margin="dense" name="material" label="Material Necessário" type="text" fullWidth variant="standard" value={newExerciseData.material} onChange={handleNewExerciseChange} disabled={addModalLoading} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseAddModal} disabled={addModalLoading}>Cancelar</Button>
          <Button onClick={handleAddNewExercise} variant="contained" disabled={addModalLoading}>
            {addModalLoading ? <CircularProgress size={24} /> : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Editar Exercício */}
      {currentExercise && (
        <Dialog open={editModalOpen} onClose={handleCloseEditModal} disableRestoreFocus>
          <DialogTitle>Editar Exercício</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>Atualize os dados do exercício.</DialogContentText>
            {editModalError && <Alert severity="error" sx={{ mb: 2 }}>{editModalError}</Alert>}
            <TextField autoFocus margin="dense" name="name" label="Nome do Exercício *" type="text" fullWidth variant="standard" value={currentExercise.name} onChange={handleEditExerciseChange} disabled={editModalLoading} />
            <FormControl fullWidth margin="dense" variant="standard" disabled={editModalLoading} error={!!editModalError && currentExercise.type === ''}>
              <InputLabel id="type-edit-label">Tipo *</InputLabel>
              <Select labelId="type-edit-label" name="type" value={currentExercise.type} onChange={handleEditExerciseChange} label="Tipo *">
                {exerciseTypes.map((type) => (<MenuItem key={type} value={type}>{type.charAt(0) + type.slice(1).toLowerCase()}</MenuItem>))}
              </Select>
            </FormControl>
            <TextField margin="dense" name="description" label="Descrição" type="text" fullWidth multiline rows={3} variant="standard" value={currentExercise.description || ''} onChange={handleEditExerciseChange} disabled={editModalLoading} />
            <TextField margin="dense" name="duration_minutes" label="Duração Sugerida (minutos)" type="number" fullWidth variant="standard" value={currentExercise.duration_minutes || ''} onChange={handleEditExerciseChange} disabled={editModalLoading} InputProps={{ inputProps: { min: 0 } }} />
            <TextField margin="dense" name="material" label="Material Necessário" type="text" fullWidth variant="standard" value={currentExercise.material || ''} onChange={handleEditExerciseChange} disabled={editModalLoading} />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseEditModal} disabled={editModalLoading}>Cancelar</Button>
            <Button onClick={handleUpdateExercise} variant="contained" disabled={editModalLoading}>
              {editModalLoading ? <CircularProgress size={24} /> : 'Guardar Alterações'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Modal Confirmar Eliminação */}
      {exerciseToDelete && (
        <Dialog open={deleteModalOpen} onClose={handleCloseDeleteModal}>
          <DialogTitle>Confirmar Eliminação</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Tem a certeza que deseja apagar o exercício **{exerciseToDelete.name}**? Esta ação não pode ser revertida.
            </DialogContentText>
            {deleteModalError && <Alert severity="error" sx={{ mt: 2 }}>{deleteModalError}</Alert>}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseDeleteModal} disabled={deleteModalLoading}>Cancelar</Button>
            <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={deleteModalLoading}>
              {deleteModalLoading ? <CircularProgress size={24} /> : 'Apagar'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
}

export default ExercisesPage;