import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import toast from "react-hot-toast";


export const useFollow = () =>{ 

    const followClient = useQueryClient();

    const {mutate:follow,isPending:isFollowing} = useMutation({
        mutationFn: async (userId) =>{
            const res = await fetch(`/api/user/followunfollow/${userId}`,{
                method: "POST"
            })
            const data = await res.json();
            if(!res.ok){
                throw new Error(data.error)
            }

            return data;
        },
        onSuccess:()=>{
            toast.success("User followed successfully!")
            Promise.all([
                followClient.invalidateQueries({queryKey:["suggestedUsers"]}),
                followClient.invalidateQueries({queryKey:["authUser"]}),
                followClient.invalidateQueries({queryKey:["user"]}),
                followClient.invalidateQueries({queryKey:["chatUsers"]}),
            ])
           
        },
        onError: (error) =>{
            toast.error(error.message)
        }
    })

    console.log(follow)

    return{follow,isFollowing}
    
}