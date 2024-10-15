import React from "react";
import "./Messagepanel.css";
import { FaSearch } from "react-icons/fa";
import Messageusers from "./Messageusers";

function Messagepanel () {
    return(
        <div className="messagepanel">
            <div className="search-container">
            <input type="text" placeholder="Search..." />
            <FaSearch className="searchmessage" />
            </div>
            <Messageusers/>



        </div>
    )
}

export default Messagepanel; 