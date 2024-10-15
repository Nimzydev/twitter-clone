import React from "react";
import "./Createpost.css";

function Createpost () {
    return(
        <div className="createpost">
            <form className="form">
                <div className="post-input">
            <img src="avatar.jpg" alt="avatar placeholder pic" />
            <input type="text" placeholder="What's happening?" />
            </div>
            <button className="btn">POST</button>
            </form>

        </div>
    )
}

export default Createpost;