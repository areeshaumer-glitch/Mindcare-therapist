export const BASE_URL = 'https://mindcare.txdynamics.io/api/v1/';
export const SOCKETS_URL = BASE_URL.replace('https://', 'wss://').replace('/api/v1/', '');
export const api = {
  signIn: 'auth/signin',
  refreshToken: 'auth/refresh-token',
  forgotPassword: 'auth/forgot-password',
  verifyOtpForgotPassword: 'auth/verify-otp-forgot-password',
  resetPassword: 'auth/reset-password',
  updatePassword: 'auth/update-password',
  logout: 'auth/logout',
  therapistDashboard: 'therapist/dashboard',
  appointmentsTherapists: 'appointments/therapists',
  therapistProfile: 'therapist/profile',
  therapistProfileMe: 'therapist/profile/me',
  attendanceSummary: 'attendance/summary',
  feedbackMe: 'feedback/me',
  privacyPolicy: 'privacy-policy',
  termsAndConditions: 'terms-and-conditions',
  workouts: 'workouts',
  s3Upload: 's3/upload',
  availability: 'therapist/profile/availability',
  appointmentsMe: 'appointments/therapist/mine',
}
