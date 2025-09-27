export const getThemeClass = (isDarkMode: boolean, styles: {
  dark: string;
  light: string;
}) => {
  return isDarkMode ? styles.dark : styles.light;
};

// Commonly used theme combinations
export const themeStyles = {
  text: {
    primary: {
      dark: 'text-customBlue-500-dark',
      light: 'text-customBlue-500-light'
    },
    secondary: {
      dark: 'text-secondary-dark',
      light: 'text-secondary-light'
    },
    background: {
      dark: 'bg-background-dark',
      light: 'bg-background-light'
    }
  },
  font: {
    heading: 'font-[Inter-Bold]',
    body: 'font-[Inter]',
    subtitle: 'font-[Inter]'
  }
};