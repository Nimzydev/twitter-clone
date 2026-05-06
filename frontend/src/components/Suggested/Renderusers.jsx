import React from "react";
import "./Renderusers.css";
import { Link } from "react-router-dom";  
import { useQuery } from "@tanstack/react-query";
import {useFollow} from "../../hooks/useFollow";
import { TailSpin } from "react-loader-spinner";

function Renderusers ({user}) {


    const{follow,isFollowing} = useFollow();

    return(
        <div className="suggested">
            <Link to={`/profile/${user.username}`}>
            <img className="suggest-img"src={user.profilePic || "/avatar.jpg"} alt="suggested user profile picture" />
            </Link>
            <div className="user-details">
                <Link to={`/profile/${user.username}`}>
                <p className="s-name">{user.fullName}</p>
                <span className="user-email">@{user.username}</span>
                </Link>
                </div>
                <button onClick={() => follow(user._id)} className="suggested-btn">
                    {isFollowing? <TailSpin visible={true} width="50" height="40" color="gold"/>:"Follow"}
                </button>

        </div>
    )
}

export default Renderusers;
