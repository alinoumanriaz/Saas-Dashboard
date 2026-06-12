'use client'
import useLogout from "@/helpers/LogoutHandler";
import React, { useState } from "react";
import { TbLogout } from "react-icons/tb";

const LogoutButton = () => {
  const { handleLogout } = useLogout();
  const [loading, setLoading] = useState(false)
  const handleout = () =>{
    setLoading(true)
    handleLogout()
  }
  return (
    <div
      onClick={handleout}
      className="w-full cursor-pointer text-sm ring-1 ring-gray-300 bg-gray-100 hover:bg-blue-500/20 rounded-md p-2 flex justify-start items-center"
    >
      <TbLogout className="size-5 " />
      <div className="pl-2">{loading ? "Logging out..." : "Logout"}</div>
    </div>
  );
};

export default LogoutButton;
