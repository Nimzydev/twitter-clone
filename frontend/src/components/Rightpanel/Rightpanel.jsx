import React from "react";
import "./Rightpanel.css";
import { FaSearch } from "react-icons/fa";
import Suggested from "../Suggested/Suggested";

function Rightpanel () {
    return(
        <div className="rightpanel">
            <div className="search-input">
                <input type="text" />
                <FaSearch className="panel-search" />
                </div>
                <Suggested/>

                

        </div>
    )
}

export default Rightpanel;