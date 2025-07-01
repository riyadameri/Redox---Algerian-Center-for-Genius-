import React from 'react';
import { Container, Typography, Box, Button, useTheme, useMediaQuery, Paper } from '@mui/material';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Container maxWidth="sm">
      <Paper
        elevation={3}
        sx={{
          mt: 6,
          p: 4,
          borderRadius: 4,
          background: 'linear-gradient(to bottom right, #e0f7fa, #ffffff)',
        }}
      >
        <Box textAlign="center">
          <Typography
            variant={isMobile ? "h4" : "h3"}
            component="h1"
            gutterBottom
            sx={{ fontWeight: 'bold', color: '#00695c' }}
          >
            نظام تسجيل الطلاب
          </Typography>

          <Typography
            variant={isMobile ? "h6" : "h5"}
            component="h2"
            gutterBottom
            sx={{ mt: 3, color: '#004d40' }}
          >
            مرحباً بكم في نظام تسجيل الطلاب
          </Typography>

          <Typography variant="body1" sx={{ mt: 2, mb: 4, color: '#555' }}>
            يمكنكم تسجيل طلب جديد للطالب أو التحقق من حالة الطلب الحالي.
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/register"
              sx={{
                backgroundColor: '#00897b',
                '&:hover': {
                  backgroundColor: '#00695c',
                },
                px: 4,
              }}
            >
              تسجيل طالب جديد
            </Button>

            <Button
              variant="outlined"
              size="large"
              component={Link}
              to="/status"
              sx={{
                borderColor: '#00897b',
                color: '#00897b',
                '&:hover': {
                  borderColor: '#00695c',
                  color: '#00695c',
                },
                px: 4,
              }}
            >
              التحقق من الحالة
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default HomePage;
