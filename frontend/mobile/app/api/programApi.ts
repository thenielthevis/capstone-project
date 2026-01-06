import axiosInstance from "./axiosInstance";

export interface ProgramMember {
  user_id: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  status: 'pending' | 'accepted' | 'declined';
  responded_at?: string;
}

export interface Program {
  _id: string;
  user_id: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  group_id?: string;
  name: string;
  description?: string;
  members?: ProgramMember[];
  workouts: any[];
  geo_activities: any[];
  created_at: string;
}

export const createProgram = async (programData: any) => {
  const response =  await axiosInstance.post("/programs/createProgram", programData);
  console.log("Program created with data:", response.data);
  return response.data;
};

export const getUserPrograms = async (): Promise<Program[]> => {
  const response = await axiosInstance.get("/programs/getUserPrograms");
  return response.data;
};

export const getProgramById = async (id: string): Promise<Program> => {
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

export const getGroupPrograms = async (groupId: string): Promise<Program[]> => {
  const response = await axiosInstance.get(`/programs/getGroupPrograms/${groupId}`);
  return response.data;
};

export const acceptProgram = async (programId: string): Promise<Program> => {
  const response = await axiosInstance.put(`/programs/acceptProgram/${programId}`);
  return response.data;
};

export const declineProgram = async (programId: string): Promise<Program> => {
  const response = await axiosInstance.put(`/programs/declineProgram/${programId}`);
  return response.data;
};

export const getPendingPrograms = async (): Promise<Program[]> => {
  const response = await axiosInstance.get("/programs/getPendingPrograms");
  return response.data;
};