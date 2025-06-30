import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { io } from 'socket.io-client';
import StudentRegistrationForm from './components/StudentRegistrationForm';
import StudentStatusCheck from './components/StudentStatusCheck';
import AdminRequestsPanel from './components/AdminRequestsPanel';
import NavBar from './components/NavBar';
import HomePage from './components/HomePage';

// Create a context for the socket
export const SocketContext = React.createContext();

const theme = createTheme({
  direction: 'rtl',
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Tajawal", "Arial", sans-serif',
    // Add Arabic font support
    allVariants: {
      fontFamily: '"Tajawal", sans-serif',
    },
  },
});

function App() {
  // Create socket instance
  const socket = io('http://localhost:4200', {
    withCredentials: true,
    autoConnect: true,
  });

  // Clean up socket on unmount
  React.useEffect(() => {
    return () => {
      if (socket) socket.disconnect();
    };
  }, [socket]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Provide socket context to all children */}
      <SocketContext.Provider value={socket}>
        <Router>
          <NavBar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<StudentRegistrationForm />} />
            <Route path="/status" element={<StudentStatusCheck />} />
            <Route path="/admin/requests" element={<AdminRequestsPanel />} />
          </Routes>
        </Router>
      </SocketContext.Provider>
    </ThemeProvider>
  );
}

export default App;