import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import type { User } from '@/types/domain.types';

// Web client ID (Android) — from google-services.json oauth_client type 3
const WEB_CLIENT_ID =
  '350645055329-nvgv6k6qob3afrhs4kk8p4m4nb42qvuj.apps.googleusercontent.com';

// iOS client ID — from GoogleService-Info.plist CLIENT_ID
const IOS_CLIENT_ID =
  '350645055329-lla2otadqcatmv96l5g86dec65v105nb.apps.googleusercontent.com';

GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,
  iosClientId: IOS_CLIENT_ID,
});

function mapFirebaseUser(firebaseUser: { uid: string; displayName: string | null; email: string | null; photoURL: string | null }): User {
  return {
    id: firebaseUser.uid,
    username: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'User',
    email: firebaseUser.email ?? '',
    avatarUrl: firebaseUser.photoURL ?? '',
    role: 'student',
  };
}

export async function signInWithGoogle(): Promise<User> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await GoogleSignin.signIn();

  if (!response.data?.idToken) {
    throw new Error('Google Sign-In cancelled or failed');
  }

  const credential = GoogleAuthProvider.credential(response.data.idToken);
  const result = await signInWithCredential(auth, credential);
  const firebaseUser = result.user;

  // Save candidate profile to Firestore on first login
  const ref = doc(db, 'candidates', firebaseUser.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName,
      email: firebaseUser.email,
      photo: firebaseUser.photoURL,
      role: 'student',
      createdAt: new Date().toISOString(),
    });
  }

  return mapFirebaseUser(firebaseUser);
}

export async function signOutGoogle(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {
    // ignore if not signed in via Google
  }
  await signOut(auth);
}

export { statusCodes, mapFirebaseUser };
