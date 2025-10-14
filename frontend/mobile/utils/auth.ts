import auth from "@react-native-firebase/auth";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import axios from "axios";

export const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Fix: Add profilePicture to the type definition for userInfo
export const registerGoogleUser = async (userInfo: { username: string; email: string; googleId: string; profilePicture?: string }) => {
  return axios.post(`${API_URL}/users/google`, {
    username: userInfo.username,
    email: userInfo.email,
    googleId: userInfo.googleId,
    profilePicture: userInfo.profilePicture,
  });
};

export const registerUser = async (username: string, email: string, password: string) => {
  return axios.post(`${API_URL}/users/register`, { username, email, password });
};

export const loginUser = async (email: string, password: string) => {
  return axios.post(`${API_URL}/users/login`, { email, password });
};

// Shared Google Sign-In handler
export const handleGoogleSignInShared = async ({
  setLoading,
  onSuccess,
  onError,
  router,
}: {
  setLoading: (val: boolean) => void;
  onSuccess?: (response?: any) => void;
  onError?: (err: any) => void;
  router: any;
}) => {
  try {
    setLoading(true);
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
      offlineAccess: false,
    });
    await GoogleSignin.signOut();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const googleUser = await GoogleSignin.signIn();
    const googleUserAny: any = googleUser;
    const user = googleUserAny.data?.user;
    const profilePicture = user?.photo || user?.photoURL || null;
    const idToken = googleUserAny.data?.idToken;

    if (!idToken) {
      throw new Error('No ID token present in Google Sign-in response');
    }

    // Sign in to Firebase (native)
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    await auth().signInWithCredential(googleCredential);

    let backendResponse = null;
    try {
      backendResponse = await registerGoogleUser({
        username: user?.name || user?.givenName || "Google User",
        email: user?.email,
        googleId: user?.id,
        profilePicture,
      });
    } catch (dbErr: any) {
      console.warn("Mongo save failed:", dbErr?.message);
    }
    if (onSuccess) onSuccess(backendResponse);
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
    if (onError) onError(error);
    console.log("Google Sign-In Error:", error);
  } finally {
    setLoading(false);
  }
};