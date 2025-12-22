import { Stack } from "expo-router";
import { useTheme } from "../../context/ThemeContext";

export default function ChatTabLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="ChatRoom" />
      <Stack.Screen name="NewChat" />
      <Stack.Screen name="CreateGroupChat" />
      <Stack.Screen name="ChatInfo" />
    </Stack>
  );
}
