import React from "react";
import "./Suggested.css";
import { Link } from "react-router-dom"; 

function Suggested () {

    const data ={
        id:1,
        name: "john doe",
        email: "john@email.com"
    }

   

    return(
        <div className="suggested">
            <Link>
            <img className="suggest-img"src="avatar.jpg" alt="" />
            </Link>
            <div className="user-details">
                <Link>
                <p>{data.name}</p>
                <span className="user-email">{data.email}</span>
                </Link>
                </div>
                <button className="suggested-btn">Follow</button>

        </div>
    )
}

export default Suggested;

