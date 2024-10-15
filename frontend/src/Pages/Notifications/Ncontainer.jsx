import React from "react";
import "./Ncontainer.css";
import { FaHeart } from "react-icons/fa";

function Ncontainer () {
    return(
        <div className="ncontainer">
            <FaHeart className="notif-icon" />
            <div className="notif-description">
                <img src="avatar.jpg" alt="" />
                <span className="notif-message">@janedoe liked your post</span>

            </div>
            

        </div>
    )
}

export default Ncontainer;