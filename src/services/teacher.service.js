import api from "../api/axiosInstance";

export const createTeacher = (data) => api.post('/teachers', data);
export const updateTeacher = (id, data) => api.put(`/teachers/${id}`, data);
export const getTeacherFormData = (campusId, signal) =>
  Promise.all([
    api.get(`/campus/${campusId}`, { signal }),
    api.get('/department', 
        { 
            params: { campusId }, 
            signal 
        }
    ),
    api.get('/subject', 
        { 
            params: { campusId }, 
            signal 
        }
    ),
  ]);