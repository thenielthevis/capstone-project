import axiosInstance from "./axiosInstance";

export type ProgramSessionSetPayload = {
  reps: number;
  time_seconds: number;
  weight_kg: number;
};

export type ProgramSessionWorkoutPayload = {
  workout_id: string;
  sets: ProgramSessionSetPayload[];
  total_calories_burned?: number;
};

export type ProgramSessionGeoCoordinate = {
  latitude: number;
  longitude: number;
};

export type ProgramSessionGeoActivityPayload = {
  activity_id: string;
  distance_km: number;
  avg_pace?: number;
  moving_time_sec: number;
  route_coordinates?: ProgramSessionGeoCoordinate[];
  calories_burned?: number;
  started_at?: string | null;
  ended_at?: string | null;
};

export type ProgramSessionPayload = {
  workouts: ProgramSessionWorkoutPayload[];
  geo_activities: ProgramSessionGeoActivityPayload[];
  program_name?: string;
  program_id?: string;
  group_id?: string;
  total_duration_minutes?: number;
  total_calories_burned?: number;
  performed_at?: string;
  end_time?: string | null;
};

export type SessionProgress = {
  geo_progress: {
    target_distance_km: number;
    completed_distance_km: number;
    percentage: number;
  };
  workout_progress: {
    target_sets: number;
    completed_sets: number;
    percentage: number;
  };
  overall_percentage: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'partial';
};

export type ProgramSession = {
  _id: string;
  user_id: string | { _id: string; username: string; profilePicture?: string };
  program_id?: string;
  group_id?: string;
  program_name: string;
  workouts: any[];
  geo_activities: any[];
  total_duration_minutes: number;
  total_calories_burned: number;
  performed_at: string;
  end_time?: string | null;
  progress?: SessionProgress;
  createdAt?: string;
  updatedAt?: string;
};

export const createProgramSession = async (payload: ProgramSessionPayload) => {
  const { data } = await axiosInstance.post("/program-sessions/createProgramSession", payload);
  return data;
};

export const getGroupProgramSessions = async (groupId: string): Promise<ProgramSession[]> => {
  const { data } = await axiosInstance.get(`/program-sessions/getGroupProgramSessions/${groupId}`);
  return data;
};

export const getProgramSessionsByProgramId = async (programId: string): Promise<ProgramSession[]> => {
  const { data } = await axiosInstance.get(`/program-sessions/getProgramSessionsByProgramId/${programId}`);
  return data;
};

export const getProgramSessionById = async (sessionId: string): Promise<ProgramSession> => {
  const { data } = await axiosInstance.get(`/program-sessions/getProgramSessionById/${sessionId}`);
  return data;
};
