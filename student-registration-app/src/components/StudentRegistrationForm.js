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
  Paper,
  styled,
  InputAdornment
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SchoolIcon from '@mui/icons-material/School';
import HomeIcon from '@mui/icons-material/Home';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import axios from 'axios';
import { SocketContext } from '../App';

// Custom styled components
const CenteredContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

const FormPaper = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: 800,
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[3],
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
  },
}));

const FormTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  color: theme.palette.primary.main,
  fontWeight: 700,
  textAlign: 'center',
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.5rem',
    marginBottom: theme.spacing(3),
  },
}));

const FormGrid = styled(Grid)(({ theme }) => ({
  width: '100%',
  justifyContent: 'center',
}));

const FormTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '& .MuiInputBase-root': {
    borderRadius: theme.shape.borderRadius * 2,
  },
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5),
  fontSize: '1rem',
  fontWeight: 600,
  marginTop: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  width: '100%',
  maxWidth: 400,
}));

const StatusPaper = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: 600,
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  background: theme.palette.grey[50],
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
  },
}));

const StatusItem = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
}));

const StatusLabel = styled('span')(({ theme }) => ({
  fontWeight: 600,
  marginRight: theme.spacing(1),
  color: theme.palette.text.secondary,
}));

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
    birthDate: Yup.date()
      .required('تاريخ الميلاد مطلوب')
      .max(new Date(), 'تاريخ الميلاد لا يمكن أن يكون في المستقبل'),
    academicYear: Yup.string().required('السنة الدراسية مطلوبة'),
    parentName: Yup.string().required('اسم ولي الأمر مطلوب'),
    parentPhone: Yup.string()
      .required('رقم هاتف ولي الأمر مطلوب')
      .matches(/^[0-9]+$/, 'يجب أن يحتوي على أرقام فقط')
      .min(10, 'يجب أن يحتوي على 10 أرقام على الأقل')
      .max(15, 'يجب ألا يتجاوز 15 رقماً'),
    parentEmail: Yup.string().email('البريد الإلكتروني غير صالح'),
    address: Yup.string().required('العنوان مطلوب').min(10, 'العنوان قصير جداً'),
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
        const response = await axios.post('localhost:4200/api/student/register', values);
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
      <CenteredContainer>
        <FormPaper elevation={3}>
          <FormTitle variant="h4" component="h1">
            حالة طلب التسجيل
          </FormTitle>
          
          <StatusPaper elevation={0}>
            <StatusItem>
              <StatusLabel>اسم الطالب:</StatusLabel>
              <span>{registrationData.name}</span>
            </StatusItem>
            
            <StatusItem>
              <StatusLabel>السنة الدراسية:</StatusLabel>
              <span>{academicYears.find(y => y.value === registrationData.academicYear)?.label}</span>
            </StatusItem>
            
            <StatusItem>
              <StatusLabel>رقم الطالب:</StatusLabel>
              <span>{registrationData.studentId || 'قيد المراجعة'}</span>
            </StatusItem>
            
            <StatusItem>
              <StatusLabel>تاريخ التسجيل:</StatusLabel>
              <span>{new Date(registrationData.registrationDate || new Date()).toLocaleDateString()}</span>
            </StatusItem>
            
            <StatusItem>
              <StatusLabel>الحالة:</StatusLabel>
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
            </StatusItem>
          </StatusPaper>

          <SubmitButton
            variant="contained"
            onClick={() => {
              localStorage.removeItem('studentRegistration');
              setRegistrationData(null);
            }}
            startIcon={<SchoolIcon />}
          >
            تسجيل طلب جديد
          </SubmitButton>
        </FormPaper>
      </CenteredContainer>
    );
  }

  return (
    <CenteredContainer>
      <FormPaper elevation={3}>
        <FormTitle variant="h4" component="h1">
          نموذج تسجيل الطالب
        </FormTitle>
        
        {submitError && (
          <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
            {submitError}
          </Alert>
        )}

        <Box component="form" onSubmit={formik.handleSubmit} sx={{ width: '100%' }}>
          <FormGrid container spacing={isMobile ? 2 : 3}>
            {/* Student Name */}
            <Grid item xs={12} md={10}>
              <FormTextField
                fullWidth
                id="name"
                name="name"
                label="اسم الطالب"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {/* Birth Date */}
            <Grid item xs={12} md={10}>
              <FormTextField
                fullWidth
                id="birthDate"
                name="birthDate"
                label="تاريخ الميلاد"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formik.values.birthDate}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.birthDate && Boolean(formik.errors.birthDate)}
                helperText={formik.touched.birthDate && formik.errors.birthDate}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {/* Academic Year */}
            <Grid item xs={12} md={10}>
              <FormTextField
                fullWidth
                id="academicYear"
                name="academicYear"
                label="السنة الدراسية"
                select
                SelectProps={{ native: true }}
                value={formik.values.academicYear}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.academicYear && Boolean(formik.errors.academicYear)}
                helperText={formik.touched.academicYear && formik.errors.academicYear}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SchoolIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              >
                <option value=""></option>
                {academicYears.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </FormTextField>
            </Grid>
            
            {/* Parent Name */}
            <Grid item xs={12} md={10}>
              <FormTextField
                fullWidth
                id="parentName"
                name="parentName"
                label="اسم ولي الأمر"
                value={formik.values.parentName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.parentName && Boolean(formik.errors.parentName)}
                helperText={formik.touched.parentName && formik.errors.parentName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {/* Parent Phone */}
            <Grid item xs={12} md={10}>
              <FormTextField
                fullWidth
                id="parentPhone"
                name="parentPhone"
                label="رقم هاتف ولي الأمر"
                value={formik.values.parentPhone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.parentPhone && Boolean(formik.errors.parentPhone)}
                helperText={formik.touched.parentPhone && formik.errors.parentPhone}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {/* Parent Email */}
            <Grid item xs={12} md={10}>
              <FormTextField
                fullWidth
                id="parentEmail"
                name="parentEmail"
                label="البريد الإلكتروني لولي الأمر"
                type="email"
                value={formik.values.parentEmail}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.parentEmail && Boolean(formik.errors.parentEmail)}
                helperText={formik.touched.parentEmail && formik.errors.parentEmail}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {/* Address */}
            <Grid item xs={12} md={10}>
              <FormTextField
                fullWidth
                id="address"
                name="address"
                label="العنوان"
                multiline
                rows={3}
                value={formik.values.address}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.address && Boolean(formik.errors.address)}
                helperText={formik.touched.address && formik.errors.address}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <HomeIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {/* Previous School */}
            <Grid item xs={12} md={10}>
              <FormTextField
                fullWidth
                id="previousSchool"
                name="previousSchool"
                label="المدرسة السابقة (إن وجدت)"
                value={formik.values.previousSchool}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.previousSchool && Boolean(formik.errors.previousSchool)}
                helperText={formik.touched.previousSchool && formik.errors.previousSchool}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SchoolIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {/* Health Info */}
            <Grid item xs={12} md={10}>
              <FormTextField
                fullWidth
                id="healthInfo"
                name="healthInfo"
                label="معلومات صحية خاصة"
                value={formik.values.healthInfo}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.healthInfo && Boolean(formik.errors.healthInfo)}
                helperText={formik.touched.healthInfo && formik.errors.healthInfo}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MedicalServicesIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            {/* Submit Button */}
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
              <SubmitButton
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : <SchoolIcon />}
              >
                {isSubmitting ? 'جاري التسجيل...' : 'تسجيل الطلب'}
              </SubmitButton>
            </Grid>
          </FormGrid>
        </Box>
      </FormPaper>

      {/* Status Update Dialog */}
      <Dialog 
        open={Boolean(statusUpdate)} 
        onClose={handleCloseStatusUpdate}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          {statusUpdate?.status === 'active' ? 'تم قبول طلبك' : 'تم رفض طلبك'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
            {statusUpdate?.status === 'active' 
              ? `مبروك! تم قبول طلب تسجيل الطالب ${statusUpdate.name}. الرقم الجامعي: ${statusUpdate.studentId}`
              : `نأسف لإعلامك أن طلب تسجيل الطالب ${statusUpdate?.name} قد تم رفضه. ${statusUpdate?.reason ? `السبب: ${statusUpdate.reason}` : ''}`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button 
            onClick={handleCloseStatusUpdate} 
            variant="contained"
            color="primary"
            sx={{ minWidth: 120 }}
          >
            حسناً
          </Button>
        </DialogActions>
      </Dialog>
    </CenteredContainer>
  );
};

export default StudentRegistrationForm;