import React, { useEffect, useRef, useState } from "react";
import { IoArrowBackOutline } from "react-icons/io5";
import { MdEdit } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import Posts from "../../components/Post/Posts";
import { useNavigate, useParams } from "react-router-dom";
import Editmodal from "../../components/Editmodal/Editmodal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TailSpin } from "react-loader-spinner";
import useUpdateProfileUser from "../../hooks/useUpdateUser";
import { useFollow } from "../../hooks/useFollow";
import FollowListModal from "../../components/FollowListModal/FollowListModal";
import toast from "react-hot-toast";

function Profile() {
  const [coverImg, setCoverImg] = useState(null);
  const [coverImgFile, setCoverImgFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [postType, setPostType] = useState("Tweets");
  const [isOpen, setIsOpen] = useState(false);

  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalTitle, setFollowModalTitle] = useState("");
  const [followUsers, setFollowUsers] = useState([]);

  const coverImgRef = useRef(null);
  const profilePicRef = useRef(null);

  const navigate = useNavigate();
  const { username } = useParams();

  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);
  const { follow } = useFollow();
  const { updateProfile, isUpdatingProfile } = useUpdateProfileUser();

  const {
    data: user,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["user", username],
    queryFn: async () => {
      const res = await fetch(`/api/user/profile/${username}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
  });

  const isMyProfile = authUser?._id === user?._id;
  const amIFollowing = authUser?.following?.includes(user?._id);

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure? This will permanently delete your account."
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch("/api/user/delete-account", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Account deleted");
      queryClient.invalidateQueries(["authUser"]);
      navigate("/signin");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openFollowers = async () => {
    try {
      const res = await fetch(`/api/user/followers/${user._id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFollowUsers(data);
      setFollowModalTitle("Followers");
      setFollowModalOpen(true);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openFollowing = async () => {
    try {
      const res = await fetch(`/api/user/following/${user._id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFollowUsers(data);
      setFollowModalTitle("Following");
      setFollowModalOpen(true);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // COVER IMAGE SELECT → preview only
  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverImgFile(file);
    const reader = new FileReader();
    reader.onload = () => setCoverImg(reader.result);
    reader.readAsDataURL(file);
    // reset input so same file can be re-selected after cancel
    e.target.value = "";
  };

  // PROFILE PIC SELECT → preview only
  const handleProfilePicSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePicFile(file);
    const reader = new FileReader();
    reader.onload = () => setProfilePicPreview(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // CANCEL COVER PREVIEW
  const cancelCoverPreview = () => {
    setCoverImg(null);
    setCoverImgFile(null);
  };

  // CANCEL PROFILE PIC PREVIEW
  const cancelProfilePicPreview = () => {
    setProfilePicPreview(null);
    setProfilePicFile(null);
  };

  // SAVE BOTH PREVIEWS
  const handleSaveImages = async () => {
    const updates = {};
    if (coverImg) updates.coverImg = coverImg;
    if (profilePicPreview) updates.profilePic = profilePicPreview;
    if (Object.keys(updates).length === 0) return;
    await updateProfile(updates);
    setCoverImg(null);
    setCoverImgFile(null);
    setProfilePicPreview(null);
    setProfilePicFile(null);
  };

  useEffect(() => {
    refetch();
  }, [username]);

  return (
    <div className="w-full max-w-2xl mx-auto min-h-screen border-r border-l border-gray-800">

      {(isLoading || isFetching) && (
        <div className="flex justify-center py-10">
          <TailSpin width={40} height={40} color="white" />
        </div>
      )}

      {user && (
        <>
          {/* HEADER */}
          <div className="flex items-center gap-4 p-4 border-b border-gray-800 sticky top-0 bg-black z-10">
            <IoArrowBackOutline
              className="cursor-pointer text-xl"
              onClick={() => navigate("/")}
            />
            <div>
              <h1 className="font-bold text-lg">{user.fullName}</h1>
              <p className="text-sm text-gray-400">@{user.username}</p>
            </div>
          </div>

          {/* COVER IMAGE */}
          <div className="relative w-full h-52 bg-gray-900">
            {/* Cover photo display */}
            {coverImg ? (
              <img
                src={coverImg}
                className="w-full h-full object-cover"
                alt="cover preview"
              />
            ) : (
              user.coverImg && user.coverImg !== "" && (
                <img
                  src={user.coverImg}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = "none"; }}
                  alt="cover"
                />
              )
            )}

            {/* Cover preview X cancel button */}
            {coverImg && isMyProfile && (
              <button
                onClick={cancelCoverPreview}
                className="absolute top-3 left-3 bg-black/70 hover:bg-black text-white p-1.5 rounded-full transition z-20"
                title="Cancel cover preview"
              >
                <IoMdClose size={16} />
              </button>
            )}

            {/* Cover edit icon — only on own profile */}
            {isMyProfile && (
              <button
                onClick={() => coverImgRef.current.click()}
                className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition z-10"
                title="Change cover photo"
              >
                <MdEdit size={18} />
              </button>
            )}

            {/* Hidden cover file input */}
            <input
              type="file"
              accept="image/*"
              ref={coverImgRef}
              onChange={handleCoverSelect}
              className="hidden"
            />

            {/* PROFILE PIC — sits on bottom-left of cover */}
            <div className="absolute -bottom-16 left-4">
              <div className="relative w-32 h-32">
                <img
                  src={profilePicPreview || user.profilePic || "/avatar.jpg"}
                  alt="profile"
                  className="w-32 h-32 rounded-full border-4 border-black object-cover bg-black"
                />

                {/* Profile pic X cancel button */}
                {profilePicPreview && isMyProfile && (
                  <button
                    onClick={cancelProfilePicPreview}
                    className="absolute top-0 right-0 bg-black/70 hover:bg-black text-white p-1 rounded-full transition z-20"
                    title="Cancel profile pic preview"
                  >
                    <IoMdClose size={14} />
                  </button>
                )}

                {/* Profile pic edit icon — only on own profile */}
                {isMyProfile && (
                  <button
                    onClick={() => profilePicRef.current.click()}
                    className="absolute bottom-1 right-1 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition z-10"
                    title="Change profile picture"
                  >
                    <MdEdit size={14} />
                  </button>
                )}

                {/* Hidden profile pic file input */}
                <input
                  type="file"
                  accept="image/*"
                  ref={profilePicRef}
                  onChange={handleProfilePicSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end px-4 mt-5 gap-3">
            {isMyProfile ? (
              <>
                {/* Save images button — only shown when there's a pending preview */}
                {(coverImg || profilePicPreview) && (
                  <button
                    onClick={handleSaveImages}
                    disabled={isUpdatingProfile}
                    className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-full flex items-center gap-2 disabled:opacity-60"
                  >
                    {isUpdatingProfile ? (
                      <TailSpin width={16} height={16} color="white" />
                    ) : (
                      "Save photos"
                    )}
                  </button>
                )}

                <button
                  onClick={() => setIsOpen(true)}
                  className="border border-gray-500 px-4 py-2 rounded-full hover:bg-gray-900"
                >
                  Edit profile
                </button>

                <button
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-full"
                >
                  Delete account
                </button>
              </>
            ) : (
              <button
                onClick={() => follow(user._id)}
                className="bg-white text-black px-4 py-2 rounded-full font-semibold hover:bg-gray-200"
              >
                {amIFollowing ? "Unfollow" : "Follow"}
              </button>
            )}
          </div>

          {/* USER INFO */}
          <div className="mt-16 px-4">
            <h1 className="text-2xl font-bold">{user.fullName}</h1>
            <p className="text-gray-400">@{user.username}</p>
            {user.bio && (
              <p className="mt-3 text-white break-words">{user.bio}</p>
            )}
            <div className="flex gap-5 mt-4 text-sm">
              <button onClick={openFollowing} className="hover:underline">
                <span className="font-bold">{user.following?.length}</span> Following
              </button>
              <button onClick={openFollowers} className="hover:underline">
                <span className="font-bold">{user.followers?.length}</span> Followers
              </button>
            </div>
          </div>

          {/* TABS */}
          <div className="flex mt-6 border-b border-gray-800">
            <button
              onClick={() => setPostType("Tweets")}
              className={`flex-1 py-3 font-semibold ${
                postType === "Tweets" ? "border-b-4 border-blue-500" : "text-gray-400"
              }`}
            >
              Tweets
            </button>
            <button
              onClick={() => setPostType("Likes")}
              className={`flex-1 py-3 font-semibold ${
                postType === "Likes" ? "border-b-4 border-blue-500" : "text-gray-400"
              }`}
            >
              Likes
            </button>
            <button
              onClick={() => setPostType("Retweets")}
              className={`flex-1 py-3 font-semibold ${
                postType === "Retweets" ? "border-b-4 border-blue-500" : "text-gray-400"
              }`}
            >
              Retweets
            </button>
          </div>

          <Posts postType={postType} username={username} userId={user._id} />

          <Editmodal authUser={authUser} isOpen={isOpen} setIsOpen={setIsOpen} />

          <FollowListModal
            isOpen={followModalOpen}
            setIsOpen={setFollowModalOpen}
            title={followModalTitle}
            users={followUsers}
          />
        </>
      )}
    </div>
  );
}

export default Profile;