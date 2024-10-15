import React, { useState } from "react";
import "./Sidebar.css"
import { IoHomeOutline } from "react-icons/io5";
import { IoIosNotificationsOutline } from "react-icons/io";
import { FaRegMessage } from "react-icons/fa6";
import { IoPersonOutline } from "react-icons/io5"; 
import {useNavigate} from "react-router-dom";





function Sidebar () {
    const navigate = useNavigate()
    
    return(
        <div className="sidebar">
            <img className="logo" src="twitter.avif" alt="twitter logo" />
            <div onClick={()=> navigate("/")} className="home-icon">
            <IoHomeOutline className="icons"/>
            <h1 className="font">Home</h1>
            </div>
            <div onClick={()=> navigate("notifications")} className="notifications-icon">
             <IoIosNotificationsOutline className="icons"/>
            <h1 className="font">Notifications</h1>
            </div>
            <div onClick={()=> navigate("messages")} className="messages-icon">
            <FaRegMessage className="icons"/>
            <h1 className="font">Messages</h1>
            </div>
            <div onClick={()=> navigate("profile")} className="profile-icon">
            <IoPersonOutline className="icons"/>
            <h1 className="font">Profile</h1>
            </div>
            </div>
            
                


    )
}

export default Sidebar;