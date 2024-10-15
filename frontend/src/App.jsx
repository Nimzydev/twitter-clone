import React from "react";
import Sidebar from "./components/Sidebar/Sidebar";
import { Route, Routes } from "react-router-dom";
import Home from "./Pages/Home/Home";
import Rightpanel from "./components/Rightpanel/Rightpanel";
import Profile from "./Pages/Profile/Profile";
import Notifications from "./Pages/Notifications/Notifications";
import Messages from "./Pages/Messages/Messages";




function App() {
  

  return (
    <>
      <div className='app'>
        <Sidebar/>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="profile" element={<Profile/>} />
          <Route path="notifications" element={<Notifications/>} />
          <Route path="messages" element={<Messages/>} />
        </Routes>
        <Rightpanel/>
      </div>
        
    </>
  )
}

export default App
