import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, CircularProgress, Alert, Paper,
  Button, Grid,
  FormControl, InputLabel, Select, MenuItem,
  List, ListItem, ListItemText, Divider,
  ToggleButton, ToggleButtonGroup, Switch, FormControlLabel, Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import evaluationService from '../services/evaluationService';
import studentService from '../services/studentService'; // Precisamos para a lista de todos os alunos, se necessário (mas a sessão já os tem)
import { format } from 'date-fns';

// Valores para os Enums (devem corresponder ao backend)
const statTypes = ['WINNER', 'FORCED_ERROR', 'UNFORCED_ERROR'];
const strokeTypes = ['FOREHAND', 'BACKHAND', 'SMASH', 'VOLEIO_DIREITA', 'VOLEIO_ESQUERDA', 'BANDEJA', 'VIBORA', 'SAQUE', 'RESTA', 'GLOBO', 'OUTRO'];
const PADEL_POINTS_DISPLAY = ["0", "15", "30", "40", "AD"];

function GameSessionDetailPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para o Score e Regra de Ponto de Ouro
  const [useGoldenPoint, setUseGoldenPoint] = useState(true);
  const [scoreTeam1, setScoreTeam1] = useState(PADEL_POINTS_DISPLAY[0]);
  const [scoreTeam2, setScoreTeam2] = useState(PADEL_POINTS_DISPLAY[0]);
  const [gamesTeam1, setGamesTeam1] = useState(0);
  const [gamesTeam2, setGamesTeam2] = useState(0);

  // Estados para atribuição de equipas (array de IDs de alunos)
  const [team1PlayerIds, setTeam1PlayerIds] = useState([]);
  const [team2PlayerIds, setTeam2PlayerIds] = useState([]);

  // Estados para o formulário de nova estatística
  const [newStat, setNewStat] = useState({
    studentId: '',
    stat_type: '',
    stroke_type: '',
    // point_outcome é inferido
  });
  const [statFormError, setStatFormError] = useState('');
  const [statFormLoading, setStatFormLoading] = useState(false);

  const participatingStudents = session?.students?.map(s => s.student) || [];

  // Lógica de atualização de score (como definida anteriormente)
  const updateScore = (teamThatWonPoint) => {
    let currentPointsWinner, setCurrentPointsWinner, currentPointsLoser, setCurrentPointsLoser;
    let currentGamesWinner, setCurrentGamesWinner;

    if (teamThatWonPoint === 1) {
        currentPointsWinner = scoreTeam1; setCurrentPointsWinner = setScoreTeam1;
        currentPointsLoser = scoreTeam2; setCurrentPointsLoser = setScoreTeam2;
        currentGamesWinner = gamesTeam1; setCurrentGamesWinner = setGamesTeam1;
    } else {
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
        if (currentPointsLoser === "40") {
            if (useGoldenPoint) newWinnerDisplayScore = "GAME";
            else newWinnerDisplayScore = "AD";
        } else if (currentPointsLoser === "AD") {
             if (!useGoldenPoint) { newWinnerDisplayScore = "40"; newLoserDisplayScore = "40"; }
             else newWinnerDisplayScore = "GAME";
        } else newWinnerDisplayScore = "GAME";
    } else if (currentPointsWinner === "AD") {
         if (!useGoldenPoint) newWinnerDisplayScore = "GAME";
    }

    if (newWinnerDisplayScore === "GAME") {
        setCurrentPointsWinner(PADEL_POINTS_DISPLAY[0]);
        setCurrentPointsLoser(PADEL_POINTS_DISPLAY[0]);
        const newGamesCount = currentGamesWinner + 1; // Calcula antes para o log
        setCurrentGamesWinner(newGamesCount);
        console.log(`Equipa ${teamThatWonPoint} ganhou o jogo! Jogos: ${newGamesCount}`);
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
      const currentStudents = data?.students?.map(s => s.student) || [];
      if (currentStudents.length > 0) {
        setNewStat(prev => ({ ...prev, studentId: currentStudents[0].id })); // Usa ID do aluno real
        
        // Auto-atribuição inicial simples para equipas
        if (currentStudents.length === 2) {
            setTeam1PlayerIds([currentStudents[0].id]);
            setTeam2PlayerIds([currentStudents[1].id]);
        } else if (currentStudents.length === 4) {
            setTeam1PlayerIds([currentStudents[0].id, currentStudents[1].id]);
            setTeam2PlayerIds([currentStudents[2].id, currentStudents[3].id]);
        } else { // Limpa se não for 2 ou 4, ou se já estiver definido
            setTeam1PlayerIds([]);
            setTeam2PlayerIds([]);
        }
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
    if (!newStat.studentId || !newStat.stat_type || !newStat.stroke_type) {
      setStatFormError('Aluno, Tipo de Ação e Pancada são obrigatórios.');
      return;
    }
    setStatFormLoading(true);
    setStatFormError('');
    let determinedPointOutcome = '';
    if (newStat.stat_type === 'WINNER') determinedPointOutcome = 'GANHO';
    else if (newStat.stat_type === 'FORCED_ERROR' || newStat.stat_type === 'UNFORCED_ERROR') determinedPointOutcome = 'PERDIDO';
    else { setStatFormError('Tipo de ação inválido.'); setStatFormLoading(false); return; }

    try {
      const statDataToSend = { ...newStat, point_outcome: determinedPointOutcome };
      await evaluationService.addStatToSession(sessionId, statDataToSend);
      setNewStat(prev => ({ ...prev, stat_type: '', stroke_type: '' })); // Mantém aluno, limpa o resto
      fetchSessionDetails(); 
    } catch (err) {
      setStatFormError(err.response?.data?.message || "Erro ao registar ação.");
    } finally {
      setStatFormLoading(false);
    }
  };

  const handleTeamPlayerChange = (teamNumber, playerSlotIndex, studentId) => {
    const otherTeamIds = teamNumber === 1 ? team2PlayerIds : team1PlayerIds;
    if (studentId && otherTeamIds.includes(studentId)) {
        alert("Este jogador já está na outra equipa.");
        return;
    }

    if (teamNumber === 1) {
        const newTeam1 = [...team1PlayerIds];
        // Evitar duplicados na mesma equipa
        if(studentId && newTeam1.filter((id, idx) => idx !== playerSlotIndex).includes(studentId)) {
            alert("Este jogador já está nesta equipa noutra posição.");
            return;
        }
        newTeam1[playerSlotIndex] = studentId || ''; // Guarda '' se desmarcar
        setTeam1PlayerIds(newTeam1.slice(0, participatingStudents.length === 2 ? 1 : 2)); // Garante tamanho correto
    } else {
        const newTeam2 = [...team2PlayerIds];
        if(studentId && newTeam2.filter((id, idx) => idx !== playerSlotIndex).includes(studentId)) {
            alert("Este jogador já está nesta equipa noutra posição.");
            return;
        }
        newTeam2[playerSlotIndex] = studentId || '';
        setTeam2PlayerIds(newTeam2.slice(0, participatingStudents.length === 2 ? 1 : 2));
    }
  };

  const getTeamDisplayNames = (teamIds) => {
    if (!participatingStudents || participatingStudents.length === 0) return "Equipa";
    const names = teamIds
        .map(id => participatingStudents.find(s => s.id === id)?.name)
        .filter(Boolean); // Remove undefineds/nulls se um ID não for encontrado ou for ''
    return names.length > 0 ? names.join(' / ') : (teamIds.length > 0 && teamIds.some(id => id === '') ? "Por definir" : "Equipa");
  };
  
  // Filtra opções para os Selects de equipa para evitar duplicados
  const getAvailableStudentsForSelect = (currentTeamIdsToExclude, currentSlotId) => {
      return participatingStudents.filter(s => 
          !currentTeamIdsToExclude.includes(s.id) || s.id === currentSlotId // Permite o jogador já selecionado nesse slot
      );
  };


  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  if (error) return <Container sx={{mt: 2}}><Alert severity="error">{error}</Alert></Container>;
  if (!session) return <Container sx={{mt: 2}}><Alert severity="warning">Sessão de avaliação não encontrada.</Alert></Container>;

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/sessions')} sx={{ mb: 2 }}>
          Voltar para Sessões
        </Button>

        <Paper sx={{ p: {xs: 2, md: 3}, mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Sessão: {format(new Date(session.date), 'dd/MM/yyyy HH:mm')}
          </Typography>
          {session.notes && (<Box sx={{ mt: 2 }}><Typography variant="h6">Notas:</Typography><Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>{session.notes}</Typography></Box>)}
          <Typography variant="h6" sx={{ mt: 2 }}>Alunos Presentes:</Typography>
          <List dense>{participatingStudents.map(student => (<ListItem key={student.id}><ListItemText primary={student.name} /></ListItem>))}</List>
        </Paper>

        {/* Configurar Equipas */}
        {(participatingStudents.length === 2 || participatingStudents.length === 4) && (
          <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom>Configurar Equipas</Typography>
            <Grid container spacing={2}>
              {/* Equipa 1 */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Equipa 1</Typography>
                <FormControl fullWidth sx={{ mb: 1 }}>
                  <InputLabel id="t1p1-label">Jogador 1 (Equipa 1)</InputLabel>
                  <Select labelId="t1p1-label" value={team1PlayerIds[0] || ''} onChange={(e) => handleTeamPlayerChange(1, 0, e.target.value)} label="Jogador 1 (Equipa 1)">
                    <MenuItem value=""><em>Nenhum</em></MenuItem>
                    {getAvailableStudentsForSelect(team2PlayerIds, team1PlayerIds[0]).map(s => (<MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>))}
                  </Select>
                </FormControl>
                {participatingStudents.length === 4 && (
                  <FormControl fullWidth>
                    <InputLabel id="t1p2-label">Jogador 2 (Equipa 1)</InputLabel>
                    <Select labelId="t1p2-label" value={team1PlayerIds[1] || ''} onChange={(e) => handleTeamPlayerChange(1, 1, e.target.value)} label="Jogador 2 (Equipa 1)">
                      <MenuItem value=""><em>Nenhum</em></MenuItem>
                      {getAvailableStudentsForSelect(team2PlayerIds.concat(team1PlayerIds[0] || []), team1PlayerIds[1]).map(s => (<MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>))}
                    </Select>
                  </FormControl>
                )}
              </Grid>
              {/* Equipa 2 */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Equipa 2</Typography>
                <FormControl fullWidth sx={{ mb: 1 }}>
                  <InputLabel id="t2p1-label">Jogador 1 (Equipa 2)</InputLabel>
                  <Select labelId="t2p1-label" value={team2PlayerIds[0] || ''} onChange={(e) => handleTeamPlayerChange(2, 0, e.target.value)} label="Jogador 1 (Equipa 2)">
                    <MenuItem value=""><em>Nenhum</em></MenuItem>
                    {getAvailableStudentsForSelect(team1PlayerIds, team2PlayerIds[0]).map(s => (<MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>))}
                  </Select>
                </FormControl>
                {participatingStudents.length === 4 && (
                  <FormControl fullWidth>
                    <InputLabel id="t2p2-label">Jogador 2 (Equipa 2)</InputLabel>
                    <Select labelId="t2p2-label" value={team2PlayerIds[1] || ''} onChange={(e) => handleTeamPlayerChange(2, 1, e.target.value)} label="Jogador 2 (Equipa 2)">
                      <MenuItem value=""><em>Nenhum</em></MenuItem>
                      {getAvailableStudentsForSelect(team1PlayerIds.concat(team2PlayerIds[0] || []), team2PlayerIds[1]).map(s => (<MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>))}
                    </Select>
                  </FormControl>
                )}
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Score Display */}
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2, flexDirection: {xs: 'column', sm: 'row'} }}>
                <FormControlLabel control={ <Switch checked={useGoldenPoint} onChange={(e) => setUseGoldenPoint(e.target.checked)} name="useGoldenPointSwitch" color="primary" /> } label="Usar Ponto de Ouro (em 40-40)" />
            </Box>
            <Typography variant="h5" component="h2" gutterBottom align="center">Pontuação do Jogo</Typography>
            <Grid container spacing={1} justifyContent="center" alignItems="center" textAlign="center">
                <Grid item xs={5}>
                    <Typography variant="caption" display="block" noWrap>{getTeamDisplayNames(team1PlayerIds) || 'Equipa 1'}</Typography>
                    <Typography variant="h3">{gamesTeam1}</Typography>
                    <Typography variant={scoreTeam1 === "AD" ? "h4" : "h3"} color={scoreTeam1 === "AD" ? "success.main" : "inherit"}>{scoreTeam1}</Typography>
                </Grid>
                <Grid item xs={2}><Typography variant="h3">-</Typography></Grid>
                <Grid item xs={5}>
                    <Typography variant="caption" display="block" noWrap>{getTeamDisplayNames(team2PlayerIds) || 'Equipa 2'}</Typography>
                    <Typography variant="h3">{gamesTeam2}</Typography>
                    <Typography variant={scoreTeam2 === "AD" ? "h4" : "h3"} color={scoreTeam2 === "AD" ? "success.main" : "inherit"}>{scoreTeam2}</Typography>
                </Grid>
            </Grid>
        </Paper>

        {/* Registar Ação */}
        <Paper sx={{ p: {xs: 2, md: 3}, mb: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom>Registar Ação do Ponto</Typography>
          <Box component="form" onSubmit={handleRegisterStat} noValidate>
            {statFormError && <Alert severity="error" sx={{ mb: 2 }}>{statFormError}</Alert>}
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12}><FormControl fullWidth variant="outlined" disabled={statFormLoading || participatingStudents.length === 0}><InputLabel id="student-select-label">Aluno da Ação *</InputLabel><Select labelId="student-select-label" name="studentId" value={newStat.studentId} onChange={handleNewStatChange} label="Aluno da Ação *">{participatingStudents.map(s => ( <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem> ))}</Select></FormControl></Grid>
              <Grid item xs={12}><Typography variant="caption" display="block" gutterBottom>Tipo de Ação *</Typography><ToggleButtonGroup value={newStat.stat_type} exclusive onChange={(event, val) => { if (val !== null) setNewStat(prev => ({ ...prev, stat_type: val })); setStatFormError('');}} fullWidth disabled={statFormLoading}>{statTypes.map(type => ( <ToggleButton value={type} key={type} sx={{ flexGrow: 1 }}>{type.replace('_', ' ')}</ToggleButton> ))}</ToggleButtonGroup></Grid>
              <Grid item xs={12}><Typography variant="caption" display="block" gutterBottom>Pancada Executada *</Typography><Box sx={{ mt: 1 }}> <Grid container spacing={1}>{strokeTypes.map((type) => (<Grid item xs={6} sm={4} md={2} key={type}><ToggleButton value={type} selected={newStat.stroke_type === type} onChange={() => { setNewStat(prev => ({ ...prev, stroke_type: type })); setStatFormError(''); }} sx={{ width: '100%', textTransform: 'none', height: '56px' }} disabled={statFormLoading}>{type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1).toLowerCase()}</ToggleButton></Grid>))}</Grid> </Box></Grid>
              <Grid item xs={12} sx={{ textAlign: 'center', mt: 2 }}><Button type="submit" variant="contained" size="large" startIcon={<AddCircleOutlineIcon/>} disabled={statFormLoading}>{statFormLoading ? <CircularProgress size={24} color="inherit" /> : 'Registar Ação'}</Button></Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Botões de Atribuir Ponto */}
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, textAlign: 'center' }}>
            <Typography variant="h6" component="h3" gutterBottom>Quem ganhou este ponto?</Typography>
            <Grid container spacing={2} justifyContent="center">
                <Grid item xs={12} sm={6}><Button variant="contained" color="success" fullWidth sx={{py: 1.5}} onClick={() => updateScore(1)} disabled={statFormLoading}>Ponto para {getTeamDisplayNames(team1PlayerIds) || 'Equipa 1'}</Button></Grid>
                <Grid item xs={12} sm={6}><Button variant="contained" color="error" fullWidth sx={{py: 1.5}} onClick={() => updateScore(2)} disabled={statFormLoading}>Ponto para {getTeamDisplayNames(team2PlayerIds) || 'Equipa 2'}</Button></Grid>
            </Grid>
        </Paper>

        {/* Lista de Estatísticas */}
        <Typography variant="h5" component="h2" gutterBottom sx={{mt: 3}}>Estatísticas Registadas ({session.stats?.length || 0})</Typography>
        {session.stats && session.stats.length > 0 ? (
          <List component={Paper}>{session.stats.map((stat, index) => (<React.Fragment key={stat.id}><ListItem><ListItemText primary={`${stat.student.name}: ${stat.stat_type} com ${stat.stroke_type} (${stat.point_outcome})`} secondary={`Registado em: ${format(new Date(stat.timestamp), 'dd/MM/yyyy HH:mm:ss')}`}/></ListItem>{index < session.stats.length - 1 && <Divider />}</React.Fragment>))}</List>
        ) : ( <Typography variant="body1">Nenhuma estatística registada para esta sessão.</Typography> )}
      </Box>
    </Container>
  );
}

export default GameSessionDetailPage;