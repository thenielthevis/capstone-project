import axiosInstance from './axiosInstance';

export const predictUser = async (force: boolean = false) => {
  return axiosInstance.post('/predict/me', { force });
};

export const getCachedPredictions = async () => {
  return axiosInstance.get('/predict/cached');
};

export default {
  predictUser,
  getCachedPredictions,
};
