import React from "react";
import "./Profile.css"; 
import { IoArrowBackOutline } from "react-icons/io5";
import Post from "../../components/Post/Post";
import { useNavigate } from "react-router-dom";

function Profile () {
    const navigate = useNavigate()
    return(
        <div className="profile">
            <div className="profile-header">
            <IoArrowBackOutline onClick={()=> navigate("/")} className="back-icon"/>
            <div className="user-info">
            <h1>Nimy Ele</h1>
            <span className="post-num">4 posts</span>
            </div>
            </div>
            <div className="bg-grey"></div>
            <div className="user-profile">
                <img src="avatar.jpg" alt="" />
                <button>Edit profile</button>
                </div>

                <div className="user-details">
                    <h1>Nimy Ele</h1>
                    <span className="user-email">@nimzele</span>
                    <p className="bio">I'm Nimy Ele</p>
                    <div className="user-followers">
                        <p>0 Following</p>
                        <p>0 Followers</p>
                        </div>

                            <ul className="options">
                                <li>Tweets</li>
                                <li>Retweets</li>
                                <li>Likes</li>
                            </ul>

                            <Post/>



                </div>

            

        </div>
    )
}

export default Profile;