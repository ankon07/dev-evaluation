import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  IconButton,
  AppBar,
  Toolbar,
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme } from '../../contexts/ThemeContext';

const AuthLayout = () => {
  const { mode, toggleTheme } = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Developer Evaluation & Reward System
          </Typography>
          <IconButton sx={{ ml: 1 }} onClick={toggleTheme} color="inherit">
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container
        component="main"
        maxWidth="sm"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flexGrow: 1,
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography
            component="h1"
            variant="h4"
            gutterBottom
            sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}
          >
            Developer Evaluation & Reward System
          </Typography>
          <Outlet />
        </Paper>
      </Container>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          textAlign: 'center',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          &copy; {new Date().getFullYear()} Developer Evaluation & Reward System. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthLayout;
