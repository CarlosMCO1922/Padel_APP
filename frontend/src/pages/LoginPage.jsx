import React, { useState } from 'react';
import { Container, Box, Typography, Paper, TextField, Button, CircularProgress, Alert } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Importa useAuth

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const auth = useAuth(); // <-- Obtém o contexto de autenticação

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  // --- FUNÇÃO handleSubmit CORRIGIDA ---
  const handleSubmit = async (e) => {
    e.preventDefault(); // <--- Adicionado: Impede o recarregamento!
    setError('');
    setLoading(true);   // <--- Adicionado: Inicia o loading

    // <--- Adicionado: Validação ---
    if (!formData.email || !formData.password) {
        setError('Email e password são obrigatórios.');
        setLoading(false);
        return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      const { token } = response.data;

      setLoading(false); // <--- Adicionado: Para o loading

      if (token) {
        auth.login(token); // Usa a função do contexto
        navigate('/dashboard');
      } else {
          setError('Não foi possível obter o token. Tente novamente.');
      }

    } catch (err) {
      setLoading(false); // <--- Adicionado: Para o loading em caso de erro
      // <--- Adicionado: Mensagem de erro ---
      setError(err.response?.data?.message || 'Credenciais inválidas ou erro no servidor.');
      console.error("Erro no login:", err);
    }
  };
  // --- FIM DA FUNÇÃO handleSubmit CORRIGIDA ---


  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5" color="secondary">
          Login
        </Typography>

        {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Endereço de Email"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="secondary"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
          </Button>

          <Box textAlign="center">
            <Link to="/register" variant="body2">
              Não tens conta? Regista-te aqui
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default LoginPage;