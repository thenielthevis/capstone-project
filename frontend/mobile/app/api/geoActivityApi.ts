import axiosInstance from "./axiosInstance";

export type GeoActivity = {
  _id: string;
  name: string;
  type?: 'Foot Sports' | 'Cycle Sports' | 'Water Sports' | 'Other Sports';
  description?: string;
  icon?: string;
  animation?: string;
  met?: number;
  createdAt?: string;
  updatedAt?: string;
};

export const getAllGeoActivities = async (): Promise<GeoActivity[]> => {
  const response = await axiosInstance.get("/geo/getAllGeoActivities");
  return response.data;
};

export default getAllGeoActivities;