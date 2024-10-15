import React from "react";
import "./Messages.css";
import Messagepanel from "./Messagepanel";
import Messagecontainer from "./Messagecontainer"; 



function Messages () {
    return(
        <div className="messages">
            <Messagepanel/>
            <Messagecontainer/>

        </div>
    )
}

export default Messages;