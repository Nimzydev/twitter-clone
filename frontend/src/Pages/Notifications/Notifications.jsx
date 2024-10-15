import React from "react";
import "./Notifications.css";
import { IoSettingsOutline } from "react-icons/io5";
import Ncontainer from "./Ncontainer";


function Notifications () {
    return(
        <div className="notifications">
            <div className="notif-header">
                <h1>Notifications</h1>
                <IoSettingsOutline className="setting-icon" />
                 </div>
                 <Ncontainer/>


        </div>
    )
}

export default Notifications;