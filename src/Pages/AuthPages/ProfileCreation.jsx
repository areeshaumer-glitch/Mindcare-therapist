import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { DEFAULT_AVATAR } from '../../assets/defaultAvatar';
import AuthLayout from '../../layout/AuthLayout';
import PrimaryButton from '../../components/PrimaryButton';
import images from '../../assets/Images';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X } from 'lucide-react';
import TimeSlot from '../../components/TimeSlot';
import { Method, callApi } from '../../netwrok/NetworkManager';
import { api } from '../../netwrok/Environment';
import { useAuthStore } from '../../store/authSlice';

const ProfileSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  location: Yup.string().required('Location is required'),
  bio: Yup.string().required('Bio is required'),
  specializations: Yup.array()
    .min(1, 'Please select at least one specialization')
    .of(Yup.string())
});

const ProfileCreation = () => {
  const [image, setImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftProfile, setDraftProfile] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const specializations = ['Stress', 'Anxiety', 'Sleep', 'Focus'];
  const updateUserData = useAuthStore((s) => s.updateUserData);

  const toggleSpecialization = (item, setFieldValue) => {
    const updated = selectedSpecializations.includes(item)
      ? selectedSpecializations.filter((i) => i !== item)
      : [...selectedSpecializations, item];

    setSelectedSpecializations(updated);
    setFieldValue('specializations', updated); // Sync with Formik
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file); // preview URL
      setImage(previewUrl);
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', file);

      await callApi({
        method: Method.POST,
        endPoint: api.s3Upload,
        bodyParams: formData,
        multipart: true,
        onSuccess: (response) => {
          const url = response?.data?.url ?? response?.data ?? response?.url;
          if (url) {
            setImage(url);
            // window.showToast?.("Image uploaded successfully", "success");
          } else {
            console.warn("S3 Upload response missing URL");
          }
          setIsUploading(false);
        },
        onError: (err) => {
          window.showToast?.("Failed to upload image", "error");
          setIsUploading(false);
          setImage(null);
        }
      });
    }
  };
  const mapSpecializationKey = (value) => {
    const mapping = {
      Stress: 'stress_management',
      Anxiety: 'anxiety',
      Sleep: 'sleep',
      Focus: 'focus',
    };
    if (mapping[value]) return mapping[value];
    return String(value).trim().toLowerCase().replaceAll(' ', '_');
  };

  const handleSubmitProfile = async (availability) => {
    if (!draftProfile || isSavingProfile) return;
    setIsSavingProfile(true);

    const payload = {
      name: draftProfile.name,
      profileImage: image || undefined,
      location: draftProfile.location,
      bio: draftProfile.bio,
      specializations: (draftProfile.specializations || []).map(mapSpecializationKey),
      availability,
    };

    await callApi({
      method: Method.POST,
      endPoint: api.therapistProfile,
      bodyParams: payload,
      onSuccess: (response) => {
        const updated = response?.data;
        if (updated?.user?.isProfileCompleted != null) {
          updateUserData({ isProfileCompleted: updated.user.isProfileCompleted });
        } else {
          updateUserData({ isProfileCompleted: true });
        }
        setIsModalOpen(false);
        navigate('/home');
      },
      onError: (err) => {
        // Handled by global toaster
      },
    });

    setIsSavingProfile(false);
  };
  const Modal = ({ onClose, children }) => {
    return (
      <div
        className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-50"
        onClick={() => setIsModalOpen(false)}
      >
        <div
          className="bg-white rounded-[20px] w-[95%] max-w-6xl max-h-[90vh] overflow-y-auto shadow-xl relative [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    );
  };
  return (
    <div className='min-height flex'>
      <AuthLayout title="Profile Creation" centerContent={false}>
        <Formik
          initialValues={{ name: '', location: '', bio: '', specializations: [] }}
          validationSchema={ProfileSchema}
          onSubmit={(values) => {
            if (isUploading) {
              window.showToast?.("Please wait for image upload to complete", "warning");
              return;
            }
            setDraftProfile(values);
            setIsModalOpen(true);
          }}
        >
          {({ setFieldValue, errors, touched }) => (
            <Form className="space-y-4 w-full max-w-md mx-auto">


              {/* Profile Image Upload */}
              <div className="flex justify-center items-center mb-6">
                <label htmlFor="imageUpload" className="cursor-pointer relative">
                  <div className={`w-[120px] h-[120px] rounded-full flex items-center justify-center overflow-hidden ${image ? '' : 'bg-[#D9D9D9]'}`}>
                    {image ? (
                      <img
                        src={image}
                        alt="Upload"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                      />
                    ) : (
                      <Camera className="w-8 h-8 text-black opacity-70" />
                    )}
                  </div>

                  {isUploading && (
                    <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Name */}
              <Field
                name="name"
                type="text"
                placeholder="Add your Name"
                className={`w-full px-4 py-3 border rounded-[12px] focus:outline-none focus:ring-1 focus:ring-teal-500 text-gray-700 placeholder-gray-400 ${errors.name && touched.name ? 'border-red-500' : 'border-[#A1B0CC]'
                  }`}
              />

              {/* Location */}
              <div className="relative w-full">
                <Field
                  name="location"
                  type="text"
                  placeholder="Add your Location"
                  className={`w-full px-4 py-3 border rounded-[12px] focus:outline-none focus:ring-1 focus:ring-teal-500 text-gray-700 placeholder-gray-400 ${errors.location && touched.location ? 'border-red-500' : 'border-[#A1B0CC]'
                    }`}
                />
              </div>

              {/* Bio */}
              <Field
                as="textarea"
                name="bio"
                placeholder="Bio"
                className={`w-full px-4 py-3 h-32 border rounded-[12px] focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none text-gray-700 placeholder-gray-400 ${errors.bio && touched.bio ? 'border-red-500' : 'border-[#A1B0CC]'
                  }`}
              />

              {/* Specializations */}
              <div className="pt-2">
                <h6 className="text-base text-gray-500 mb-3">Specialization</h6>
                <div className="grid grid-cols-4 gap-2">
                  {specializations.map((item) => {
                    const isSelected = selectedSpecializations.includes(item);
                    return (
                      <button
                        type="button"
                        key={item}
                        onClick={() => toggleSpecialization(item, setFieldValue)}
                        className={`w-full py-2 rounded-[8px] text-sm font-medium transition-colors flex items-center justify-center ${isSelected ? 'bg-teal-700 text-white' : 'bg-[#D9D9D9] text-white hover:bg-gray-400'}`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
                <ErrorMessage name="specializations" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <PrimaryButton type="submit" className="rounded-[12px] py-3.5">NEXT</PrimaryButton>
              </div>
            </Form>
          )}
        </Formik>

      </AuthLayout>
      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>

          <TimeSlot onNext={handleSubmitProfile} isSubmitting={isSavingProfile} />

        </Modal>
      )}
    </div>
  );
};

export default ProfileCreation;
