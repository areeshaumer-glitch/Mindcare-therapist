import React, { useState, useRef } from 'react';
import images from '../assets/Images';
import { DEFAULT_AVATAR } from '../assets/defaultAvatar';
import { Method, callApi } from '../netwrok/NetworkManager';
import { api } from '../netwrok/Environment';

const EditProfile = ({ profile, onProfileUpdate }) => {
  const [profileData, setProfileData] = useState(profile);
  const [image, setImage] = useState(null); // Preview or S3 URL
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef(null);

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
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImage(previewUrl);
      setSelectedFile(file);
    }
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

        <div className='flex flex-row items-center gap-3 flex-wrap'>
          <button
            onClick={handleButtonClick}
            className='flex hover:opacity-80 transition-opacity relative'
            disabled={isUploading}
          >
            {/* Simplified Logic: Show profileImage if valid, else default camera. Border removed. */}
            <img
              src={profileImage || DEFAULT_AVATAR}
              alt="Profile"
              className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_AVATAR;
              }}
            />

            {isUploading && (
              <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </button>
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
            onClick={handleUpdate}
            disabled={isUpdating || isUploading}
            className={`bg-teal-700 text-white px-6 sm:px-[110px] py-2 rounded-xl hover:bg-teal-800 transition-colors font-medium min-w-[140px] flex items-center justify-center ${isUpdating ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isUpdating ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
