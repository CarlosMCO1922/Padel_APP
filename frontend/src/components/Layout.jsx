import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from './Navbar'; // Importa a Navbar que acabámos de criar

function Layout() {
  return (
    <>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1 /*, p: 3 <- Podes adicionar padding global aqui se quiseres */ }}>
        {/* O Outlet renderiza o componente da rota filha atual */}
        <Outlet />
      </Box>
      {/* Podes adicionar um Footer aqui se quiseres */}
    </>
  );
}

export default Layout;