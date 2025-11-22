import axiosInstance from "./axiosInstance";

export type Workout = {
  _id: string;
  category: string;
  type: string;
  name: string;
  description: string;
  animation_url?: string;
  equipment_needed?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const getAllWorkouts = async (): Promise<Workout[]> => {
  const response = await axiosInstance.get("/workouts/getAllWorkouts");
  return response.data;
};