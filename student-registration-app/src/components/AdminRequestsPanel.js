import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import axios from 'axios';

const AdminRequestsPanel = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get('https://redox-sm.onrender.com/api/registration-requests', {
          params: { status: 'pending' }
        });
        setRequests(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'حدث خطأ أثناء جلب الطلبات');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(false);

    try {
      await axios.put(`https://redox-sm.onrender.com/api/admin/approve-student/${id}`);
      setRequests(requests.filter(req => req._id !== id));
      setActionSuccess(true);
    } catch (err) {
      setActionError(err.response?.data?.error || 'حدث خطأ أثناء الموافقة على الطلب');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(false);

    try {
      await axios.put(`https://redox-sm.onrender.com/api/admin/reject-student/${selectedRequest._id}`, {
        reason: rejectionReason
      });
      setRequests(requests.filter(req => req._id !== selectedRequest._id));
      setActionSuccess(true);
      setOpenDialog(false);
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (err) {
      setActionError(err.response?.data?.error || 'حدث خطأ أثناء رفض الطلب');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip label="قيد المراجعة" color="warning" />;
      case 'active':
        return <Chip label="مفعل" color="success" />;
      case 'inactive':
        return <Chip label="مرفوض" color="error" />;
      default:
        return <Chip label={status} />;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          طلبات تسجيل الطلاب
        </Typography>
        
        {actionError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {actionError}
          </Alert>
        )}
        
        {actionSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            تم تنفيذ العملية بنجاح
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>اسم الطالب</TableCell>
                <TableCell>السنة الدراسية</TableCell>
                <TableCell>ولي الأمر</TableCell>
                <TableCell>رقم الهاتف</TableCell>
                <TableCell>تاريخ التسجيل</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    لا توجد طلبات قيد المراجعة
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell>{request.name}</TableCell>
                    <TableCell>{request.academicYear}</TableCell>
                    <TableCell>{request.parentName}</TableCell>
                    <TableCell>{request.parentPhone}</TableCell>
                    <TableCell>
                      {new Date(request.registrationDate).toLocaleDateString('ar-EG')}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(request.status)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handleApprove(request._id)}
                        disabled={actionLoading}
                        sx={{ mr: 1 }}
                      >
                        {actionLoading ? <CircularProgress size={20} /> : 'موافقة'}
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => {
                          setSelectedRequest(request);
                          setOpenDialog(true);
                        }}
                        disabled={actionLoading}
                      >
                        رفض
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>رفض طلب التسجيل</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            هل أنت متأكد من رفض طلب التسجيل للطالب {selectedRequest?.name}؟
          </Typography>
          <TextField
            fullWidth
            label="سبب الرفض (اختياري)"
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>إلغاء</Button>
          <Button 
            onClick={handleReject} 
            color="error"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'تأكيد الرفض'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminRequestsPanel;