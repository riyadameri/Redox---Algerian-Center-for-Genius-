import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          نظام تسجيل الطلاب
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
          مرحباً بكم في نظام تسجيل الطلاب
        </Typography>
        <Typography variant="body1" sx={{ mt: 2, mb: 4 }}>
          يمكنكم تسجيل طلب جديد للطالب أو التحقق من حالة الطلب الحالي
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button 
            variant="contained" 
            size="large" 
            component={Link} 
            to="/register"
          >
            تسجيل طالب جديد
          </Button>
          <Button 
            variant="outlined" 
            size="large" 
            component={Link} 
            to="/status"
          >
            التحقق من الحالة
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default HomePage;