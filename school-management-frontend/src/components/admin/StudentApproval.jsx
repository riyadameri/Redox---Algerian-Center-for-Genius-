import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Container,
  Box,
  CircularProgress
} from '@mui/material';
import { getPendingStudents, approveStudent, rejectStudent } from '../../services/auth';

const StudentApproval = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await getPendingStudents();
        setStudents(response.data);
      } catch (error) {
        console.error('Error fetching pending students:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleApprove = async (studentId) => {
    setActionLoading(true);
    try {
      await approveStudent(studentId);
      setStudents(students.filter(student => student._id !== studentId));
    } catch (error) {
      console.error('Error approving student:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (studentId) => {
    const reason = prompt('الرجاء إدخال سبب الرفض:');
    if (reason) {
      setActionLoading(true);
      try {
        await rejectStudent(studentId, reason);
        setStudents(students.filter(student => student._id !== studentId));
      } catch (error) {
        console.error('Error rejecting student:', error);
      } finally {
        setActionLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          طلبات تسجيل الطلاب المعلقة
        </Typography>
        
        {students.length === 0 ? (
          <Typography variant="body1" align="center">
            لا توجد طلبات معلقة حالياً
          </Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>اسم الطالب</TableCell>
                  <TableCell>ولي الأمر</TableCell>
                  <TableCell>الهاتف</TableCell>
                  <TableCell>البريد الإلكتروني</TableCell>
                  <TableCell>تاريخ التسجيل</TableCell>
                  <TableCell>الإجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.parentName}</TableCell>
                    <TableCell>{student.parentPhone}</TableCell>
                    <TableCell>{student.parentEmail}</TableCell>
                    <TableCell>
                      {new Date(student.registrationDate).toLocaleDateString('ar-EG')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => handleApprove(student._id)}
                        disabled={actionLoading}
                        sx={{ mr: 1 }}
                      >
                        قبول
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleReject(student._id)}
                        disabled={actionLoading}
                      >
                        رفض
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Container>
  );
};

export default StudentApproval;