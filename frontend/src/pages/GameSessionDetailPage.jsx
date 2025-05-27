// frontend/src/pages/GameSessionDetailPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, CircularProgress, Alert, Paper,
  Button, Grid, Stack, useTheme, useMediaQuery,
  FormControl, InputLabel, Select, MenuItem,
  List, ListItem, ListItemText, Divider, // List e ListItem podem ser removidos se não mostrares stats individuais
  ToggleButton, ToggleButtonGroup, Switch, FormControlLabel, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton as MuiIconButton // Renomeado para evitar conflito se usares outro IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import UndoIcon from '@mui/icons-material/Undo'; // Ícone para "Apagar Ponto Anterior"
import evaluationService from '../services/evaluationService';
import { format } from 'date-fns';

// Constantes
const statTypes = ['WINNER', 'FORCED_ERROR', 'UNFORCED_ERROR'];
const strokeTypes = ['FOREHAND', 'BACKHAND', 'SMASH', 'VOLEIO_DIREITA', 'VOLEIO_ESQUERDA', 'BANDEJA', 'VIBORA', 'SAQUE', 'RESTA', 'GLOBO', 'OUTRO'];
const PADEL_POINTS_DISPLAY = ["0", "15", "30", "40", "AD"];

// Função auxiliar
const formatLabel = (str) => str ? str.replace(/_/g, ' ').charAt(0).toUpperCase() + str.replace(/_/g, ' ').slice(1).toLowerCase() : '';


function GameSessionDetailPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aggregatedStats, setAggregatedStats] = useState({});

  // Score & Golden Point
  const [useGoldenPoint, setUseGoldenPoint] = useState(true);
  const [scoreTeam1, setScoreTeam1] = useState(PADEL_POINTS_DISPLAY[0]);
  const [scoreTeam2, setScoreTeam2] = useState(PADEL_POINTS_DISPLAY[0]);
  const [gamesTeam1, setGamesTeam1] = useState(0);
  const [gamesTeam2, setGamesTeam2] = useState(0);

  // Team Assignments
  const [team1PlayerIds, setTeam1PlayerIds] = useState([]);
  const [team2PlayerIds, setTeam2PlayerIds] = useState([]);

  // New Stat Form
  const [newStat, setNewStat] = useState({ studentId: '', stat_type: '', stroke_type: '' });
  const [statFormError, setStatFormError] = useState('');
  const [statFormLoading, setStatFormLoading] = useState(false);

  // Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalPlayerStats, setDetailModalPlayerStats] = useState(null);

  const participatingStudents = useMemo(() => {
    if (!session?.students) return [];
    return session.students.map(s => s.student).filter(Boolean);
  }, [session?.students]);

  const updateScore = useCallback((teamThatWonPoint) => {
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
        const newGamesCount = currentGamesWinner + 1;
        setCurrentGamesWinner(newGamesCount);
    } else {
        setCurrentPointsWinner(newWinnerDisplayScore);
        if (newLoserDisplayScore !== currentPointsLoser) {
             setCurrentPointsLoser(newLoserDisplayScore);
        }
    }
  }, [scoreTeam1, scoreTeam2, gamesTeam1, gamesTeam2, useGoldenPoint]);


  const fetchSessionDetails = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await evaluationService.getGameSessionById(sessionId);
      setSession(data);
      const currentStudents = data?.students?.map(s => s.student).filter(Boolean) || [];
      if (currentStudents.length > 0) {
        setNewStat(prev => ({ ...prev, studentId: currentStudents.find(s => s.id === prev.studentId) ? prev.studentId : currentStudents[0].id }));
        if (team1PlayerIds.length === 0 && team2PlayerIds.length === 0) { 
            if (currentStudents.length === 2) {
                setTeam1PlayerIds([currentStudents[0].id]);
                setTeam2PlayerIds([currentStudents[1].id]);
            } else if (currentStudents.length >= 4) { 
                setTeam1PlayerIds([currentStudents[0].id, currentStudents[1].id]);
                setTeam2PlayerIds([currentStudents[2].id, currentStudents[3].id]);
            }
        }
      }
    } catch (err) { setError(err.response?.data?.message || err.toString());
    } finally { setLoading(false); }
  }, [sessionId]); // Removido team1PlayerIds e team2PlayerIds para evitar loops na carga inicial, a atribuição é feita uma vez.

  useEffect(() => {
    if (sessionId) fetchSessionDetails();
  }, [sessionId, fetchSessionDetails]);

  useEffect(() => {
    if (session && session.stats && participatingStudents.length > 0) {
        const newAggregatedStats = {};
        participatingStudents.forEach(player => {
            if (player && player.id) {
                newAggregatedStats[player.id] = { name: player.name, totals: { WINNER: 0, FORCED_ERROR: 0, UNFORCED_ERROR: 0 }, byStroke: {} };
                strokeTypes.forEach(stroke => { newAggregatedStats[player.id].byStroke[stroke] = { WINNER: 0, FORCED_ERROR: 0, UNFORCED_ERROR: 0 }; });
            }
        });
        session.stats.forEach(stat => {
            if (stat && stat.studentId && newAggregatedStats[stat.studentId]) {
                const playerStats = newAggregatedStats[stat.studentId];
                if (playerStats.totals.hasOwnProperty(stat.stat_type)) playerStats.totals[stat.stat_type]++;
                if (playerStats.byStroke[stat.stroke_type] && playerStats.byStroke[stat.stroke_type].hasOwnProperty(stat.stat_type)) {
                    playerStats.byStroke[stat.stroke_type][stat.stat_type]++;
                }
            }
        });
        setAggregatedStats(prevAggregatedStats => {
            if (JSON.stringify(prevAggregatedStats) !== JSON.stringify(newAggregatedStats)) {
                return newAggregatedStats;
            }
            return prevAggregatedStats;
        });
    } else {
        if (Object.keys(aggregatedStats).length > 0) setAggregatedStats({});
    }
  }, [session, participatingStudents]);


    const handleTeamPlayerChange = (teamNumber, playerSlotIndex, studentId) => {
        const currentTeamSetter = teamNumber === 1 ? setTeam1PlayerIds : setTeam2PlayerIds;
        const currentTeamIds = teamNumber === 1 ? team1PlayerIds : team2PlayerIds;
        const otherTeamIds = teamNumber === 1 ? team2PlayerIds : team1PlayerIds;

        if (studentId && otherTeamIds.includes(studentId)) {
            alert("Este jogador já está na outra equipa."); return;
        }
        
        const newTeamConfig = [...currentTeamIds];
        // Ajusta o tamanho do array se necessário (para 1 ou 2 jogadores por equipa)
        const requiredSize = participatingStudents.length === 2 ? 1 : 2;
        while(newTeamConfig.length < requiredSize) newTeamConfig.push('');


        if(studentId && newTeamConfig.filter((id, idx) => idx !== playerSlotIndex).includes(studentId)) {
            alert("Este jogador já está nesta equipa noutra posição."); return;
        }
        
        newTeamConfig[playerSlotIndex] = studentId || '';
        currentTeamSetter(newTeamConfig.slice(0, requiredSize));
    };

    const getTeamDisplayNames = (teamIds) => {
        if (!participatingStudents || participatingStudents.length === 0 || teamIds.length === 0) return "Equipa";
        const names = teamIds.map(id => participatingStudents.find(s => s.id === id)?.name).filter(Boolean);
        return names.length > 0 ? names.join(' / ') : "A definir";
    };
    
    const getAvailableStudentsForSelect = (teamForThisSlot, otherTeamIds, currentSelectedIdInSlot) => {
        return participatingStudents.filter(s => 
            (!teamForThisSlot.includes(s.id) || s.id === currentSelectedIdInSlot) &&
            !otherTeamIds.includes(s.id) 
        );
    };
    
    const handleStatInputChange = (field, value) => { 
        setNewStat(prev => ({ ...prev, [field]: value }));
        setStatFormError('');
    };

    const handleRegisterStat = async (e) => { 
        if(e) e.preventDefault();
        if (!newStat.studentId || !newStat.stat_type || !newStat.stroke_type) { setStatFormError('Aluno, Tipo de Ação e Pancada são obrigatórios.'); return; }
        setStatFormLoading(true); setStatFormError('');
        let determinedPointOutcome = '';
        if (newStat.stat_type === 'WINNER') determinedPointOutcome = 'GANHO';
        else if (newStat.stat_type === 'FORCED_ERROR' || newStat.stat_type === 'UNFORCED_ERROR') determinedPointOutcome = 'PERDIDO';
        else { setStatFormError('Tipo de ação inválido.'); setStatFormLoading(false); return; }
        try {
            const statDataToSend = { ...newStat, point_outcome: determinedPointOutcome };
            await evaluationService.addStatToSession(sessionId, statDataToSend);
            const playerTeam = team1PlayerIds.includes(newStat.studentId) ? 1 : (team2PlayerIds.includes(newStat.studentId) ? 2 : null);
            if(playerTeam){
                if (determinedPointOutcome === 'GANHO') updateScore(playerTeam);
                else if (determinedPointOutcome === 'PERDIDO') updateScore(playerTeam === 1 ? 2 : 1);
            } else { setStatFormError("Atribua o jogador a uma equipa para a pontuação automática.")}
            setNewStat(prev => ({ studentId: prev.studentId, stat_type: '', stroke_type: '' }));
            fetchSessionDetails(); 
        } catch (err) { setStatFormError(err.response?.data?.message || "Erro ao registar ação.");
        } finally { setStatFormLoading(false); }
    };

    const handleOpenDetailModal = (statsForPlayer) => { 
        setDetailModalPlayerStats(statsForPlayer);
        setDetailModalOpen(true);
    };
    const handleCloseDetailModal = () => setDetailModalOpen(false);

    const handleUndoLastPoint = () => {
        alert("Funcionalidade 'Apagar Último Ponto' ainda não implementada.\nRequer uma rota de backend para apagar a última estatística e lógica para recalcular o score.");
    };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  if (error) return <Container sx={{mt: 2}}><Alert severity="error">{error}</Alert></Container>;
  if (!session) return <Container sx={{mt: 2}}><Alert severity="warning">Sessão de avaliação não encontrada.</Alert></Container>;

  const renderTeamSetup = () => (
     <Paper sx={{ p: 2, mb:2 }}>
        <Typography variant="h6" gutterBottom>Configurar Equipas</Typography>
        <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{mb:0.5}}>Equipa 1 ({getTeamDisplayNames(team1PlayerIds)})</Typography>
                <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                    <InputLabel id="t1p1-label">Jogador 1</InputLabel>
                    <Select labelId="t1p1-label" value={team1PlayerIds[0] || ''} onChange={(e) => handleTeamPlayerChange(1, 0, e.target.value)} label="Jogador 1">
                        <MenuItem value=""><em>--</em></MenuItem>
                        {getAvailableStudentsForSelect(team1PlayerIds, team2PlayerIds, team1PlayerIds[0]).map(s => (<MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>))}
                    </Select>
                </FormControl>
                {participatingStudents.length === 4 && (
                <FormControl fullWidth size="small">
                    <InputLabel id="t1p2-label">Jogador 2</InputLabel>
                    <Select labelId="t1p2-label" value={team1PlayerIds[1] || ''} onChange={(e) => handleTeamPlayerChange(1, 1, e.target.value)} label="Jogador 2">
                        <MenuItem value=""><em>--</em></MenuItem>
                        {getAvailableStudentsForSelect(team1PlayerIds, team2PlayerIds, team1PlayerIds[1]).map(s => (<MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>))}
                    </Select>
                </FormControl>
                )}
            </Grid>
            <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{mb:0.5}}>Equipa 2 ({getTeamDisplayNames(team2PlayerIds)})</Typography>
                <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                    <InputLabel id="t2p1-label">Jogador 1</InputLabel>
                    <Select labelId="t2p1-label" value={team2PlayerIds[0] || ''} onChange={(e) => handleTeamPlayerChange(2, 0, e.target.value)} label="Jogador 1">
                        <MenuItem value=""><em>--</em></MenuItem>
                        {getAvailableStudentsForSelect(team2PlayerIds, team1PlayerIds, team2PlayerIds[0]).map(s => (<MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>))}
                    </Select>
                </FormControl>
                {participatingStudents.length === 4 && (
                <FormControl fullWidth size="small">
                    <InputLabel id="t2p2-label">Jogador 2</InputLabel>
                    <Select labelId="t2p2-label" value={team2PlayerIds[1] || ''} onChange={(e) => handleTeamPlayerChange(2, 1, e.target.value)} label="Jogador 2">
                        <MenuItem value=""><em>--</em></MenuItem>
                        {getAvailableStudentsForSelect(team2PlayerIds, team1PlayerIds, team2PlayerIds[1]).map(s => (<MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>))}
                    </Select>
                </FormControl>
                )}
            </Grid>
        </Grid>
     </Paper>
  );

  const renderScoreboard = () => (
    <Paper sx={{ p: 2, mb:2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
            <Typography variant="h6" component="h3">Pontuação</Typography>
            <MuiIconButton size="small" onClick={handleUndoLastPoint} title="Apagar Último Ponto / Estatística Registada"> <UndoIcon /> </MuiIconButton>
            <FormControlLabel control={ <Switch checked={useGoldenPoint} onChange={(e) => setUseGoldenPoint(e.target.checked)} size="small"/> } labelPlacement="start" label={<Typography variant="caption">P. Ouro</Typography>} />
        </Box>
        <Grid container spacing={1} justifyContent="center" alignItems="flex-start" textAlign="center">
            <Grid item xs={5}><Typography variant="caption" display="block" noWrap sx={{minHeight: '3em', fontSize: '0.7rem'}}>{getTeamDisplayNames(team1PlayerIds) || 'Equipa 1'}</Typography><Typography variant="h2">{gamesTeam1}</Typography><Typography variant="h3" color={scoreTeam1 === "AD" ? "success.main" : "inherit"}>{scoreTeam1}</Typography></Grid>
            <Grid item xs={2} sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}><Typography variant="h2" sx={{mt: '1.8em'}}>-</Typography></Grid>
            <Grid item xs={5}><Typography variant="caption" display="block" noWrap sx={{minHeight: '3em', fontSize: '0.7rem'}}>{getTeamDisplayNames(team2PlayerIds) || 'Equipa 2'}</Typography><Typography variant="h2">{gamesTeam2}</Typography><Typography variant="h3" color={scoreTeam2 === "AD" ? "success.main" : "inherit"}>{scoreTeam2}</Typography></Grid>
        </Grid>
    </Paper>
  );

  const renderStatInput = () => (
    <Paper sx={{ p: 2, mb:2 }}>
        <Typography variant="h6" component="h2" gutterBottom>Registar Ação</Typography>
        <Box component="form" onSubmit={handleRegisterStat} noValidate>
            {statFormError && <Alert severity="error" sx={{ mb: 2 }}>{statFormError}</Alert>}
            <Stack spacing={1.5}> {/* Usar Stack para melhor espaçamento vertical dos controlos */}
                <Box>
                    <Typography variant="subtitle2" gutterBottom>Aluno da Ação*</Typography>
                    <ToggleButtonGroup value={newStat.studentId} exclusive fullWidth
                        onChange={(e, val) => { if(val !== null) handleStatInputChange('studentId', val); }}
                        disabled={statFormLoading || participatingStudents.length === 0} size="small" // Reduzido para small
                    >
                        {participatingStudents.map(s => (<ToggleButton key={s.id} value={s.id} sx={{flexGrow:1, px:0.5, fontSize: '0.75rem'}}>{s.name.split(' ')[0]}</ToggleButton>))}
                    </ToggleButtonGroup>
                </Box>
                <Box>
                    <Typography variant="subtitle2" gutterBottom>Tipo de Ação*</Typography>
                    <ToggleButtonGroup value={newStat.stat_type} exclusive fullWidth
                        onChange={(e, val) => { if(val !== null) handleStatInputChange('stat_type', val);}}
                        disabled={statFormLoading} size="medium"
                    >
                        {statTypes.map(type => (<ToggleButton value={type} key={type} sx={{flexGrow:1, fontWeight: 'bold'}} color={type==='WINNER' ? 'success' : (type==='UNFORCED_ERROR' ? 'error' : 'warning')}>{formatLabel(type)}</ToggleButton>))}
                    </ToggleButtonGroup>
                </Box>
                <Box>
                    <Typography variant="subtitle2" gutterBottom>Pancada Executada*</Typography>
                    <Grid container spacing={0.5}>
                        {strokeTypes.map((type) => (<Grid item xs={4} sm={3} md={3} lg={2} key={type}><ToggleButton value={type} selected={newStat.stroke_type === type} onChange={() => handleStatInputChange('stroke_type', type)} sx={{ width: '100%', textTransform: 'none', p:0.5, fontSize: '0.7rem', height: '56px'}} size="medium" disabled={statFormLoading}>{formatLabel(type)}</ToggleButton></Grid>))}
                    </Grid>
                </Box>
                <Box sx={{ textAlign: 'center', mt: 1 }}>
                    <Button type="submit" variant="contained" size="large" color="secondary" startIcon={<AddCircleOutlineIcon/>} disabled={statFormLoading || !newStat.studentId || !newStat.stat_type || !newStat.stroke_type}>
                        {statFormLoading ? <CircularProgress size={24} /> : 'Registar Ação'}
                    </Button>
                </Box>
            </Stack>
        </Box>
    </Paper>
  );

  const renderStatsTable = () => (
    <Paper sx={{ p: 2, mb:2 }}>
        <Typography variant="h6" component="h3" gutterBottom>Resumo das Estatísticas</Typography>
        <TableContainer>
            <Table size="small" aria-label="tabela de resumo de estatísticas">
            <TableHead><TableRow><TableCell sx={{fontWeight:'bold'}}>Aluno</TableCell><TableCell align="center" sx={{fontWeight:'bold', color: theme.palette.success.light}}>W</TableCell><TableCell align="center" sx={{fontWeight:'bold', color: theme.palette.warning.light}}>EF</TableCell><TableCell align="center" sx={{fontWeight:'bold', color: theme.palette.error.light}}>ENF</TableCell></TableRow></TableHead>
            <TableBody>
            {Object.keys(aggregatedStats).length > 0 ? ( Object.entries(aggregatedStats).map(([studentId, statsData]) => ( // Renomeado 'stats' para 'statsData'
                <TableRow key={studentId} hover sx={{cursor: 'pointer'}} onClick={() => handleOpenDetailModal(statsData)}>
                    <TableCell component="th" scope="row">{statsData.name}</TableCell>
                    <TableCell align="center">{statsData.totals.WINNER}</TableCell>
                    <TableCell align="center">{statsData.totals.FORCED_ERROR}</TableCell>
                    <TableCell align="center">{statsData.totals.UNFORCED_ERROR}</TableCell>
                </TableRow>
            ))) : (<TableRow><TableCell colSpan={4} align="center">Sem estatísticas para resumir.</TableCell></TableRow>)}
            </TableBody>
            </Table>
        </TableContainer>
    </Paper>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/sessions')} sx={{ mb: 2 }}>
          Voltar para Sessões
        </Button>

        <Grid container spacing={isLargeScreen ? 3 : 2}> {/* Espaçamento menor em ecrãs pequenos */}
          <Grid item xs={12} lg={isLargeScreen ? 4 : 12}>
            <Stack spacing={2}>
              <Paper sx={{ p: 2 }}>
                 <Typography variant="h5" component="h2" gutterBottom> {/* Mudado para h5/h2 */}
                    Sessão: {format(new Date(session.date), 'dd/MM/yyyy HH:mm')}
                 </Typography>
                 {session.notes && (<Box sx={{ mt: 1 }}><Typography variant="subtitle1">Notas:</Typography><Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>{session.notes}</Typography></Box>)}
                 <Typography variant="subtitle1" sx={{ mt: 1.5 }}>Alunos Presentes:</Typography>
                 <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
                    {participatingStudents.map(student => (<Chip key={student.id} label={student.name} size="small" variant="outlined"/>))}
                 </Box>
              </Paper>
              {(participatingStudents.length === 2 || participatingStudents.length === 4) && renderTeamSetup()}
              {renderScoreboard()}
              {!isLargeScreen && renderStatsTable()}
            </Stack>
          </Grid>

          <Grid item xs={12} lg={isLargeScreen ? 8 : 12}>
            <Stack spacing={2}>
              {renderStatInput()}
              {isLargeScreen && renderStatsTable()}
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* Modal para Detalhes de Estatísticas por Pancada */}
      {detailModalPlayerStats && (
        <Dialog open={detailModalOpen} onClose={handleCloseDetailModal} fullWidth maxWidth="md"> {/* Pode ser 'md' para mais espaço */}
          <DialogTitle>
            Estatísticas Detalhadas de: <span style={{ color: theme.palette.secondary.main }}>{detailModalPlayerStats.name}</span>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              {statTypes.map(statType => {
                // Calcula o total para este statType para verificar se há algo a mostrar
                const totalForStatType = detailModalPlayerStats.totals[statType];
                
                // Filtra as pancadas que têm contagem > 0 para este statType
                const relevantStrokes = strokeTypes.filter(stroke =>
                  detailModalPlayerStats.byStroke[stroke]?.[statType] > 0
                );

                return (
                  <Grid item xs={12} sm={6} md={4} key={statType}> {/* 3 colunas para os tipos de stats */}
                    <Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
                      <Typography 
                        variant="h6" // Um pouco maior para destaque
                        sx={{
                          fontWeight: 'bold',
                          color: statType === 'WINNER' ? theme.palette.success.main : 
                                 (statType === 'UNFORCED_ERROR' ? theme.palette.error.main : theme.palette.warning.main),
                          mb: 1 // Margem inferior
                        }}
                      >
                        {formatLabel(statType)} (Total: {totalForStatType})
                      </Typography>
                      {totalForStatType > 0 && relevantStrokes.length > 0 ? (
                        <List dense disablePadding sx={{ pl: 1 }}>
                          {relevantStrokes.map(stroke => {
                            const count = detailModalPlayerStats.byStroke[stroke]?.[statType] || 0;
                            return (
                              <ListItem key={`${statType}-${stroke}`} sx={{ py: 0.2, display: 'flex', justifyContent: 'space-between' }}>
                                <ListItemText primary={formatLabel(stroke)} sx={{ flexGrow: 1 }} />
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{count}</Typography>
                              </ListItem>
                            );
                          })}
                        </List>
                      ) : (
                        <Typography variant="body2" sx={{ pl: 1, fontStyle: 'italic' }}>
                          {totalForStatType > 0 ? "Nenhuma pancada específica registada." : "Nenhuma ocorrência."}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetailModal}>Fechar</Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
}

export default GameSessionDetailPage;