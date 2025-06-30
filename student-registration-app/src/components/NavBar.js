import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';

const NavBar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          نظام تسجيل الطلاب
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button color="inherit" component={Link} to="/">
            الرئيسية
          </Button>
          <Button color="inherit" component={Link} to="/register">
            تسجيل طالب جديد
          </Button>
          <Button color="inherit" component={Link} to="/status">
            التحقق من الحالة
          </Button>
          <Button color="inherit" component={Link} to="/admin/requests">
            لوحة التحكم
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;