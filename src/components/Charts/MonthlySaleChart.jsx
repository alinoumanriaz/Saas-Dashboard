"use client";

import { ORDER_COUNT } from "@/graphql/query/order.query";
import { useQuery } from "@apollo/client/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function MonthlySaleChart() {
  const { data } = useQuery(ORDER_COUNT);
  const chartData = data?.getOrderCount?.monthlyCounts.map(
    ({ month, count }) => ({
      month, // e.g. "2024-09"
      orders: count,
    })
  );
  const last12Month = data?.getOrderCount?.totalInLast12Months;
  const recordMonth = data?.getOrderCount?.recordMonth;
  console.log({ chartData: chartData });
  return (
    <div className="lg:col-span-3 bg-white ring-1 ring-gray-300/80 rounded-md overflow-hidden">
      <div className="">
        <div className="p-4 md:p-6 space-y-1">
          <div className="text-xl">Recent Orders</div>
          <div className="text-sm text-gray-600">
            You have total {last12Month} orders in last 12 months.
          </div>
        </div>
        <div className="px-4 md:px-6"></div>
        <div style={{ width: "100%", height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${value}`} />
              <Tooltip formatter={(value) => `${value.toLocaleString()}`} />
              <Bar dataKey="orders" fill="#001d3d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 p-4 md:p-6 w-full">
        <div className="text-center sm:text-left p-3 sm:p-0">
          <div className="text-sm text-gray-600 pb-1">Total Order</div>
          <div className="text-lg font-semibold">{last12Month}</div>
        </div>
        <div className="text-center sm:text-left p-3 sm:p-0">
          <div className="text-sm text-gray-600 pb-1">Best Month Orders</div>
          <div className="text-lg font-semibold">{recordMonth?.count}</div>
        </div>
        <div className="text-center sm:text-left p-3 sm:p-0">
          <div className="text-sm text-gray-600 pb-1">Best Month</div>
          <div className="text-lg font-semibold text-green-700">
            {recordMonth?.month}
          </div>
        </div>
      </div>
    </div>
  );
}
