import React, { useState, useEffect, useCallback } from 'react'; // Adicionado useCallback
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, CircularProgress, Alert, Paper,
  Button, Grid, // Grid para layout do formulário de stats
  FormControl, InputLabel, Select, MenuItem, // Para os dropdowns de stats
  List, ListItem, ListItemText, Divider // Para listar stats existentes
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'; // Ícone para registar stat
import evaluationService from '../services/evaluationService'; // Mudar para evaluationService
import { format } from 'date-fns';

// Valores para os Enums (devem corresponder ao backend)
const statTypes = ['WINNER', 'FORCED_ERROR', 'UNFORCED_ERROR'];
const strokeTypes = ['FOREHAND', 'BACKHAND', 'SMASH', 'VOLEIO_DIREITA', 'VOLEIO_ESQUERDA', 'BANDEJA', 'VIBORA', 'SAQUE', 'RESTA', 'GLOBO', 'OUTRO'];
const pointOutcomes = ['GANHO', 'PERDIDO'];

function GameSessionDetailPage() {
  const { sessionId } = useParams(); // Mudar para sessionId
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para o formulário de nova estatística
  const [newStat, setNewStat] = useState({
    studentId: '',
    stat_type: '',
    stroke_type: '',
    point_outcome: '',
  });
  const [statFormError, setStatFormError] = useState('');
  const [statFormLoading, setStatFormLoading] = useState(false);

  // Usamos useCallback para evitar recriações desnecessárias da função
  const fetchSessionDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await evaluationService.getGameSessionById(sessionId);
      setSession(data);
      // Se houver alunos, pré-seleciona o primeiro para o formulário de stat
      if (data && data.students && data.students.length > 0) {
        setNewStat(prev => ({ ...prev, studentId: data.students[0].studentId }));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.toString());
    } finally {
      setLoading(false);
    }
  }, [sessionId]); // Dependência do sessionId

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails();
    }
  }, [sessionId, fetchSessionDetails]); // Adiciona fetchSessionDetails às dependências

  const handleNewStatChange = (e) => {
    setNewStat(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setStatFormError('');
  };

  const handleRegisterStat = async (e) => {
    e.preventDefault();
    if (!newStat.studentId || !newStat.stat_type || !newStat.stroke_type || !newStat.point_outcome) {
      setStatFormError('Todos os campos são obrigatórios para registar a estatística.');
      return;
    }
    setStatFormLoading(true);
    setStatFormError('');
    try {
      await evaluationService.addStatToSession(sessionId, newStat);
      // Limpa o formulário (exceto talvez o studentId se quisermos registar várias para o mesmo)
      setNewStat(prev => ({
        ...prev, // Mantém o studentId selecionado
        stat_type: '',
        stroke_type: '',
        point_outcome: '',
      }));
      // Recarrega os detalhes da sessão para ver a nova estatística
      fetchSessionDetails();
    } catch (err) {
      setStatFormError(err.response?.data?.message || "Erro ao registar estatística.");
    } finally {
      setStatFormLoading(false);
    }
  };


  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Container sx={{mt: 2}}><Alert severity="error">{error}</Alert></Container>;
  }

  if (!session) {
    return <Container sx={{mt: 2}}><Alert severity="warning">Sessão de avaliação não encontrada.</Alert></Container>;
  }

  // Extrai os alunos da sessão para o dropdown
  const participatingStudents = session.students?.map(s => s.student) || [];

  return (
    <Container maxWidth="lg"> {/* Aumentado para lg para mais espaço */}
      <Box sx={{ my: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/sessions')} sx={{ mb: 2 }}>
          Voltar para Sessões
        </Button>

        <Paper sx={{ p: {xs: 2, md: 3}, mb: 3 }}> {/* Padding responsivo */}
          <Typography variant="h4" component="h1" gutterBottom>
            Detalhes da Sessão de Avaliação
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Data: {format(new Date(session.date), 'dd/MM/yyyy HH:mm')}
          </Typography>
          {session.notes && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">Notas:</Typography>
              <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>{session.notes}</Typography>
            </Box>
          )}
          <Typography variant="h6" sx={{ mt: 2 }}>Alunos Participantes:</Typography>
          <List dense>
            {participatingStudents.map(student => (
              <ListItem key={student.id}><ListItemText primary={student.name} /></ListItem>
            ))}
          </List>
        </Paper>

        {/* Formulário para Registar Nova Estatística */}
        <Paper sx={{ p: {xs: 2, md: 3}, mb: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Registar Nova Estatística
          </Typography>
          <Box component="form" onSubmit={handleRegisterStat} noValidate>
            {statFormError && <Alert severity="error" sx={{ mb: 2 }}>{statFormError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth variant="outlined" disabled={statFormLoading || participatingStudents.length === 0}>
                  <InputLabel id="student-select-label">Aluno *</InputLabel>
                  <Select
                    labelId="student-select-label"
                    name="studentId"
                    value={newStat.studentId}
                    onChange={handleNewStatChange}
                    label="Aluno *"
                  >
                    {participatingStudents.map(s => (
                      <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth variant="outlined" disabled={statFormLoading}>
                  <InputLabel id="stat-type-label">Tipo de Estatística *</InputLabel>
                  <Select labelId="stat-type-label" name="stat_type" value={newStat.stat_type} onChange={handleNewStatChange} label="Tipo de Estatística *">
                    {statTypes.map(type => (<MenuItem key={type} value={type}>{type.replace('_', ' ')}</MenuItem>))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth variant="outlined" disabled={statFormLoading}>
                  <InputLabel id="stroke-type-label">Pancada *</InputLabel>
                  <Select labelId="stroke-type-label" name="stroke_type" value={newStat.stroke_type} onChange={handleNewStatChange} label="Pancada *">
                    {strokeTypes.map(type => (<MenuItem key={type} value={type}>{type.replace('_', ' ')}</MenuItem>))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth variant="outlined" disabled={statFormLoading}>
                  <InputLabel id="point-outcome-label">Resultado do Ponto *</InputLabel>
                  <Select labelId="point-outcome-label" name="point_outcome" value={newStat.point_outcome} onChange={handleNewStatChange} label="Resultado do Ponto *">
                    {pointOutcomes.map(type => (<MenuItem key={type} value={type}>{type}</MenuItem>))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sx={{textAlign: 'right'}}>
                <Button type="submit" variant="contained" startIcon={<AddCircleOutlineIcon/>} disabled={statFormLoading} sx={{mt:1}}>
                  {statFormLoading ? <CircularProgress size={24} /> : 'Registar Ponto'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Lista de Estatísticas Registadas */}
        <Typography variant="h5" component="h2" gutterBottom sx={{mt: 3}}>
          Estatísticas Registadas ({session.stats?.length || 0})
        </Typography>
        {session.stats && session.stats.length > 0 ? (
          <List component={Paper}>
            {session.stats.map((stat, index) => (
              <React.Fragment key={stat.id}>
                <ListItem>
                  <ListItemText
                    primary={`${stat.student.name}: ${stat.stat_type} com ${stat.stroke_type} (${stat.point_outcome})`}
                    secondary={`Registado em: ${format(new Date(stat.timestamp), 'dd/MM/yyyy HH:mm:ss')}`}
                  />
                </ListItem>
                {index < session.stats.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography variant="body1">Nenhuma estatística registada para esta sessão.</Typography>
        )}
      </Box>
    </Container>
  );
}

export default GameSessionDetailPage;