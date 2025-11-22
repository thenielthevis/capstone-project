import axiosInstance from "./axiosInstance";

export const createProgram = async (programData: any) => {
  const response =  await axiosInstance.post("/programs/createProgram", programData);
  console.log("Program created with data:", response.data);
  return response.data;
};

export const getUserPrograms = async () => {
  const response = await axiosInstance.get("/programs/getUserPrograms");
  return response.data;
};

export const getProgramById = async (id: string) => {
  const response = await axiosInstance.get(`/programs/getProgramById/${id}`);
  return response.data;
};

export const updateProgram = async (id: string, programData: any) => {
  const response = await axiosInstance.put(`/programs/updateProgram/${id}`, programData);
  return response.data;
};

export const deleteProgram = async (id: string) => {
  const response = await axiosInstance.delete(`/programs/deleteProgram/${id}`);
  return response.data;
};