import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField,
  Grid, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import practicePlanService from '../services/practicePlanService';
import exerciseService from '../services/exerciseService';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns'; // Não te esqueças: npm install date-fns

// Tipos de exercício para o Select (de acordo com o Enum no Prisma) - Pode ser útil se quisermos filtrar
// const exerciseTypes = ['TECNICO', 'TATICO', 'FISICO', 'AQUECIMENTO', 'VOLTA_A_CALMA'];

function PracticePlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Estados para o modal de Adicionar Plano
  const [addPlanModalOpen, setAddPlanModalOpen] = useState(false);
  const [allExercises, setAllExercises] = useState([]);
  const [newPlanData, setNewPlanData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    duration_minutes: '',
    exercises: [],
  });
  const [addPlanLoading, setAddPlanLoading] = useState(false);
  const [addPlanError, setAddPlanError] = useState('');

  // Estados para o Modal de Editar Plano
  const [editPlanModalOpen, setEditPlanModalOpen] = useState(false);
  const [currentPlanData, setCurrentPlanData] = useState({
    id: '',
    title: '',
    date: '',
    notes: '',
    duration_minutes: '',
  });
  const [editPlanLoading, setEditPlanLoading] = useState(false);
  const [editPlanError, setEditPlanError] = useState('');

  // Estados para o Modal de Confirmação de Eliminação
  const [deletePlanModalOpen, setDeletePlanModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [deletePlanLoading, setDeletePlanLoading] = useState(false);
  const [deletePlanError, setDeletePlanError] = useState('');

  const loadPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await practicePlanService.getPracticePlans();
      setPlans(data);
    } catch (err) {
      setError(err.response?.data?.message || err.toString());
    } finally {
      setLoading(false);
    }
  };

  const loadAllExercises = async () => {
    try {
      const data = await exerciseService.getExercises();
      setAllExercises(data);
    } catch (err) {
      console.error("Erro ao buscar todos os exercícios:", err);
      // Considera mostrar um erro mais visível se isto falhar e o modal de adicionar for aberto
      setAddPlanError("Não foi possível carregar a lista de exercícios. Tente novamente.");
    }
  };

  useEffect(() => {
    loadPlans();
    loadAllExercises();
  }, []);

  // --- Handlers para Adicionar Plano ---
  const handleOpenAddPlanModal = () => {
    setNewPlanData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      duration_minutes: '',
      exercises: [],
    });
    setAddPlanError('');
    setAddPlanModalOpen(true);
    if (allExercises.length === 0) {
      loadAllExercises();
    }
  };

  const handleCloseAddPlanModal = () => setAddPlanModalOpen(false);

  const handleNewPlanDataChange = (e) => {
    const { name, value } = e.target;
    setNewPlanData(prev => ({ 
        ...prev, 
        [name]: name === 'duration_minutes' ? (value === '' ? '' : parseInt(value,10)) : value 
    }));
  };
  
  const handleAddExerciseToPlan = () => {
    setNewPlanData(prev => ({
        ...prev,
        exercises: [...prev.exercises, { exerciseId: '', order: prev.exercises.length + 1, sets: '', reps: '', rest_seconds: '' }]
    }));
  };

  const handlePlanExerciseChange = (index, field, value) => {
    const updatedExercises = [...newPlanData.exercises];
    let finalValue = value;
    if (field === 'sets' || field === 'rest_seconds' || field === 'order') { // order também é número
        finalValue = value === '' ? '' : parseInt(value, 10);
        if (isNaN(finalValue)) finalValue = '';
    }
    updatedExercises[index] = { ...updatedExercises[index], [field]: finalValue };
    setNewPlanData(prev => ({ ...prev, exercises: updatedExercises }));
  };

  const handleRemoveExerciseFromPlan = (index) => {
    const updatedExercises = newPlanData.exercises.filter((_, i) => i !== index);
    const reorderedExercises = updatedExercises.map((ex, i) => ({ ...ex, order: i + 1 }));
    setNewPlanData(prev => ({ ...prev, exercises: reorderedExercises }));
  };

  const handleCreateNewPlan = async () => {
    if (!newPlanData.title || !newPlanData.date) {
      setAddPlanError('Título e Data são obrigatórios.');
      return;
    }
    if (newPlanData.exercises.some(ex => !ex.exerciseId)) {
        setAddPlanError('Todos os exercícios adicionados devem ser selecionados a partir da lista.');
        return;
    }

    setAddPlanLoading(true);
    setAddPlanError('');
    try {
      const exercisesForApi = newPlanData.exercises.map(ex => ({
        exerciseId: ex.exerciseId,
        order: ex.order,
        sets: ex.sets === '' ? null : parseInt(ex.sets, 10),
        reps: ex.reps || null,
        rest_seconds: ex.rest_seconds === '' ? null : parseInt(ex.rest_seconds, 10),
      }));

      await practicePlanService.createPracticePlan({
        title: newPlanData.title,
        date: newPlanData.date,
        notes: newPlanData.notes,
        duration_minutes: newPlanData.duration_minutes === '' ? null : newPlanData.duration_minutes,
        exercises: exercisesForApi,
      });
      setAddPlanLoading(false);
      handleCloseAddPlanModal();
      loadPlans();
    } catch (err) {
      setAddPlanError(err.response?.data?.message || err.toString());
      setAddPlanLoading(false);
    }
  };
  
  // --- Handlers para Editar Plano (Informações Básicas) ---
  const handleOpenEditPlanModal = (plan) => {
    setCurrentPlanData({
        id: plan.id,
        title: plan.title,
        date: plan.date ? format(new Date(plan.date), 'yyyy-MM-dd') : '',
        notes: plan.notes || '',
        duration_minutes: plan.duration_minutes || '',
    });
    setEditPlanError('');
    setEditPlanModalOpen(true);
  };

  const handleCloseEditPlanModal = () => {
    setEditPlanModalOpen(false);
    setCurrentPlanData({ id: '', title: '', date: '', notes: '', duration_minutes: '' });
  };

  const handleEditPlanDataChange = (e) => {
    const { name, value } = e.target;
    setCurrentPlanData(prev => ({ 
        ...prev, 
        [name]: name === 'duration_minutes' ? (value === '' ? '' : parseInt(value,10)) : value 
    }));
  };

  const handleUpdatePracticePlan = async () => {
    if (!currentPlanData.title || !currentPlanData.date) {
        setEditPlanError('Título e Data são obrigatórios.');
        return;
    }
    setEditPlanLoading(true);
    setEditPlanError('');
    try {
        const dataToUpdate = {
            title: currentPlanData.title,
            date: currentPlanData.date,
            notes: currentPlanData.notes,
            duration_minutes: currentPlanData.duration_minutes === '' ? null : parseInt(currentPlanData.duration_minutes, 10),
        };
        await practicePlanService.updatePracticePlan(currentPlanData.id, dataToUpdate);
        setEditPlanLoading(false);
        handleCloseEditPlanModal();
        loadPlans();
    } catch (err) {
        setEditPlanError(err.response?.data?.message || err.toString());
        setEditPlanLoading(false);
    }
  };

  // --- Handlers para Apagar Plano ---
  const handleOpenDeletePlanModal = (plan) => {
    setPlanToDelete(plan);
    setDeletePlanError('');
    setDeletePlanModalOpen(true);
  };

  const handleCloseDeletePlanModal = () => {
    setDeletePlanModalOpen(false);
    setPlanToDelete(null);
  };

  const handleConfirmDeletePlan = async () => {
    if (!planToDelete) return;
    setDeletePlanLoading(true);
    setDeletePlanError('');
    try {
      await practicePlanService.deletePracticePlan(planToDelete.id);
      setDeletePlanLoading(false);
      handleCloseDeletePlanModal();
      loadPlans();
    } catch (err) {
      setDeletePlanError(err.response?.data?.message || err.toString());
      setDeletePlanLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Meus Planos de Treino
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddPlanModal}>
            Criar Novo Plano
          </Button>
        </Box>

        {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
        {error && <Alert severity="error" sx={{ my: 3 }}>{error}</Alert>}

        {!loading && !error && (
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="tabela de planos de treino">
              <TableHead>
                <TableRow>
                  <TableCell>Título</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell align="center">Nº Exercícios</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {plans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Ainda não tens planos de treino registados.
                    </TableCell>
                  </TableRow>
                ) : (
                  plans.map((plan) => (
                    <TableRow key={plan.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell component="th" scope="row">{plan.title}</TableCell>
                      <TableCell>{format(new Date(plan.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell align="center">{plan._count?.PracticePlanExercises || 0}</TableCell>
                      <TableCell align="right">
                        <IconButton color="default" onClick={() => navigate(`/plans/${plan.id}`)} aria-label="ver detalhes">
                            <VisibilityIcon />
                        </IconButton>
                        <IconButton color="primary" onClick={() => handleOpenEditPlanModal(plan)} aria-label="editar plano">
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleOpenDeletePlanModal(plan)} aria-label="apagar plano">
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

      {/* Modal Adicionar Plano de Treino */}
      <Dialog open={addPlanModalOpen} onClose={handleCloseAddPlanModal} fullWidth maxWidth="md">
        <DialogTitle>Criar Novo Plano de Treino</DialogTitle>
        <DialogContent>
          {addPlanError && <Alert severity="error" sx={{ mb: 2 }}>{addPlanError}</Alert>}
          <Grid container spacing={2} sx={{mt: 1}}>
            <Grid item xs={12} sm={6}> {/* Ajustado para sm={6} */}
              <TextField autoFocus name="title" label="Título do Plano *" type="text" fullWidth variant="outlined" value={newPlanData.title} onChange={handleNewPlanDataChange} disabled={addPlanLoading} />
            </Grid>
            <Grid item xs={12} sm={3}> {/* Ajustado para sm={3} */}
              <TextField name="date" label="Data do Plano *" type="date" fullWidth variant="outlined" value={newPlanData.date} onChange={handleNewPlanDataChange} InputLabelProps={{ shrink: true }} disabled={addPlanLoading} />
            </Grid>
            <Grid item xs={12} sm={3}> {/* Novo campo */}
              <TextField name="duration_minutes" label="Duração (min)" type="number" fullWidth variant="outlined" value={newPlanData.duration_minutes} onChange={handleNewPlanDataChange} disabled={addPlanLoading} InputProps={{ inputProps: { min: 0 } }} />
            </Grid>
            <Grid item xs={12}>
              <TextField name="notes" label="Notas Adicionais" type="text" fullWidth multiline rows={2} variant="outlined" value={newPlanData.notes} onChange={handleNewPlanDataChange} disabled={addPlanLoading} />
            </Grid>
          </Grid>

          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Exercícios do Plano</Typography>
          {newPlanData.exercises.map((ex, index) => (
            <Paper key={index} sx={{ p: 2, mb: 2, border: '1px solid #eee' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3.5}>
                  <Typography variant="body2" component="div" sx={{ fontWeight: 'bold' }}>Exercício {ex.order}:</Typography>
                </Grid>
                <Grid item xs={12} sm={5.5}>
                    <FormControl fullWidth variant="standard" disabled={addPlanLoading}>
                        <InputLabel id={`exercise-select-label-${index}`}>Selecionar Exercício *</InputLabel>
                        <Select labelId={`exercise-select-label-${index}`} name="exerciseId" value={ex.exerciseId} onChange={(e) => handlePlanExerciseChange(index, 'exerciseId', e.target.value)} label="Selecionar Exercício *">
                            <MenuItem value=""><em>Nenhum</em></MenuItem>
                            {allExercises.map(exercise => (<MenuItem key={exercise.id} value={exercise.id}>{exercise.name}</MenuItem>))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={3} textAlign="right">
                    <IconButton onClick={() => handleRemoveExerciseFromPlan(index)} color="error" disabled={addPlanLoading} size="small"> <DeleteIcon /> </IconButton>
                </Grid>
                <Grid item xs={6} sm={2.5}>
                    <TextField label="Séries" name="sets" value={ex.sets} onChange={(e) => handlePlanExerciseChange(index, 'sets', e.target.value)} fullWidth variant="standard" type="number" disabled={addPlanLoading} InputProps={{ inputProps: { min: 0 } }}/>
                </Grid>
                <Grid item xs={6} sm={3.5}>
                    <TextField label="Reps/Tempo" name="reps" value={ex.reps} onChange={(e) => handlePlanExerciseChange(index, 'reps', e.target.value)} fullWidth variant="standard" disabled={addPlanLoading} />
                </Grid>
                <Grid item xs={12} sm={3.5}>
                    <TextField label="Descanso (s)" name="rest_seconds" value={ex.rest_seconds} onChange={(e) => handlePlanExerciseChange(index, 'rest_seconds', e.target.value)} fullWidth variant="standard" type="number" disabled={addPlanLoading} InputProps={{ inputProps: { min: 0 } }}/>
                </Grid>
                 <Grid item xs={12} sm={2.5}> {/* Campo Ordem */}
                    <TextField label="Ordem" name="order" value={ex.order} onChange={(e) => handlePlanExerciseChange(index, 'order', e.target.value)} fullWidth variant="standard" type="number" disabled={addPlanLoading} InputProps={{ inputProps: { min: 1 } }}/>
                </Grid>
              </Grid>
            </Paper>
          ))}
          <Button onClick={handleAddExerciseToPlan} sx={{ mt: 1 }} disabled={addPlanLoading || allExercises.length === 0}> Adicionar Linha de Exercício </Button>
          {allExercises.length === 0 && !addPlanLoading && <Typography variant="caption" color="error" sx={{display: 'block', mt:1}}>Não há exercícios disponíveis. Crie alguns na página 'Gerir Exercícios'.</Typography>}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseAddPlanModal} disabled={addPlanLoading}>Cancelar</Button>
          <Button onClick={handleCreateNewPlan} variant="contained" disabled={addPlanLoading}> {addPlanLoading ? <CircularProgress size={24} /> : 'Criar Plano'} </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Editar Plano (Informações Básicas) */}
      {currentPlanData && editPlanModalOpen && (
        <Dialog open={editPlanModalOpen} onClose={handleCloseEditPlanModal} fullWidth maxWidth="sm">
            <DialogTitle>Editar Plano de Treino</DialogTitle>
            <DialogContent>
                {editPlanError && <Alert severity="error" sx={{ mb: 2 }}>{editPlanError}</Alert>}
                <TextField autoFocus margin="dense" name="title" label="Título do Plano *" type="text" fullWidth variant="outlined" value={currentPlanData.title} onChange={handleEditPlanDataChange} disabled={editPlanLoading} sx={{mb:2}}/>
                <TextField margin="dense" name="date" label="Data do Plano *" type="date" fullWidth variant="outlined" value={currentPlanData.date} onChange={handleEditPlanDataChange} InputLabelProps={{ shrink: true }} disabled={editPlanLoading} sx={{mb:2}}/>
                <TextField margin="dense" name="duration_minutes" label="Duração Estimada (minutos)" type="number" fullWidth variant="outlined" value={currentPlanData.duration_minutes} onChange={handleEditPlanDataChange} InputProps={{ inputProps: { min: 0 } }} disabled={editPlanLoading} sx={{mb:2}}/>
                <TextField margin="dense" name="notes" label="Notas Adicionais" type="text" fullWidth multiline rows={3} variant="outlined" value={currentPlanData.notes} onChange={handleEditPlanDataChange} disabled={editPlanLoading} />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={handleCloseEditPlanModal} disabled={editPlanLoading}>Cancelar</Button>
                <Button onClick={handleUpdatePracticePlan} variant="contained" disabled={editPlanLoading}>
                    {editPlanLoading ? <CircularProgress size={24} /> : 'Guardar Alterações'}
                </Button>
            </DialogActions>
        </Dialog>
      )}

      {/* Modal Confirmar Eliminação de Plano */}
      {planToDelete && (
        <Dialog open={deletePlanModalOpen} onClose={handleCloseDeletePlanModal}>
          <DialogTitle>Confirmar Eliminação</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Tem a certeza que deseja apagar o plano de treino **"{planToDelete.title}"**? Esta ação não pode ser revertida.
            </DialogContentText>
            {deletePlanError && <Alert severity="error" sx={{ mt: 2 }}>{deletePlanError}</Alert>}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseDeletePlanModal} disabled={deletePlanLoading}>Cancelar</Button>
            <Button onClick={handleConfirmDeletePlan} variant="contained" color="error" disabled={deletePlanLoading}>
              {deletePlanLoading ? <CircularProgress size={24} /> : 'Apagar'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
}

export default PracticePlansPage;