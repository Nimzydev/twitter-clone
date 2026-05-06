import React, { useEffect } from "react";
import "./Posts.css";
import Post from "./Post";
import { TailSpin } from "react-loader-spinner";
import { useQuery } from "@tanstack/react-query"; 

function Posts ({postType,username,userId}) {  

    const getPostEndPoint = () => {
        switch (postType) {
            case "Tweets":
                return `/api/post/ownposts/${username}`;
            case "Home":
                return `/api/post/homeposts`;
            case "Retweets":
                return "/api/post/retweetedposts";
            case "Likes":
                return `/api/post/likedposts/${userId}`;
            case "Following":
                return "/api/post/followingposts";
            default:
                return "/api/post/homeposts";
        }
    };

    const POST_ENDPOINT = getPostEndPoint();

    const {data:posts, isLoading, isRefetching, refetch} = useQuery({
        queryKey: ["posts", postType, username, userId], // ✅ FIXED
        queryFn: async() => {
            const res = await fetch(POST_ENDPOINT);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Couldn't get posts");

            return data;
        },
    });

    useEffect(()=> {
        refetch();
    }, [postType, username, userId, refetch]); // ✅ also safer

    return(
        <div className=" posts space-y-4 px-2 md:px-0">
            {(isLoading||isRefetching) && (
                <TailSpin visible={true} width="80" height="80" color="blue" />
            )}

            {!isLoading && !isRefetching && posts?.length===0 && (
                <p className="noposts">No posts in this tab</p>
            )}

            {!isLoading && !isRefetching && posts && (
                <div>
                    {posts.map((post) => (
                        <Post key={post._id} post={post} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default Posts;