import React, { useState } from 'react';
import { Form, Formik } from 'formik';
import { useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import { Eye, EyeOff } from 'lucide-react';
import PrimaryButton from '../../components/PrimaryButton';
import CustomInput from '../../components/CustomInput';
import AuthLayout from '../../layout/AuthLayout';
import { Method, callApi } from '../../netwrok/NetworkManager';
import { api } from '../../netwrok/Environment';
import { useAuthStore } from '../../store/authSlice';

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const setToken = useAuthStore((s) => s.setToken);
  const setRefreshToken = useAuthStore((s) => s.setRefreshToken);
  const setUserData = useAuthStore((s) => s.setUserData);
  const logout = useAuthStore((s) => s.logout);

  const loginValidationSchema = Yup.object({
    email: Yup.string().email('Invalid email').required('email is Required'),
  password: Yup.string()
  .min(8, 'Min 8 chars with upper, lower, number & symbol')
  .matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*]).{8,}$/,
    'Min 8 chars with upper, lower, number & symbol'
  )
  .required('Password is required'),
  });
  const navigate = useNavigate(); 

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
   <AuthLayout title="Welcome Back" description="Sign in to manage appointments, sessions, and your profile.">
      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={loginValidationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          await callApi({
            method: Method.POST,
            endPoint: api.signIn,
            bodyParams: {
              email: values.email,
              password: values.password,
            },
            onSuccess: (response) => {
              const accessToken = response?.accessToken;
              const refreshToken = response?.refreshToken;

              if (typeof accessToken === 'string' && accessToken.length > 0) {
                setToken(accessToken);
              }
              if (typeof refreshToken === 'string' && refreshToken.length > 0) {
                setRefreshToken(refreshToken);
              }
              if (response?.user) {
                setUserData(response.user);
              }
              const role = String(response?.user?.role || '').toLowerCase();
              if (role.includes('instructor')) {
                window.showToast?.('Please sign in with a therapist account.', 'error');
                logout();
                navigate('/', { replace: true });
                return;
              }
              callApi({
                method: Method.GET,
                endPoint: api.therapistProfileMe,
                onSuccess: (meResponse) => {
                  const payload = meResponse?.data ?? meResponse;
                  const data = payload?.data ?? payload;
                  const me = data?.therapistProfile ?? data?.profile ?? data?.therapist ?? data;
                  if (me) {
                    useAuthStore.getState().updateUserData({ isProfileCompleted: true });
                    navigate('/home/dashboard');
                    return;
                  }
                  navigate('/create-profile');
                },
                onError: (err) => {
                  const message = String(err?.message ?? '').toLowerCase();
                  const status = err?.status;

                  if (
                    message.includes('permission') ||
                    message.includes('forbidden') ||
                    message.includes('not authorized') ||
                    message.includes('not authorised')
                  ) {
                    logout();
                    navigate('/', { replace: true });
                    return;
                  }
                  if (status === 404 || message.includes('profile not found') || message.includes('therapist profile not found')) {
                    navigate('/create-profile');
                    return;
                  }
                  navigate('/home/dashboard');
                },
              });
            },
            onError: (error) => {
              // Handled by global toaster
            },
          });

          setSubmitting(false);
        }}
      >
        {({ isSubmitting, values, errors, handleChange }) => (
          <Form className="space-y-4">
            <CustomInput
              name="email"
              type="email"
              placeholder="Enter Your Mail"
              onChange={handleChange}
            />
            <CustomInput
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter Your Password"
              onChange={handleChange}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="flex items-center justify-center h-full"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
            />
            <div className="flex justify-end">
              <button 
                onClick={handleForgotPassword}
              type="button" className="text-md text-[#8E8E93]  mb-4"  >
                Forgot Password?
              </button>
            </div>
            <PrimaryButton type="submit" className={isSubmitting ? 'opacity-70 pointer-events-none' : ''}>
              SIGN IN
            </PrimaryButton>
          </Form>
        )}
      </Formik>
      
        
    </AuthLayout>
  );
}
