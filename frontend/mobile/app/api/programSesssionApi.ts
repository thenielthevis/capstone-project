import axiosInstance from "./axiosInstance";

export type ProgramSessionSetPayload = {
  reps: number;
  time_seconds: number;
  weight_kg: number;
};

export type ProgramSessionWorkoutPayload = {
  workout_id: string;
  name?: string;
  exercise_type?: string;
  animation_url?: string;
  sets: ProgramSessionSetPayload[];
  total_calories_burned?: number;
};

export type ProgramSessionGeoCoordinate = {
  latitude: number;
  longitude: number;
};

export type ProgramSessionGeoActivityPayload = {
  activity_id: string;
  name?: string;
  exercise_type?: string;
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
  total_duration_minutes?: number;
  total_calories_burned?: number;
  performed_at?: string;
  end_time?: string | null;
};

export const createProgramSession = async (payload: ProgramSessionPayload) => {
  const { data } = await axiosInstance.post("/program-sessions/createProgramSession", payload);
  return data;
};