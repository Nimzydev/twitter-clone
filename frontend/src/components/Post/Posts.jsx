import React, { useEffect, useState } from "react";
import "./Posts.css";
import Post from "./Post";
import { TailSpin } from "react-loader-spinner";
import { useQuery } from "@tanstack/react-query";

function Posts({ postType, username, userId }) {
  const [page, setPage] = useState(1);

  const getPostEndPoint = () => {
    switch (postType) {
      case "Tweets":
        return `/api/post/ownposts/${username}`;

      case "Home":
        return `/api/post/homeposts`;

      case "Retweets":
        return `/api/post/retweetedposts/${userId}`;

      case "Likes":
        return `/api/post/likedposts/${userId}`;

      case "Following":
        return `/api/post/followingposts`;

      default:
        return `/api/post/homeposts`;
    }
  };

  const POST_ENDPOINT = getPostEndPoint();

  const {
    data,
    isLoading,
    isRefetching,
    isFetching,
  } = useQuery({
    queryKey: ["posts", postType, username, userId, page],

    queryFn: async () => {
      const url =
        postType === "Home"
          ? `${POST_ENDPOINT}?page=${page}&limit=10`
          : POST_ENDPOINT;

      const res = await fetch(url, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Couldn't get posts");
      }

      return data;
    },

    keepPreviousData: true,
  });

  useEffect(() => {
    setPage(1);
  }, [postType, username, userId]);

  const postsToRender = () => {
    if (postType === "Home") {
      if (!data) return [];

      if (Array.isArray(data)) return data;

      return data.posts || [];
    }

    return Array.isArray(data) ? data : [];
  };

  const loadMore = () => {
    if (
      postType === "Home" &&
      data?.currentPage < data?.totalPages
    ) {
      setPage((prev) => prev + 1);
    }
  };

  const posts = postsToRender();

  return (
    <div className="posts space-y-4 px-2 md:px-0">
      {(isLoading || isRefetching || isFetching) &&
        page === 1 && (
          <div className="flex justify-center py-4">
            <TailSpin width="50" height="50" color="blue" />
          </div>
        )}

      {!isLoading && posts.length === 0 && (
        <p className="noposts">No posts in this tab</p>
      )}

      {posts.map((post) => (
        <Post key={post._id} post={post} />
      ))}

      {postType === "Home" &&
        data?.currentPage < data?.totalPages && (
          <div className="flex justify-center mt-4 mb-6">
            <button
              onClick={loadMore}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-full text-white text-sm"
            >
              Load More
            </button>
          </div>
        )}
    </div>
  );
}

export default Posts;