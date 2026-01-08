import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Eye, EyeOff } from 'lucide-react';
import { Method, callApi } from '../netwrok/NetworkManager';
import { api } from '../netwrok/Environment';

const ChangePasswordSchema = Yup.object().shape({
  oldPassword: Yup.string().required('Old password is required'),
  newPassword: Yup.string()
    .required('New password is required')
    .min(8, 'Min 8 chars with upper, lower, number & symbol')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*]).{8,}$/,
      'Min 8 chars with upper, lower, number & symbol'
    ),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm your password'),
});

const ChangePassword = () => {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  return (
    <div className="w-full px-4">
      <div className="w-full space-y-4">
        <div className="text-left">
          <h1 className="text-2xl font-bold mb-1 text-black">Change Password</h1>
          <h3 className="text-sm text-gray-500">Change Your Password Here</h3>
        </div>

        <Formik
          initialValues={{ oldPassword: '', newPassword: '', confirmPassword: '' }}
          validationSchema={ChangePasswordSchema}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            setApiError('');
            setSuccessMessage('');

            await callApi({
              method: Method.POST,
              endPoint: api.updatePassword,
              bodyParams: {
                oldPassword: values.oldPassword,
                newPassword: values.newPassword,
              },
              onSuccess: (response) => {
                setSuccessMessage(response?.message || 'Password updated successfully.');
                resetForm();
              },
              onError: (error) => {
                setApiError(error?.message || 'Failed to update password. Please try again.');
              },
            });

            setSubmitting(false);
          }}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">

              {/* Old Password Field */}
              <div>
                <label className="block text-base font-medium mb-1 text-[#102a43]">Old Password</label>
                <div className="relative w-full sm:w-[312px]">
                  <Field
                    name="oldPassword"
                    type={showOldPassword ? 'text' : 'password'}
                    placeholder="Enter old password"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-600 text-gray-500 pr-10"
                  />
                  <div
                    className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-400"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                  >
                    {!showOldPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </div>
                </div>
                <ErrorMessage name="oldPassword" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-base font-medium mb-1 text-[#102a43]">Password</label>
                <div className="relative w-full sm:w-[312px]">
                  <Field
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-600 text-gray-500 pr-10"
                  />
                  <div
                    className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-400"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {!showNewPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </div>
                </div>
                <ErrorMessage name="newPassword" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-base font-medium mb-1 text-[#102a43]">Confirm Password</label>
                <div className="relative w-full sm:w-[312px]">
                  <Field
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-600 text-gray-500 pr-10"
                  />
                  <div
                    className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-400"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {!showConfirm ? <Eye size={20} /> : <EyeOff size={20} />}
                  </div>
                </div>
                <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              {/* API Feedback */}
              {apiError ? <div className="text-red-500 text-sm">{apiError}</div> : null}
              {successMessage ? <div className="text-green-600 text-sm">{successMessage}</div> : null}

              {/* Button */}
              <div className="flex w-full pt-0 justify-end">
                <button
                  type="submit"
                  className={`bg-teal-700 text-white px-12 sm:px-[130px] py-3 rounded-xl hover:bg-teal-800 transition-colors font-bold text-base min-w-[140px] ${isSubmitting ? 'opacity-70 pointer-events-none' : ''}`}
                >
                  Update
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};
export default ChangePassword;
