import React from "react";
import Toast from "react-native-toast-message";

export const showToast = ({ type = "success", text1 = "", text2 = "" }) => {
  Toast.show({
    type,
    text1,
    text2,
    position: "top",
    visibilityTime: 2500,
    autoHide: true,
  });
};

const ToastConfig = {
  success: (props: any) => (
    <Toast 
      {...props} 
      style={{ 
        borderLeftColor: '#4BB543', 
        borderLeftWidth: 6,
      }} 
      text1Style={{ color: '#4BB543', fontWeight: 'bold' }} 
    />
  ),
  error: (props: any) => (
    <Toast 
      {...props} 
      style={{ 
        borderLeftColor: '#FF3B30', 
        borderLeftWidth: 6,
      }} 
      text1Style={{ color: '#FF3B30', fontWeight: 'bold' }} 
    />
  ),
  info: (props: any) => (
    <Toast 
      {...props} 
      style={{ 
        borderLeftColor: '#007AFF', 
        borderLeftWidth: 6,
      }} 
      text1Style={{ color: '#007AFF', fontWeight: 'bold' }} 
    />
  ),
};

export const ToastProvider = () => (
  <Toast 
    config={ToastConfig} 
    topOffset={60}
    visibilityTime={2500}
  />
);
