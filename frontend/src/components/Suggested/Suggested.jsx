import React from "react";
import "./Suggested.css";
import { Link } from "react-router-dom";  
import { useQuery } from "@tanstack/react-query";
import Renderusers from "./Renderusers";
import { TailSpin } from "react-loader-spinner";

function Suggested () { 

    const {data:suggestedUsers,isLoading} = useQuery({
        queryKey:["suggestedUsers"],
        queryFn: async () =>{
            try {
                const res = await fetch("/api/user/suggested");
                const data = await res.json();
                if(!res.ok){
                    throw new Error(data.error)
                }

                console.log(data)

                return data;
                
            } catch (error) {
                throw new Error(error.message)  
            }
        }
    })

   

    return(
        <div className="suggested">
        {isLoading && <TailSpin visible={true} width="50" height="40" color="gold"/>}
        {!isLoading && !suggestedUsers && <p className="no-suggestedusers">There are no users!</p>}
        {suggestedUsers?.length > 0 && suggestedUsers.map((user) => {
            return <Renderusers key={user._id} user={user}/>
        })}
        </div>
    )
}

export default Suggested;

