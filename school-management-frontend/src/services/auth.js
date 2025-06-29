import api from './api';

export const registerStudent = (studentData) => {
  return api.post('/student/register', studentData);
};

export const loginUser = (credentials) => {
  return api.post('/auth/login', credentials);
};

export const getPendingStudents = () => {
  return api.get('/admin/pending-students');
};

export const approveStudent = (studentId) => {
  return api.put(`/admin/approve-student/${studentId}`);
};

export const rejectStudent = (studentId, reason) => {
  return api.put(`/admin/reject-student/${studentId}`, { reason });
};