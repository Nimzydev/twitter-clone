import React from "react";
import "./Text.css";   
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useGetConversation from "../../../zustand/useGetConversations.js"; 

function Text ({message}) {

    const queryClient = useQueryClient();
    const authUser = queryClient.getQueryData(["authUser"]);
    const {selectedConversation} = useGetConversation(); 

    const fromMe = message.sender === authUser._id;
    const profilePic = fromMe ? authUser.profilePic : selectedConversation?.profilePic;

    // ✅ DELETE MESSAGE FUNCTION
    const handleDeleteMessage = async () => {
        try {
            await fetch(`/api/message/deletemessage/${message._id}`, {
                method: "DELETE",
                credentials: "include"
            });

            queryClient.invalidateQueries({ queryKey: ["messages"] });

        } catch (error) {
            console.error(error);
        }
    };

    return(
        <div className="text">
            <div className={`message-wrapper ${fromMe ? "own" : ""}`}>
                
                {fromMe && (
                    <button 
                        className="delete-btn"
                        onClick={handleDeleteMessage}
                    >
                        🗑
                    </button>
                )}

                {fromMe ? (
                    <p className="flex-end">{message.text}</p>
                ) : (
                    <p className="flex-start">{message.text}</p>
                )}

            </div>

            <img 
                className="message-img" 
                src={profilePic || "/avatar.jpg"} 
                alt="profile" 
            />
        </div>
    )
}

export default Text;