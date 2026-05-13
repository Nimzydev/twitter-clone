import React, { useEffect, useRef, useState } from "react";
import { IoArrowBackOutline } from "react-icons/io5";
import { CiEdit } from "react-icons/ci";
import Posts from "../../components/Post/Posts";
import { useNavigate, useParams } from "react-router-dom";
import Editmodal from "../../components/Editmodal/Editmodal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TailSpin } from "react-loader-spinner";
import useUpdateProfileUser from "../../hooks/useUpdateUser";
import { useFollow } from "../../hooks/useFollow";
import FollowListModal from "../../components/FollowListModal/FollowListModal";

function Profile() {
  const [coverImg, setCoverImg] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [postType, setPostType] = useState("Tweets");
  const [isOpen, setIsOpen] = useState(false);

  // ✅ NEW STATES
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalTitle, setFollowModalTitle] = useState("");
  const [followUsers, setFollowUsers] = useState([]);

  const coverImgRef = useRef(null);
  const imgRef = useRef(null);

  const navigate = useNavigate();
  const { username } = useParams();

  const { follow } = useFollow();
  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData(["authUser"]);

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

  const { updateProfile, isUpdatingProfile } =
    useUpdateProfileUser();

  const isMyProfile = authUser?._id === user?._id;
  const amIFollowing = authUser?.following?.includes(user?._id);

  const handleChange = (e, type) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      if (type === "cover") setCoverImg(reader.result);
      if (type === "profile") setProfilePic(reader.result);
    };

    reader.readAsDataURL(file);
  };

  useEffect(() => {
    refetch();
  }, [username]);

  // ✅ OPEN FOLLOWERS
  const handleOpenFollowers = async () => {
    try {
      const res = await fetch(
        `/api/user/followers/${user._id}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setFollowUsers(data);
      setFollowModalTitle("Followers");
      setFollowModalOpen(true);

    } catch (error) {
      console.error(error);
    }
  };

  // ✅ OPEN FOLLOWING
  const handleOpenFollowing = async () => {
    try {
      const res = await fetch(
        `/api/user/following/${user._id}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setFollowUsers(data);
      setFollowModalTitle("Following");
      setFollowModalOpen(true);

    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* LOADING */}
      {(isLoading || isFetching) && (
        <div className="flex justify-center py-10">
          <TailSpin width={40} height={40} color="white" />
        </div>
      )}

      {/* CONTENT */}
      {user && (
        <>
          {/* HEADER */}
          <div className="flex items-center gap-4 p-4 border-b border-gray-800">
            <IoArrowBackOutline
              className="cursor-pointer text-xl"
              onClick={() => navigate("/")}
            />

            <div>
              <h1 className="font-bold text-lg">
                {user.fullName}
              </h1>

              <p className="text-sm text-gray-400">
                Profile
              </p>
            </div>
          </div>

          {/* COVER */}
          <div className="relative">
            <img
              src={coverImg || user.coverImg || "/twitter.avif"}
              className="w-full h-40 object-cover"
            />

            {isMyProfile && (
              <>
                <CiEdit
                  className="absolute top-2 right-2 text-white cursor-pointer"
                  onClick={() => coverImgRef.current.click()}
                />

                <input
                  hidden
                  ref={coverImgRef}
                  type="file"
                  onChange={(e) => handleChange(e, "cover")}
                />
              </>
            )}
          </div>

          {/* PROFILE PIC */}
          <div className="relative px-4">
            <img
              src={profilePic || user.profilePic || "/avatar.jpg"}
              className="w-24 h-24 rounded-full border-4 border-black -mt-12 object-cover"
            />

            {isMyProfile && (
              <>
                <CiEdit
                  className="absolute left-24 bottom-2 cursor-pointer text-white"
                  onClick={() => imgRef.current.click()}
                />

                <input
                  hidden
                  ref={imgRef}
                  type="file"
                  onChange={(e) => handleChange(e, "profile")}
                />
              </>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end px-4 mt-2">
            {isMyProfile ? (
              <button
                onClick={() => setIsOpen(true)}
                className="border border-gray-600 px-4 py-1 rounded-full hover:bg-gray-800"
              >
                Edit profile
              </button>
            ) : (
              <button
                onClick={() => follow(user._id)}
                className="bg-white text-black px-4 py-1 rounded-full font-semibold"
              >
                {amIFollowing ? "Unfollow" : "Follow"}
              </button>
            )}
          </div>

          {/* UPDATE IMAGE BTN */}
          {(coverImg || profilePic) && (
            <div className="px-4 mt-2">
              <button
                onClick={async () => {
                  await updateProfile({
                    coverImg,
                    profilePic,
                  });

                  setCoverImg(null);
                  setProfilePic(null);
                }}
                className="bg-blue-500 px-4 py-2 rounded-full text-white"
              >
                {isUpdatingProfile
                  ? "Updating..."
                  : "Save changes"}
              </button>
            </div>
          )}

          {/* USER INFO */}
          <div className="px-4 mt-4 space-y-1">
            <h2 className="font-bold text-lg">
              {user.fullName}
            </h2>

            <p className="text-gray-400">
              @{user.username}
            </p>

            <p>{user.bio}</p>

            {/* ✅ CLICKABLE FOLLOWERS/FOLLOWING */}
            <div className="flex gap-6 text-sm text-gray-400 mt-2">

              <button
                onClick={handleOpenFollowing}
                className="hover:text-white transition"
              >
                <span className="font-semibold text-white">
                  {user.following?.length}
                </span>{" "}
                Following
              </button>

              <button
                onClick={handleOpenFollowers}
                className="hover:text-white transition"
              >
                <span className="font-semibold text-white">
                  {user.followers?.length}
                </span>{" "}
                Followers
              </button>

            </div>
          </div>

          {/* TABS */}
          <div className="flex justify-around mt-4 border-b border-gray-800">
            {["Tweets", "Retweets", "Likes"].map((type) => (
              <button
                key={type}
                onClick={() => setPostType(type)}
                className={`flex-1 py-2 text-sm ${
                  postType === type
                    ? "border-b-2 border-blue-500 text-white"
                    : "text-gray-400"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* POSTS */}
          <Posts
            postType={postType}
            username={username}
            userId={user._id}
          />

          {/* MODAL */}
          <Editmodal
            authUser={authUser}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
          />

          {/* ✅ FOLLOW LIST MODAL */}
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