import React from "react";
import { PiUsersThree } from "react-icons/pi";

const LastMonthVisitor = () => {
    
  return (
    <div className="ring-1 ring-gray-300/80 bg-white rounded-md p-4 space-y-2">
      <div className="flex justify-between items-center text-sm">
        <div>Last Monthly Visitor</div>
        <PiUsersThree className="size-5" />
      </div>
      <div className="text-xl">+573</div>
      <div className="flex text-xs">
        <div className="text-green-700 pr-1">+201</div>
        <div className="text-gray-500">from last month</div>
      </div>
    </div>
  );
};

export default LastMonthVisitor;
