import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updatePassword,
  sendPasswordResetEmail,
  getAuth,
} from 'firebase/auth'
import { initializeApp, deleteApp } from 'firebase/app'
import { auth, firebaseConfig } from './config'

export const loginUser = (email, password) =>
  signInWithEmailAndPassword(auth, email, password)

/**
 * Creates a new Firebase Auth user WITHOUT affecting the currently
 * signed-in admin session.  We spin up a temporary secondary Firebase
 * app, create the user there, then immediately tear the secondary app
 * down.  The primary auth (admin) is never touched.
 */
export const createUser = async (email, password) => {
  const secondaryApp  = initializeApp(firebaseConfig, `secondary-${Date.now()}`)
  const secondaryAuth = getAuth(secondaryApp)
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password)
    await deleteApp(secondaryApp)
    return cred
  } catch (err) {
    await deleteApp(secondaryApp)
    throw err
  }
}

export const logoutUser = () => signOut(auth)

export const changePassword = (newPassword) =>
  updatePassword(auth.currentUser, newPassword)

export const resetPassword = (email) =>
  sendPasswordResetEmail(auth, email)