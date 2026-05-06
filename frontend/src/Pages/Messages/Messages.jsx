import React from "react";
import "./Messages.css";
import Messagepanel from "./Messagepanel";
import Messagecontainer from "./Messagecontainer";
import { useQuery } from "@tanstack/react-query";
import { TailSpin } from "react-loader-spinner";

function Messages() {
    const { data: chatUsers, isLoading } = useQuery({
        queryKey: ["chatUsers"],
        queryFn: async () => {
            const res = await fetch("/api/user/followingusers");
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);
            return data;
        },
    });

    return (
        <div className="flex flex-col md:flex-row h-screen">

            {isLoading && (
                <TailSpin width={50} height={40} color="gold" />
            )}

            {!isLoading && chatUsers && (
                <>
                    <Messagepanel chatUsers={chatUsers} />
                    <Messagecontainer />
                </>
            )}
        </div>
    );
}

export default Messages;