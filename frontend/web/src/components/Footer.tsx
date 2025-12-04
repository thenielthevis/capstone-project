import React from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function Footer() {
  const { theme } = useTheme();
  
  return (
    <footer 
      className="py-6 mt-auto"
      style={{ 
        backgroundColor: theme.colors.secondary,
        color: '#FFFFFF'
      }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col items-center space-y-2">
          <p className="text-sm opacity-80">
            &copy; {new Date().getFullYear()} Lifora. All rights reserved.
          </p>
          <div className="flex space-x-4 text-sm">
            <a 
              href="mailto:contact@lifora.com" 
              className="opacity-70 hover:opacity-100 transition-opacity"
            >
              Contact
            </a>
            <span className="opacity-70">|</span>
            <a 
              href="#" 
              className="opacity-70 hover:opacity-100 transition-opacity"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}