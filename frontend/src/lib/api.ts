import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const uploadExcel = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
    responseType: 'blob', // Important for downloading the file
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const fetchAnalytics = async () => {
  const response = await axios.get(`${API_BASE_URL}/analyze`);
  return response.data;
};

export const fetchAllStudents = async () => {
  const response = await axios.get(`${API_BASE_URL}/students`);
  return response.data;
};

export const searchStudent = async (hallTicket: string) => {
  const response = await axios.get(`${API_BASE_URL}/student/${hallTicket}`);
  return response.data;
};

export const resetData = async () => {
  const response = await axios.post(`${API_BASE_URL}/reset`);
  return response.data;
};

export const downloadReportCard = async (hallTicket: string | number) => {
  const response = await axios.get(`${API_BASE_URL}/student/${hallTicket}/report`, {
    responseType: 'blob',
  });
  return response.data;
};
export const downloadBatchReports = async (className: string | number, section: string) => {
  const response = await axios.get(`${API_BASE_URL}/batch-reports/${className}/${section}`, {
    responseType: 'blob',
  });
  return response.data;
};
