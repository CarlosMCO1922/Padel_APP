import React, { useState } from 'react';
import { Container, Box, Typography, Paper, TextField, Button, CircularProgress, Alert } from '@mui/material'; // Importa mais componentes
import { Link, useNavigate } from 'react-router-dom'; // Importa Link e useNavigate para navegação
import axios from 'axios'; // Importa o axios para fazer pedidos API

function RegisterPage() {
  // Estados para guardar os dados do formulário
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  // Estados para feedback (carregamento e erros)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate(); // Hook para navegação

  // Função para atualizar o estado quando o utilizador escreve
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Limpa o erro ao escrever
  };

  // Função para lidar com a submissão do formulário
  const handleSubmit = async (e) => {
    e.preventDefault(); // Impede o recarregamento da página
    setError('');
    setSuccess('');
    setLoading(true);

    // Validação simples
    if (!formData.name || !formData.email || !formData.password) {
        setError('Todos os campos são obrigatórios.');
        setLoading(false);
        return;
    }

    try {
      // Faz o pedido POST para a nossa API backend
      const response = await axios.post('http://localhost:5000/api/auth/register', formData);

      setLoading(false);
      setSuccess('Registo efetuado com sucesso! Redirecionando para o login...');

      // Espera 2 segundos e redireciona para o login
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      setLoading(false);
      // Pega a mensagem de erro da API (se existir) ou usa uma genérica
      setError(err.response?.data?.message || 'Ocorreu um erro ao registar. Tente novamente.');
      console.error("Erro no registo:", err);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5" color="primary">
          Criar Conta de Treinador
        </Typography>

        {/* Mostra mensagens de sucesso ou erro */}
        {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2, width: '100%' }}>{success}</Alert>}

        {/* O 'Box' atua como o nosso <form> */}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Nome Completo"
            name="name"
            autoComplete="name"
            autoFocus
            value={formData.name}
            onChange={handleChange}
            disabled={loading || success} // Desativa se estiver a carregar ou se teve sucesso
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Endereço de Email"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            disabled={loading || success}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            disabled={loading || success}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading || success} // Desativa o botão
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Registar'}
          </Button>

          {/* Link para a página de Login */}
          <Box textAlign="center">
            <Link to="/login" variant="body2">
              Já tens uma conta? Faz Login
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default RegisterPage;