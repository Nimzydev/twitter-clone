import React, {useState} from "react";
//import "./Signup.css";
import {useMutation} from "@tanstack/react-query"
import toast from "react-hot-toast";
import { TailSpin } from "react-loader-spinner"; 
import { useNavigate } from "react-router-dom";

function Signup () {

    const [formData, setFormData] = useState({
        fullName: "",
        username: "",
        email: "",
        password: "",
    })

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value})
    }

    const navigate = useNavigate()

    const handleClick = (e) => {
        navigate('/signin')
    }


    const {mutate, isPending, isError, error} = useMutation({
        mutationFn: async ({fullName, username, email, password}) => {
            try {
                const res = await fetch("/api/auth/signup", {
                    method: "POST",
                    headers:{
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({fullName, username, email, password}),
                });

                const data = await res.json();

                if (!res.ok) throw new Error(data.error);
                
                if (data.error) throw new Error(data.error);
                console.log(data);

                return data;
                
            } catch (error) {
                console.error(error); 
                toast.error(error.message);
                throw error;
            }

        },
        onSuccess: () => {
            toast.success("Account created successfully")
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

      <h1 className="text-2xl font-bold text-center mb-6">Sign Up</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          onChange={handleChange}
          type="text"
          name="fullName"
          value={formData.fullName}
          placeholder="Full Name"
          className="p-3 rounded bg-gray-800 border border-gray-700"
        />

        <input
          onChange={handleChange}
          type="text"
          name="username"
          value={formData.username}
          placeholder="Username"
          className="p-3 rounded bg-gray-800 border border-gray-700"
        />

        <input
          onChange={handleChange}
          type="email"
          name="email"
          value={formData.email}
          placeholder="Email"
          className="p-3 rounded bg-gray-800 border border-gray-700"
        />

        <input
          onChange={handleChange}
          type="password"
          name="password"
          value={formData.password}
          placeholder="Password"
          className="p-3 rounded bg-gray-800 border border-gray-700"
        />

        <button className="bg-green-500 hover:bg-green-600 p-3 rounded font-semibold">
          {isPending ? <TailSpin width="20" height="20" /> : "Sign Up"}
        </button>

        {isError && <p className="text-red-500 text-sm">{error.message}</p>}
      </form>

      <p className="text-center mt-4">Already have an account?</p>

      <button
        onClick={handleClick}
        className="w-full mt-2 border border-gray-600 p-2 rounded hover:bg-gray-800"
      >
        Sign In
      </button>
    </div>
  </div>
);
}

export default Signup;