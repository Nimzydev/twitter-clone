import React from "react";
import "./Home.css";
import Createpost from "../../components/Createpost/Createpost";
import Post from "../../components/Post/Post";

function Home () {
    return(
        <div className="home">
            <div className="home-header">
                <p>For you</p>
                <p>Following</p>
                 </div>
                 <Createpost/>
                 <Post/>


        </div>
    )
}

export default Home;