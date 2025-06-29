import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { registerStudent } from '../../services/auth';
import {
  TextField,
  Button,
  Typography,
  Container,
  Box,
  MenuItem,
  CircularProgress
} from '@mui/material';

const StudentRegister = () => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationSchema = Yup.object().shape({
    name: Yup.string().required('اسم الطالب مطلوب'),
    birthDate: Yup.date().required('تاريخ الميلاد مطلوب'),
    parentName: Yup.string().required('اسم ولي الأمر مطلوب'),
    parentPhone: Yup.string()
      .required('هاتف ولي الأمر مطلوب')
      .matches(/^[0-9]+$/, 'يجب أن يحتوي على أرقام فقط'),
    parentEmail: Yup.string()
      .email('بريد إلكتروني غير صالح')
      .required('البريد الإلكتروني مطلوب'),
    academicYear: Yup.string().required('السنة الدراسية مطلوبة'),
    address: Yup.string().required('العنوان مطلوب')
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      birthDate: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      academicYear: '',
      address: '',
      previousSchool: '',
      healthInfo: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        const response = await registerStudent(values);
        setMessage(response.data.message);
        formik.resetForm();
      } catch (error) {
        setMessage(error.response?.data?.error || 'حدث خطأ أثناء التسجيل');
      } finally {
        setIsSubmitting(false);
      }
    }
  });

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

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          تسجيل طالب جديد
        </Typography>
        
        {message && (
          <Typography
            color={message.includes('نجاح') ? 'success.main' : 'error.main'}
            sx={{ mb: 2 }}
            align="center"
          >
            {message}
          </Typography>
        )}
        
        <form onSubmit={formik.handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="اسم الطالب الكامل"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name}
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="تاريخ الميلاد"
            type="date"
            name="birthDate"
            InputLabelProps={{ shrink: true }}
            value={formik.values.birthDate}
            onChange={formik.handleChange}
            error={formik.touched.birthDate && Boolean(formik.errors.birthDate)}
            helperText={formik.touched.birthDate && formik.errors.birthDate}
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="اسم ولي الأمر"
            name="parentName"
            value={formik.values.parentName}
            onChange={formik.handleChange}
            error={formik.touched.parentName && Boolean(formik.errors.parentName)}
            helperText={formik.touched.parentName && formik.errors.parentName}
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="هاتف ولي الأمر"
            name="parentPhone"
            value={formik.values.parentPhone}
            onChange={formik.handleChange}
            error={formik.touched.parentPhone && Boolean(formik.errors.parentPhone)}
            helperText={formik.touched.parentPhone && formik.errors.parentPhone}
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="بريد ولي الأمر"
            name="parentEmail"
            type="email"
            value={formik.values.parentEmail}
            onChange={formik.handleChange}
            error={formik.touched.parentEmail && Boolean(formik.errors.parentEmail)}
            helperText={formik.touched.parentEmail && formik.errors.parentEmail}
          />
          
          <TextField
            fullWidth
            margin="normal"
            select
            label="السنة الدراسية"
            name="academicYear"
            value={formik.values.academicYear}
            onChange={formik.handleChange}
            error={formik.touched.academicYear && Boolean(formik.errors.academicYear)}
            helperText={formik.touched.academicYear && formik.errors.academicYear}
          >
            {academicYears.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          
          <TextField
            fullWidth
            margin="normal"
            label="العنوان"
            name="address"
            value={formik.values.address}
            onChange={formik.handleChange}
            error={formik.touched.address && Boolean(formik.errors.address)}
            helperText={formik.touched.address && formik.errors.address}
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="المدرسة السابقة (اختياري)"
            name="previousSchool"
            value={formik.values.previousSchool}
            onChange={formik.handleChange}
          />
          
          <TextField
            fullWidth
            margin="normal"
            label="معلومات صحية مهمة (اختياري)"
            name="healthInfo"
            multiline
            rows={3}
            value={formik.values.healthInfo}
            onChange={formik.handleChange}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            sx={{ mt: 3, mb: 2 }}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'إرسال طلب التسجيل'}
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default StudentRegister;