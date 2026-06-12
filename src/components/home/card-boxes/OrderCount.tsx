import { ORDER_COUNT } from "@/graphql/query/order.query";
import { useQuery } from "@apollo/client/react";
import React from "react";
import { HiMiniInbox } from "react-icons/hi2";

const OrderCount = () => {
  const { data, loading } = useQuery(ORDER_COUNT);
  const OrderCount = data?.getOrderCount;
  console.log({counts:data?.getOrderCount})
  
  return (
    <div className="ring-1 ring-gray-300/80 bg-white rounded-md p-4 space-y-2">
      <div className="flex justify-between items-center text-sm">
        <div>Orders</div>
        <HiMiniInbox className="size-4" />
      </div>
      <div className="text-xl">{loading? <div className="text-sm">updating...</div>:OrderCount?.todayOrderCount}</div>
      <div className="flex text-xs justify-start items-baseline-last">
        <div className="text-green-700 text-sm  ">{loading? '-':OrderCount?.last7DaysOrderCount}</div>
        <div className="text-gray-500 pl-1">Orders in Last 7 days</div>
      </div>
    </div>
  );
};

export default OrderCount;
