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
  last_edited_by?: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  last_edited_at?: string;
}

export const createProgram = async (programData: any) => {
  const response = await axiosInstance.post("/programs/createProgram", programData);
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

export interface MemberProgress {
  user: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  status: 'pending' | 'accepted' | 'declined';
  responded_at?: string;
  stats: {
    totalSessions: number;
    totalCalories: number;
    totalDuration: number;
    totalDistance: number;
  };
  latestSession: {
    _id: string;
    performed_at: string;
    total_calories_burned: number;
    total_duration_minutes: number;
    progress: {
      overall_percentage: number;
      status: string;
    };
  } | null;
  sessions: any[];
}

export interface GroupProgramProgress {
  program: {
    _id: string;
    name: string;
    description?: string;
    workouts: any[];
    geo_activities: any[];
    created_at: string;
  };
  groupStats: {
    totalMembers: number;
    acceptedMembers: number;
    pendingMembers: number;
    declinedMembers: number;
    totalGroupSessions: number;
    totalGroupCalories: number;
    totalGroupDuration: number;
  };
  memberProgress: MemberProgress[];
}

export const getGroupProgramProgress = async (programId: string): Promise<GroupProgramProgress> => {
  const response = await axiosInstance.get(`/programs/getGroupProgramProgress/${programId}`);
  return response.data;
};
