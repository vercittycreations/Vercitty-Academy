import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updatePassword,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth } from './config'

export const loginUser = (email, password) =>
  signInWithEmailAndPassword(auth, email, password)

export const createUser = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password)

export const logoutUser = () => signOut(auth)

export const changePassword = (newPassword) =>
  updatePassword(auth.currentUser, newPassword)

export const resetPassword = (email) =>
  sendPasswordResetEmail(auth, email)