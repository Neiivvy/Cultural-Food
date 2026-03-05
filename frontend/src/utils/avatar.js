// Returns Cloudinary URL if present, else falls back to ui-avatars.com
export const getAvatar = (profilePicture, name = "User", size = 40) => {
  if (profilePicture) return profilePicture;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ec4899&color=fff&size=${size}`;
};