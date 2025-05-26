import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useLocation } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Páginas onde NÃO queremos mostrar o botão de voltar
  const noBackButtonPaths = ['/dashboard', '/login', '/register'];

  // Verifica se podemos voltar no histórico (se há mais do que uma entrada no histórico do router)
  // window.history.state?.idx > 0 é uma forma de verificar se há histórico de navegação na sessão atual do router.
  // A melhor forma de verificar se há histórico no react-router v6 pode ser mais complexa,
  // por agora, vamos focar-nos nos caminhos. Uma alternativa simples é verificar se location.key !== "default".
  const canGoBack = location.key !== "default"; // "default" é a key da primeira entrada no histórico da sessão

  const showBackButton = canGoBack && !noBackButtonPaths.includes(location.pathname);

  return (
    <AppBar position="sticky"> {/* "sticky" mantém a navbar no topo ao fazer scroll */}
      <Toolbar>
        {showBackButton && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="voltar"
            onClick={() => navigate(-1)} // Navega para a entrada anterior no histórico
            sx={{ mr: 2 }} // margin-right
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Padel Coach App {/* Podes tornar isto dinâmico mais tarde */}
        </Typography>
        {/* Aqui podes adicionar outros itens à navbar, como um menu de utilizador, etc. */}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;