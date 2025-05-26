import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, CircularProgress, Alert, Paper,
  Button, Grid,
  FormControl, InputLabel, Select, MenuItem,
  List, ListItem, ListItemText, Divider,
  ToggleButton, ToggleButtonGroup, Switch, FormControlLabel
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import evaluationService from '../services/evaluationService';
import { format } from 'date-fns';

// Valores para os Enums (devem corresponder ao backend)
const statTypes = ['WINNER', 'FORCED_ERROR', 'UNFORCED_ERROR'];
const strokeTypes = ['FOREHAND', 'BACKHAND', 'SMASH', 'VOLEIO_DIREITA', 'VOLEIO_ESQUERDA', 'BANDEJA', 'VIBORA', 'SAQUE', 'RESTA', 'GLOBO', 'OUTRO'];
const pointOutcomes = ['GANHO', 'PERDIDO'];
const PADEL_POINTS_DISPLAY = ["0", "15", "30", "40", "AD"]; // Para exibição e lógica de vantagens

function GameSessionDetailPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- ESTADOS PARA O SCORE E REGRA DE PONTO DE OURO ---
  const [useGoldenPoint, setUseGoldenPoint] = useState(true); // Movido para dentro do componente
  const [scoreTeam1, setScoreTeam1] = useState(PADEL_POINTS_DISPLAY[0]);
  const [scoreTeam2, setScoreTeam2] = useState(PADEL_POINTS_DISPLAY[0]);
  const [gamesTeam1, setGamesTeam1] = useState(0);
  const [gamesTeam2, setGamesTeam2] = useState(0);
  // TODO: Adicionar Sets se necessário

  // Estados para o formulário de nova estatística
  const [newStat, setNewStat] = useState({
    studentId: '',
    stat_type: '',
    stroke_type: '',
    point_outcome: '',
  });
  const [statFormError, setStatFormError] = useState('');
  const [statFormLoading, setStatFormLoading] = useState(false);

  // --- LÓGICA DE ATUALIZAÇÃO DE SCORE ---
  const updateScore = (teamThatWonPoint) => { // teamThatWonPoint é 1 ou 2
    let currentPointsWinner, setCurrentPointsWinner, currentPointsLoser, setCurrentPointsLoser;
    let currentGamesWinner, setCurrentGamesWinner;

    if (teamThatWonPoint === 1) {
        currentPointsWinner = scoreTeam1; setCurrentPointsWinner = setScoreTeam1;
        currentPointsLoser = scoreTeam2; setCurrentPointsLoser = setScoreTeam2;
        currentGamesWinner = gamesTeam1; setCurrentGamesWinner = setGamesTeam1;
    } else { // teamThatWonPoint === 2
        currentPointsWinner = scoreTeam2; setCurrentPointsWinner = setScoreTeam2;
        currentPointsLoser = scoreTeam1; setCurrentPointsLoser = setScoreTeam1;
        currentGamesWinner = gamesTeam2; setCurrentGamesWinner = setGamesTeam2;
    }

    let newWinnerDisplayScore = currentPointsWinner;
    let newLoserDisplayScore = currentPointsLoser;

    if (currentPointsWinner === "0") newWinnerDisplayScore = "15";
    else if (currentPointsWinner === "15") newWinnerDisplayScore = "30";
    else if (currentPointsWinner === "30") newWinnerDisplayScore = "40";
    else if (currentPointsWinner === "40") {
        if (currentPointsLoser === "40") { // Estava 40-40
            if (useGoldenPoint) {
                newWinnerDisplayScore = "GAME";
            } else {
                newWinnerDisplayScore = "AD";
            }
        } else if (currentPointsLoser === "AD") { // Estava 40-AD, quem pontuou fez o 40-40
             if (!useGoldenPoint) { // Só acontece se não for ponto de ouro
                newWinnerDisplayScore = "40"; // Volta para 40
                newLoserDisplayScore = "40";  // Adversário também volta para 40
             } else { // No Ponto de Ouro, não deveria chegar a 40-AD
                newWinnerDisplayScore = "GAME"; // Segurança: Se chegou aqui no Ponto de Ouro, é jogo
             }
        } else { // Estava 40-0, 40-15, 40-30
            newWinnerDisplayScore = "GAME";
        }
    } else if (currentPointsWinner === "AD") { // Estava AD-40
         if (!useGoldenPoint) {
            newWinnerDisplayScore = "GAME";
         }  // No Ponto de Ouro, não deveria chegar a AD
    }

    if (newWinnerDisplayScore === "GAME") {
        setCurrentPointsWinner(PADEL_POINTS_DISPLAY[0]); // Reset para "0"
        setCurrentPointsLoser(PADEL_POINTS_DISPLAY[0]);  // Reset para "0"
        setCurrentGamesWinner(prevGames => prevGames + 1);
        console.log(`Equipa ${teamThatWonPoint} ganhou o jogo! Jogos: ${currentGamesWinner + 1}`);
    } else {
        setCurrentPointsWinner(newWinnerDisplayScore);
        if (newLoserDisplayScore !== currentPointsLoser) {
             setCurrentPointsLoser(newLoserDisplayScore);
        }
    }
  };


  const fetchSessionDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await evaluationService.getGameSessionById(sessionId);
      setSession(data);
      if (data && data.students && data.students.length > 0) {
        setNewStat(prev => ({ ...prev, studentId: data.students[0].studentId }));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.toString());
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails();
    }
  }, [sessionId, fetchSessionDetails]);

  const handleNewStatChange = (e) => {
    const { name, value } = e.target;
    setNewStat(prev => ({ ...prev, [name]: value }));
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
      
      // Atualiza o score baseado no resultado do ponto
      // Assumindo que 'point_outcome' se refere ao resultado do ponto para o 'studentId' selecionado
      if (newStat.point_outcome === 'GANHO') {
        // Precisamos determinar a equipa do studentId. Por agora, simplificamos.
        // Se tivermos uma forma de mapear studentId para equipa 1 ou 2, usamos isso.
        // Exemplo: se studentId for da equipa 1, chamamos updateScore(1)
        // Por agora, assumimos que "GANHO" pelo aluno selecionado é para "Equipa 1" (placeholder)
        console.log("Ponto GANHO pelo aluno selecionado, incrementando Equipa 1");
        updateScore(1); 
      } else if (newStat.point_outcome === 'PERDIDO') {
        // Se o aluno selecionado perdeu o ponto (ex: cometeu um erro), a outra equipa ganha.
        console.log("Ponto PERDIDO pelo aluno selecionado, incrementando Equipa 2");
        updateScore(2);
      }

      setNewStat(prev => ({
        ...prev, 
        stat_type: '',
        stroke_type: '',
        point_outcome: '',
      }));
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

  const participatingStudents = session.students?.map(s => s.student) || [];

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/sessions')} sx={{ mb: 2 }}>
          Voltar para Sessões
        </Button>

        <Paper sx={{ p: {xs: 2, md: 3}, mb: 3 }}>
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

        {/* Opção de Ponto de Ouro e Score Display */}
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2, flexDirection: {xs: 'column', sm: 'row'} }}>
                <FormControlLabel
                    control={
                    <Switch
                        checked={useGoldenPoint}
                        onChange={(e) => setUseGoldenPoint(e.target.checked)}
                        name="useGoldenPointSwitch"
                        color="primary"
                    />
                    }
                    label="Usar Ponto de Ouro (em 40-40)"
                />
            </Box>
            <Typography variant="h5" component="h2" gutterBottom align="center">
                Pontuação do Jogo
            </Typography>
            <Grid container spacing={1} justifyContent="center" alignItems="center" textAlign="center">
                <Grid item xs={5}>
                    <Typography variant="h3">{gamesTeam1}</Typography>
                    <Typography variant={scoreTeam1 === "AD" ? "h4" : "h3"} color={scoreTeam1 === "AD" ? "success.main" : "inherit"}>
                        {scoreTeam1}
                    </Typography>
                    <Typography variant="caption">Equipa 1</Typography>
                </Grid>
                <Grid item xs={2}><Typography variant="h3">-</Typography></Grid>
                <Grid item xs={5}>
                    <Typography variant="h3">{gamesTeam2}</Typography>
                    <Typography variant={scoreTeam2 === "AD" ? "h4" : "h3"} color={scoreTeam2 === "AD" ? "success.main" : "inherit"}>
                        {scoreTeam2}
                    </Typography>
                    <Typography variant="caption">Equipa 2</Typography>
                </Grid>
            </Grid>
        </Paper>


        {/* Formulário para Registar Nova Estatística */}
        <Paper sx={{ p: {xs: 2, md: 3}, mb: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Registar Novo Ponto/Jogada
          </Typography>
          <Box component="form" onSubmit={handleRegisterStat} noValidate>
            {statFormError && <Alert severity="error" sx={{ mb: 2 }}>{statFormError}</Alert>}
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined" disabled={statFormLoading || participatingStudents.length === 0}>
                  <InputLabel id="student-select-label">Aluno da Jogada *</InputLabel>
                  <Select
                    labelId="student-select-label"
                    name="studentId"
                    value={newStat.studentId}
                    onChange={handleNewStatChange}
                    label="Aluno da Jogada *"
                  >
                    {participatingStudents.map(s => ( <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem> ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" display="block" gutterBottom>Tipo de Ponto/Erro *</Typography>
                <ToggleButtonGroup value={newStat.stat_type} exclusive
                  onChange={(event, newStatType) => { if (newStatType !== null) { setNewStat(prev => ({ ...prev, stat_type: newStatType })); setStatFormError('');}}}
                  aria-label="tipo de estatística" fullWidth disabled={statFormLoading}
                >
                  {statTypes.map(type => ( <ToggleButton value={type} key={type} sx={{ flexGrow: 1 }}>{type.replace('_', ' ')}</ToggleButton> ))}
                </ToggleButtonGroup>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" display="block" gutterBottom>Pancada Executada *</Typography>
                <Box sx={{ mt: 1 }}>
                  <Grid container spacing={1}>
                    {strokeTypes.map((type) => (
                      <Grid item xs={6} sm={4} md={2} key={type}>
                        <ToggleButton value={type} selected={newStat.stroke_type === type}
                          onChange={() => { setNewStat(prev => ({ ...prev, stroke_type: type })); setStatFormError(''); }}
                          sx={{ width: '100%', textTransform: 'none', height: '56px' }} disabled={statFormLoading}
                        >
                          {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1).toLowerCase()}
                        </ToggleButton>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" display="block" gutterBottom>Quem Ganhou o Ponto? *</Typography>
                <ToggleButtonGroup value={newStat.point_outcome} exclusive
                  onChange={(event, newPointOutcome) => { if (newPointOutcome !== null) { setNewStat(prev => ({ ...prev, point_outcome: newPointOutcome })); setStatFormError(''); }}}
                  aria-label="resultado do ponto" fullWidth disabled={statFormLoading}
                >
                  {pointOutcomes.map(type => ( <ToggleButton value={type} key={type} sx={{ flexGrow: 1 }}> Ponto {type.toLowerCase()} (pelo aluno da jogada) </ToggleButton> ))}
                </ToggleButtonGroup>
              </Grid>
              <Grid item xs={12} sx={{ textAlign: 'center', mt: 2 }}>
                <Button type="submit" variant="contained" size="large" startIcon={<AddCircleOutlineIcon/>} disabled={statFormLoading}>
                  {statFormLoading ? <CircularProgress size={24} color="inherit" /> : 'Registar Jogada'}
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