import React, { useState, useRef } from 'react';
import images from '../assets/Images';
import { DEFAULT_AVATAR } from '../assets/defaultAvatar';
import { Method, callApi } from '../netwrok/NetworkManager';
import { api } from '../netwrok/Environment';
import { User, MapPin, Camera } from 'lucide-react';

const EditProfile = ({ profile, onProfileUpdate }) => {
  const [profileData, setProfileData] = useState(profile);
  const [image, setImage] = useState(null); // Preview or S3 URL
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);

  const specializationMapping = {
    Stress: 'stress_management',
    Anxiety: 'anxiety',
    Sleep: 'sleep',
    Focus: 'focus',
  };
  const uiSpecializations = ['Stress', 'Anxiety', 'Sleep', 'Focus'];

  // Fetch latest profile data on mount
  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        await callApi({
          method: Method.GET,
          endPoint: api.therapistProfileMe,
          onSuccess: (response) => {
            if (response?.data) {
              setProfileData(response.data);
            }
          },
          onError: (err) => {
            console.error("Failed to fetch fresh profile", err);
          }
        });
      } catch (e) {
        console.error("Error fetching profile", e);
      }
    };
    fetchProfile();
  }, []);

  // Update local state if prop changes (optional, but good for sync)
  React.useEffect(() => {
    if (profile) {
      setProfileData(prev => ({ ...prev, ...profile }));
    }
  }, [profile]);

  const displayName =
    profileData?.name ||
    profileData?.fullName ||
    profileData?.user?.name ||
    profileData?.user?.fullName ||
    'Therapist';
  const profileImage =
    image ||
    profileData?.profileImage ||
    profileData?.user?.profileImage ||
    profileData?.user?.avatar ||
    null;
  const bio = profileData?.bio || '';
  const location = profileData?.location || '';
  const specializations = Array.isArray(profileData?.specializations) ? profileData.specializations : [];

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = String(file.name || '').toLowerCase();
    const isImageFile =
      (typeof file.type === 'string' && file.type.startsWith('image/')) ||
      ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.tif', '.tiff', '.heic', '.heif'].some((ext) =>
        fileName.endsWith(ext)
      );

    if (!isImageFile) {
      window.showToast?.('Only image files are allowed', 'error');
      e.target.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImage((prev) => {
      if (typeof prev === 'string' && prev.startsWith('blob:')) {
        URL.revokeObjectURL(prev);
      }
      return previewUrl;
    });
    setSelectedFile(file);
  };

  const uploadToS3 = async (file) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      callApi({
        method: Method.POST,
        endPoint: api.s3Upload,
        bodyParams: formData,
        multipart: true,
        onSuccess: (response) => {
          const url = response?.data?.url ?? response?.data ?? response?.url;
          if (url) {
            resolve(url);
          } else {
            console.warn("S3 Upload response missing URL:", response);
            reject("Upload successful but URL missing");
          }
        },
        onError: (err) => {
          console.error("Upload error callback:", err);
          reject(err);
        }
      });
    });
  };

  const handleUpdate = async () => {
    setIsUpdating(true);

    let imageUrl = image;

    if (selectedFile) {
      try {
        setIsUploading(true);
        imageUrl = await uploadToS3(selectedFile);
        setIsUploading(false);
      } catch (error) {
        setIsUploading(false);
        setIsUpdating(false);
        window.showToast?.("Failed to upload image", "error");
        return;
      }
    }

    const payload = {
      name: profileData?.name,
      location: profileData?.location,
      bio: profileData?.bio,
      specializations: profileData?.specializations,
      availability: profileData?.availability,
      profileImage: imageUrl || profileData?.profileImage,
    };

    await callApi({
      method: Method.POST,
      endPoint: api.therapistProfile,
      bodyParams: payload,
      onSuccess: (res) => {
        window.showToast?.("Profile updated successfully", "success");
        setIsUpdating(false);
        setIsEditing(false); // Switch back to read-only
        // Update local state to reflect changes immediately
        if (imageUrl) {
          setProfileData(prev => ({ ...prev, profileImage: imageUrl }));
          // Clear selected file after successful update
          setSelectedFile(null);
          // If we have a blob URL in image, update it to the real S3 URL
          setImage(imageUrl);
        }
        if (onProfileUpdate) {
          onProfileUpdate({ ...payload, profileImage: imageUrl || profileData?.profileImage });
        }
      },
      onError: (err) => {
        window.showToast?.("Failed to update profile", "error");
        setIsUpdating(false);
      }
    });
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const toggleSpecialization = (item) => {
    const backendKey = specializationMapping[item];
    const currentSpecs = Array.isArray(profileData.specializations) ? profileData.specializations : [];
    
    // Check if selected (handling potential inconsistent backend data)
    const isSelected = currentSpecs.includes(backendKey) || currentSpecs.includes(item.toLowerCase());
    
    let updated;
    if (isSelected) {
       updated = currentSpecs.filter(k => k !== backendKey && k !== item.toLowerCase());
    } else {
       updated = [...currentSpecs, backendKey];
    }
    
    setProfileData(prev => ({ ...prev, specializations: updated }));
  };

  return (
    <div className="w-full px-4">
      <div className="space-y-4 w-full">
        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          ref={fileInputRef}
        />

        {!isEditing ? (
          // Read-Only View
          <>
            <div className='flex flex-row items-center gap-3 flex-wrap'>
              <div className='relative'>
                <img
                  src={profileImage || DEFAULT_AVATAR}
                  alt="Profile"
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_AVATAR;
                  }}
                />
              </div>
              <h3 className="font-semibold text-base md:text-lg mt-2 md:mt-4">{displayName}</h3>
            </div>

            <div>
              {bio ? <p className="text-sm mt-4 whitespace-pre-line">{bio}</p> : null}
              <h3 className="font-semibold text-lg mt-4">Location</h3>
              <p className="text-sm mt-4">{location || '-'}</p>
              <h3 className="font-semibold text-lg mt-4">Specializations</h3>
              <div className="flex flex-row gap-2 flex-wrap">
                {specializations.length > 0
                  ? specializations.map((spec) => (
                    <p key={spec} className="text-sm mt-4 bg-[#87CEEB] px-4 text-white p-2 rounded-xl">
                      {String(spec).replaceAll('_', ' ')}
                    </p>
                  ))
                  : <p className="text-sm mt-4">-</p>}
              </div>
            </div>
            <div className="flex w-full pt-4 justify-start sm:justify-end">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-teal-700 text-white px-6 sm:px-[110px] py-2 rounded-xl hover:bg-teal-800 transition-colors font-medium min-w-[140px] flex items-center justify-center"
              >
                Update
              </button>
            </div>
          </>
        ) : (
          // Edit Mode
          <div className="flex flex-col gap-[12px]">
             {/* Profile Image Upload */}
             <div className="flex justify-start items-center mb-6">
                <button
                  onClick={handleButtonClick}
                  className="cursor-pointer relative hover:opacity-80 transition-opacity"
                  disabled={isUploading}
                >
                  <div className={`w-[120px] h-[120px] rounded-full flex items-center justify-center overflow-hidden ${profileImage ? '' : 'bg-[#D9D9D9]'}`}>
                    {profileImage ? (
                      <img
                        src={profileImage}
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
                  
                   {!profileImage && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <Camera className="w-8 h-8 text-black opacity-50" />
                    </div>
                   )}
                </button>
              </div>

            {/* Name */}
            <div className="relative w-full max-w-[390px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={profileData?.name || ''}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Add your Name"
                disabled={isUpdating}
                className="w-full h-[48px] pl-10 pr-4 border border-[#A1B0CC] rounded-[12px] focus:outline-none focus:ring-1 focus:ring-teal-500 text-gray-700 placeholder-gray-400"
              />
            </div>

            {/* Location */}
            <div className="relative w-full max-w-[390px]">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={profileData?.location || ''}
                onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Add your Location"
                disabled={isUpdating}
                className="w-full h-[48px] pl-10 pr-4 border border-[#A1B0CC] rounded-[12px] focus:outline-none focus:ring-1 focus:ring-teal-500 text-gray-700 placeholder-gray-400"
              />
            </div>

            {/* Bio */}
            <textarea
              value={profileData?.bio || ''}
              onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Bio"
              disabled={isUpdating}
              className="w-full max-w-[390px] px-4 py-3 h-32 border border-[#A1B0CC] rounded-[12px] focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none text-gray-700 placeholder-gray-400"
            />

            {/* Specializations */}
            <div className="pt-2 w-full max-w-[390px]">
              <h6 className="text-base text-gray-500 mb-3">Specialization</h6>
              <div className="flex flex-wrap gap-2">
                {uiSpecializations.map((item) => {
                  const backendKey = specializationMapping[item];
                  const currentSpecs = Array.isArray(profileData?.specializations) ? profileData.specializations : [];
                  const isSelected = currentSpecs.includes(backendKey) || currentSpecs.includes(item.toLowerCase());
                  
                  return (
                    <button
                      type="button"
                      key={item}
                      onClick={() => toggleSpecialization(item)}
                      className={`w-[91px] h-[26px] rounded-[8px] flex items-center justify-center text-xs font-medium transition-colors ${isSelected ? 'bg-[#87CEEB] text-white' : 'bg-[#D9D9D9] text-white hover:bg-gray-400'}`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex w-full pt-6 justify-center sm:justify-end">
              <button
                onClick={handleUpdate}
                disabled={isUpdating || isUploading}
                className={`bg-teal-700 text-white w-[312px] h-[50px] rounded-[12px] hover:bg-teal-800 transition-colors font-bold text-lg flex items-center justify-center ${isUpdating ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditProfile;
