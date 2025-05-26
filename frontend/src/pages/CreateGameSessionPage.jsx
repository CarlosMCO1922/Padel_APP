import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Button, CircularProgress, Alert,
  TextField, Paper, Grid,
  Autocomplete, // Para selecionar múltiplos alunos
  Chip        // Para mostrar os alunos selecionados no Autocomplete
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import studentService from '../services/studentService'; // Para buscar alunos
import evaluationService from '../services/evaluationService'; // Para criar a sessão

function CreateGameSessionPage() {
  const navigate = useNavigate();
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]); // Guarda os objetos de aluno selecionados
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(true);

  // Carregar todos os alunos para o Autocomplete
  useEffect(() => {
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const studentsData = await studentService.getStudents();
        setAllStudents(studentsData);
      } catch (error) {
        console.error("Erro ao buscar alunos:", error);
        setFormError("Não foi possível carregar a lista de alunos.");
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedStudents.length === 0) {
      setFormError("Selecione pelo menos um aluno.");
      return;
    }
    setLoading(true);
    setFormError('');

    const studentIds = selectedStudents.map(student => student.id);

    try {
      const newSession = await evaluationService.createGameSession({
        date: sessionDate,
        notes,
        studentIds,
      });
      setLoading(false);
      // Após criar, navega para a lista de sessões ou para a página de detalhes/tracking da nova sessão
      // Por agora, vamos para a página de detalhes da sessão recém-criada
      navigate(`/sessions/${newSession.id}`);
    } catch (error) {
      setLoading(false);
      setFormError(error.response?.data?.message || "Erro ao criar sessão.");
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/sessions')} sx={{ mb: 2 }}>
          Voltar para Sessões
        </Button>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Iniciar Nova Sessão de Avaliação
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="sessionDate"
                  label="Data da Sessão"
                  type="date"
                  fullWidth
                  variant="outlined"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  disabled={loading}
                  sx={{mb: 2}}
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  id="students-select"
                  options={allStudents}
                  getOptionLabel={(option) => option.name} // Mostra o nome do aluno na lista
                  value={selectedStudents}
                  onChange={(event, newValue) => {
                    setSelectedStudents(newValue);
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value.id} // Importante para o Autocomplete saber como comparar
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      label="Alunos Participantes *"
                      placeholder="Selecione os alunos"
                      error={!!formError && selectedStudents.length === 0}
                    />
                  )}
                  renderTags={(value, getTagProps) => // Customiza como os alunos selecionados aparecem
                    value.map((option, index) => (
                      <Chip variant="outlined" label={option.name} {...getTagProps({ index })} />
                    ))
                  }
                  loading={loadingStudents}
                  disabled={loading}
                  sx={{mb: 2}}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="Notas da Sessão (opcional)"
                  type="text"
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || loadingStudents}
                  fullWidth
                  sx={{py:1.5}}
                >
                  {loading ? <CircularProgress size={24} /> : 'Criar Sessão e Iniciar Avaliação'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default CreateGameSessionPage;