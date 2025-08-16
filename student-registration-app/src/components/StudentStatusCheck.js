// StudentStatusCheck.js (Updated)
import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Button, 
  Container, 
  Typography, 
  Box, 
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import axios from 'axios';
import io from 'socket.io-client';

const StudentStatusCheck = () => {
  const [studentId, setStudentId] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io('https://localhost:4200.com');
    setSocket(newSocket);

    // Listen for status updates
    newSocket.on('registration-update', (data) => {
      if (data.studentId === localStorage.getItem('studentId')) {
        setStatus(data);
        localStorage.setItem('studentStatus', JSON.stringify(data));
      }
    });

    return () => newSocket.close();
  }, []);

  // Check localStorage for existing data
  useEffect(() => {
    const savedStatus = localStorage.getItem('studentStatus');
    if (savedStatus) {
      setStatus(JSON.parse(savedStatus));
    }
  }, []);

  const handleCheckStatus = async () => {
    if (!studentId || !parentPhone) {
      setError('الرجاء إدخال رقم الطالب ورقم الهاتف');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('https://localhost:4200.com/api/student/status', {
        studentId,
        parentPhone
      });

      // Save to localStorage
      localStorage.setItem('studentId', studentId);
      localStorage.setItem('studentStatus', JSON.stringify(response.data));

      setStatus(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'حدث خطأ أثناء التحقق من الحالة');
    } finally {
      setLoading(false);
    }
  };

  const getStatusMessage = () => {
    if (!status) return null;

    switch (status.status) {
      case 'pending':
        return (
          <Alert severity="info" sx={{ mt: 2 }}>
            طلب التسجيل قيد المراجعة من قبل الإدارة
          </Alert>
        );
      case 'active':
        return (
          <Alert severity="success" sx={{ mt: 2 }}>
            تم تفعيل حساب الطالب بنجاح! يمكنك الآن تسجيل الدخول
          </Alert>
        );
      case 'inactive':
        return (
          <Alert severity="warning" sx={{ mt: 2 }}>
            تم رفض طلب التسجيل. يرجى التواصل مع الإدارة للمزيد من المعلومات
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom align="center">
          التحقق من حالة الطلب
        </Typography>
        
        <Paper elevation={3} sx={{ p: 3 }}>
          {status ? (
            <>
              <Typography variant="h6" gutterBottom>
                حالة طلب: {status.name}
              </Typography>
              {getStatusMessage()}
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  رقم الطالب: {status.studentId}
                </Typography>
                <Typography variant="body2">
                  تاريخ التسجيل: {new Date(status.registrationDate).toLocaleDateString()}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                fullWidth
                sx={{ mt: 2 }}
                onClick={() => {
                  localStorage.removeItem('studentId');
                  localStorage.removeItem('studentStatus');
                  setStatus(null);
                }}
              >
                تسجيل خروج
              </Button>
            </>
          ) : (
            <>
              <TextField
                fullWidth
                label="رقم الطالب"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="رقم هاتف ولي الأمر"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                margin="normal"
              />
              
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleCheckStatus}
                disabled={loading}
                fullWidth
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'تحقق من الحالة'}
              </Button>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default StudentStatusCheck;