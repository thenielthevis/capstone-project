import { useTheme } from "../app/context/ThemeContext"

export const useAppTheme = () => {
  const { theme } = useTheme();
  return theme;
};
