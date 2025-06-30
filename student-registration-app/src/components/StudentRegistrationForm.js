import React, { useContext, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { 
  TextField, 
  Button, 
  Container, 
  Typography, 
  Box, 
  Grid,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
  Paper // Added missing import
} from '@mui/material';
import axios from 'axios';
import { SocketContext } from '../App';

const StudentRegistrationForm = () => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState(null);
  const [registrationData, setRegistrationData] = React.useState(null);
  const [statusUpdate, setStatusUpdate] = React.useState(null);
  const socket = useContext(SocketContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const validationSchema = Yup.object().shape({
    name: Yup.string().required('اسم الطالب مطلوب'),
    birthDate: Yup.date().required('تاريخ الميلاد مطلوب'),
    academicYear: Yup.string().required('السنة الدراسية مطلوبة'),
    parentName: Yup.string().required('اسم ولي الأمر مطلوب'),
    parentPhone: Yup.string()
      .required('رقم هاتف ولي الأمر مطلوب')
      .matches(/^[0-9]+$/, 'يجب أن يحتوي على أرقام فقط'),
    parentEmail: Yup.string().email('البريد الإلكتروني غير صالح'),
    address: Yup.string().required('العنوان مطلوب'),
    previousSchool: Yup.string(),
    healthInfo: Yup.string()
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      birthDate: '',
      academicYear: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      address: '',
      previousSchool: '',
      healthInfo: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      setSubmitError(null);
      
      try {
        const response = await axios.post('http://localhost:4200/api/student/register', values);
        const studentData = {
          ...response.data,
          parentPhone: values.parentPhone
        };
        
        localStorage.setItem('studentRegistration', JSON.stringify(studentData));
        setRegistrationData(studentData);
        
        if (socket) {
          socket.emit('subscribe-to-status', {
            parentPhone: values.parentPhone,
            studentId: response.data._id
          });
        }
      } catch (error) {
        setSubmitError(error.response?.data?.error || 'حدث خطأ أثناء التسجيل');
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  useEffect(() => {
    const savedData = localStorage.getItem('studentRegistration');
    if (savedData) {
      setRegistrationData(JSON.parse(savedData));
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (data) => {
      setStatusUpdate(data);
      try {
        const currentData = JSON.parse(localStorage.getItem('studentRegistration')) || {};
        localStorage.setItem('studentRegistration', JSON.stringify({
          ...currentData,
          status: data.status,
          ...(data.studentId && { studentId: data.studentId })
        }));
      } catch (error) {
        console.error('Error updating localStorage:', error);
      }
    };

    socket.on('registration-update', handleStatusUpdate);

    return () => {
      socket.off('registration-update', handleStatusUpdate);
    };
  }, [socket]);

  const academicYears = [
    { value: '1AS', label: 'الأولى ثانوي' },
    { value: '2AS', label: 'الثانية ثانوي' },
    { value: '3AS', label: 'الثالثة ثانوي' },
    { value: '1MS', label: 'الأولى متوسط' },
    { value: '2MS', label: 'الثانية متوسط' },
    { value: '3MS', label: 'الثالثة متوسط' },
    { value: '4MS', label: 'الرابعة متوسط' },
    { value: '5MS', label: 'الخامسة متوسط' }
  ];

  const handleCloseStatusUpdate = () => {
    setStatusUpdate(null);
  };

  if (registrationData) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: isMobile ? 2 : 3 }}>
          <Typography variant="h5" component="h2" gutterBottom align="center">
            حالة طلب التسجيل
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" gutterBottom>
              <strong>اسم الطالب:</strong> {registrationData.name}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>السنة الدراسية:</strong> {academicYears.find(y => y.value === registrationData.academicYear)?.label}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>رقم الطالب:</strong> {registrationData.studentId || 'قيد المراجعة'}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>تاريخ التسجيل:</strong> {new Date(registrationData.registrationDate || new Date()).toLocaleDateString()}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>الحالة:</strong> 
              {registrationData.status === 'pending' && (
                <Box component="span" color="warning.main"> قيد المراجعة</Box>
              )}
              {registrationData.status === 'active' && (
                <Box component="span" color="success.main"> تم القبول</Box>
              )}
              {registrationData.status === 'inactive' && (
                <Box component="span" color="error.main"> تم الرفض</Box>
              )}
              {!registrationData.status && (
                <Box component="span" color="text.secondary"> قيد المعالجة</Box>
              )}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            fullWidth
            onClick={() => {
              localStorage.removeItem('studentRegistration');
              setRegistrationData(null);
            }}
          >
            تسجيل طلب جديد
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          نموذج تسجيل الطالب
        </Typography>
        
        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={isMobile ? 1 : 3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="name"
                name="name"
                label="اسم الطالب"
                value={formik.values.name}
                onChange={formik.handleChange}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="birthDate"
                name="birthDate"
                label="تاريخ الميلاد"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formik.values.birthDate}
                onChange={formik.handleChange}
                error={formik.touched.birthDate && Boolean(formik.errors.birthDate)}
                helperText={formik.touched.birthDate && formik.errors.birthDate}
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="academicYear"
                name="academicYear"
                label="السنة الدراسية"
                select
                SelectProps={{ native: true }}
                value={formik.values.academicYear}
                onChange={formik.handleChange}
                error={formik.touched.academicYear && Boolean(formik.errors.academicYear)}
                helperText={formik.touched.academicYear && formik.errors.academicYear}
                size={isMobile ? 'small' : 'medium'}
              >
                <option value=""></option>
                {academicYears.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="parentName"
                name="parentName"
                label="اسم ولي الأمر"
                value={formik.values.parentName}
                onChange={formik.handleChange}
                error={formik.touched.parentName && Boolean(formik.errors.parentName)}
                helperText={formik.touched.parentName && formik.errors.parentName}
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="parentPhone"
                name="parentPhone"
                label="رقم هاتف ولي الأمر"
                value={formik.values.parentPhone}
                onChange={formik.handleChange}
                error={formik.touched.parentPhone && Boolean(formik.errors.parentPhone)}
                helperText={formik.touched.parentPhone && formik.errors.parentPhone}
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="parentEmail"
                name="parentEmail"
                label="البريد الإلكتروني لولي الأمر"
                type="email"
                value={formik.values.parentEmail}
                onChange={formik.handleChange}
                error={formik.touched.parentEmail && Boolean(formik.errors.parentEmail)}
                helperText={formik.touched.parentEmail && formik.errors.parentEmail}
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="address"
                name="address"
                label="العنوان"
                multiline
                rows={2}
                value={formik.values.address}
                onChange={formik.handleChange}
                error={formik.touched.address && Boolean(formik.errors.address)}
                helperText={formik.touched.address && formik.errors.address}
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="previousSchool"
                name="previousSchool"
                label="المدرسة السابقة (إن وجدت)"
                value={formik.values.previousSchool}
                onChange={formik.handleChange}
                error={formik.touched.previousSchool && Boolean(formik.errors.previousSchool)}
                helperText={formik.touched.previousSchool && formik.errors.previousSchool}
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="healthInfo"
                name="healthInfo"
                label="معلومات صحية خاصة"
                value={formik.values.healthInfo}
                onChange={formik.handleChange}
                error={formik.touched.healthInfo && Boolean(formik.errors.healthInfo)}
                helperText={formik.touched.healthInfo && formik.errors.healthInfo}
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
                fullWidth
                size={isMobile ? 'medium' : 'large'}
              >
                {isSubmitting ? <CircularProgress size={24} /> : 'تسجيل الطلب'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Box>

      <Dialog open={Boolean(statusUpdate)} onClose={handleCloseStatusUpdate}>
        <DialogTitle>
          {statusUpdate?.status === 'active' ? 'تم قبول طلبك' : 'تم رفض طلبك'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            {statusUpdate?.status === 'active' 
              ? `مبروك! تم قبول طلب تسجيل الطالب ${statusUpdate.name}. الرقم الجامعي: ${statusUpdate.studentId}`
              : `نأسف لإعلامك أن طلب تسجيل الطالب ${statusUpdate?.name} قد تم رفضه. ${statusUpdate?.reason ? `السبب: ${statusUpdate.reason}` : ''}`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusUpdate} color="primary">
            حسناً
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudentRegistrationForm;