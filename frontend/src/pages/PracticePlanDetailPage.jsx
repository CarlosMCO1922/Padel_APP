import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container, Typography, Box, CircularProgress, Alert, Paper,
  List, ListItem, ListItemText, Divider, Button, IconButton, Grid
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import practicePlanService from '../services/practicePlanService';
import { format } from 'date-fns';

function PracticePlanDetailPage() {
  const { planId } = useParams(); // Obtém o ID do plano da URL
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlanDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await practicePlanService.getPracticePlanById(planId);
        setPlan(data);
      } catch (err) {
        setError(err.toString());
      } finally {
        setLoading(false);
      }
    };

    if (planId) {
      fetchPlanDetails();
    }
  }, [planId]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Container sx={{mt: 2}}><Alert severity="error">{error}</Alert></Container>;
  }

  if (!plan) {
    return <Container sx={{mt: 2}}><Alert severity="warning">Plano não encontrado.</Alert></Container>;
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/plans')} sx={{ mb: 2 }}>
          Voltar para Planos
        </Button>

        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {plan.title}
            </Typography>
            <IconButton
              color="primary"
              // onClick={() => handleOpenEditModal(plan)} // TODO: Lógica de Edição do Plano
              aria-label="editar plano"
            >
              <EditIcon />
            </IconButton>
          </Box>
          <Typography variant="subtitle1" color="text.secondary">
            Data: {format(new Date(plan.date), 'dd/MM/yyyy')}
          </Typography>
          {plan.duration_minutes && (
            <Typography variant="body2" color="text.secondary">
              Duração Estimada: {plan.duration_minutes} minutos
            </Typography>
          )}
          {plan.notes && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">Notas:</Typography>
              <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>{plan.notes}</Typography>
            </Box>
          )}

          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
            Exercícios do Plano:
          </Typography>
          {plan.PracticePlanExercises && plan.PracticePlanExercises.length > 0 ? (
            <List disablePadding>
              {plan.PracticePlanExercises.map((ppe, index) => (
                <React.Fragment key={ppe.id || index}> {/* Adicionado index como fallback para key */}
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={`${ppe.order}. ${ppe.exercise.name} (${ppe.exercise.type.charAt(0) + ppe.exercise.type.slice(1).toLowerCase()})`}
                      secondary={
                        <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                          <Typography component="span" variant="body2" color="text.primary">
                            {ppe.exercise.description || 'Sem descrição.'}
                          </Typography>
                          <br />
                          <Typography component="span" variant="caption" sx={{ mr: 2 }}>
                            Séries: {ppe.sets || 'N/A'}
                          </Typography>
                          <Typography component="span" variant="caption" sx={{ mr: 2 }}>
                            Reps/Tempo: {ppe.reps || 'N/A'}
                          </Typography>
                          <Typography component="span" variant="caption">
                            Descanso: {ppe.rest_seconds ? `${ppe.rest_seconds}s` : 'N/A'}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < plan.PracticePlanExercises.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body1">Este plano ainda não tem exercícios associados.</Typography>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default PracticePlanDetailPage;