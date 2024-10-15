import React from "react";
import "./Post.css"; 
import { FaComment } from "react-icons/fa";
import { FaRetweet } from "react-icons/fa6";
import { FaRegHeart } from "react-icons/fa";



function Post () {
    return(
        <div className="post">
            <div className="post-header">
                <img src="avatar.jpg" alt="avatar placeholder" />
                <span className="name-style">Nimz ele</span>
                <span className="email-style">@nimz@email.com</span>
                <div className="post-body">
                    <p>Hey everyone what's up??</p>
                    <img src="christian.gif" alt="post pic" />
                    <div className="post-footer">
                    <FaComment className="post-icons" />
                    <FaRetweet className="post-icons" />
                    <FaRegHeart className="post-icons" />
                    </div>

                </div>


            </div>

        </div>
    )
}

export default Post;