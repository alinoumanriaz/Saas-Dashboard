'use client'
import React, { useEffect, useState } from "react";
import { TbUsers } from "react-icons/tb";
import { io } from 'socket.io-client';

const ActiveVisitor = () => {
  const [visitorCount, setVisitorCount] = useState(0);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL!, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("✅ Dashboard connected:", socket.id);
    });

    socket.on("visitorCount", (count: number) => {
      setVisitorCount(count);
    });

    return () => {
      socket.disconnect();
    };
  }, []);
  return (
    <div className="bg-gradient-to-r from-blue-400 via-blue-600 to-blue-800 text-white ring-1 ring-gray-300/80 rounded-md p-4 space-y-2">
      <div className="flex justify-between items-center text-sm">
        <div>Active Customers</div>
        <TbUsers className="size-4" />
      </div>
      <div className="text-xl">{visitorCount}</div>
      <div className="flex text-xs">
        <div>Realtime visitor</div>
      </div>
    </div>
  );
};

export default ActiveVisitor;
