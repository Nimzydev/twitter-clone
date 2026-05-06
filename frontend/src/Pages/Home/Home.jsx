import React from "react";
import "./Home.css";
import Createpost from "../../components/Createpost/Createpost";
import Posts from "../../components/Post/Posts";
import { useState } from "react";  

function Home () { 

    const [postType, setPostType] = useState("Home");  





    return(
         <div className="w-full border-x border-gray-700 min-h-screen">
            <div className="home-header">
                <p className={postType==="Home" ? "active" : ""} onClick={()=> setPostType("Home")}>For you</p>
                <p className={postType==="Following" ? "active" : ""} onClick={()=> setPostType("Following")}>Following</p>
                 </div>
                 <Createpost/> 
                 <Posts postType={postType}/>  
                 

                   



        </div>
    )
}

export default Home;