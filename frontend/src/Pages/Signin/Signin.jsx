import React, {useState} from "react";
//import "./Signin.css";
import {useMutation, useQueryClient} from "@tanstack/react-query"
import toast from "react-hot-toast";
import { TailSpin } from "react-loader-spinner"; 
import { useNavigate } from "react-router-dom";



function Signin () {

    const [formData, setFormData] = useState({
        username: "",
        password: "",
    })

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value})
    }

    const navigate = useNavigate()

    const handleClick = (e) => {
        navigate('/signup')
    }

    const queryClient = useQueryClient()


    const {mutate, isPending, isError, error} = useMutation({
        mutationFn: async ({username, password}) => {
            try {
                const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers:{
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({username, password}),
                });

                const data = await res.json()

                if (!res.ok) throw new Error(data.error);
                
                if (data.error) throw new Error(data.error)
                console.log(data)

                return data;
                
            } catch (error) {
                console.error(error) 
                toast.error(error.message)
                throw error;
            }

        },
        onSuccess: () => {
            toast.success("Logged in successfully") 
            queryClient.invalidateQueries({queryKey: ["authUser"]});
        },
    });
    
    
    
    const handleSubmit = (e) => {
        e.preventDefault();
        mutate(formData);
    }


    
    
    return (
  <div className="min-h-screen flex items-center justify-center bg-black text-white">
    <div className="w-full max-w-md p-6 rounded-lg shadow-lg bg-gray-900">
      
      <div className="flex justify-center mb-6">
        <img src="twitter.avif" alt="app logo" className="w-16" />
      </div>

      <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          onChange={handleChange}
          type="text"
          name="username"
          value={formData.username}
          placeholder="Username"
          className="p-3 rounded bg-gray-800 border border-gray-700 outline-none"
        />

        <input
          onChange={handleChange}
          type="password"
          name="password"
          value={formData.password}
          placeholder="Password"
          className="p-3 rounded bg-gray-800 border border-gray-700 outline-none"
        />

        <button className="bg-blue-500 hover:bg-blue-600 p-3 rounded font-semibold">
          {isPending ? <TailSpin width="20" height="20" /> : "Sign In"}
        </button>

        {isError && <p className="text-red-500 text-sm">{error.message}</p>}
      </form>

      <p className="text-center mt-4">Don't have an account?</p>

      <button
        onClick={handleClick}
        className="w-full mt-2 border border-gray-600 p-2 rounded hover:bg-gray-800"
      >
        Sign Up
      </button>
    </div>
  </div>
);
}

export default Signin;

