"use client";
import React from "react";
import Container from "../components/Container";
import MonthlySaleChart from '@/components/Charts/MonthlySaleChart';
import ActiveVisitor from "@/components/home/card-boxes/ActiveVisitor";
import OrderCount from "@/components/home/card-boxes/OrderCount";
import ProductCount from "@/components/home/card-boxes/ProductCount";
// import LastMonthVisitor from "@/components/home/card-boxes/LastMonthVisitor";
import BlogsCount from "@/components/home/card-boxes/BlogsCount";

export default function Home() {
  
  // const [activeModel, setActiveModel] = useState(false);
  // const [sendOrderItems, setSendOrderItems] = useState([]);
  // const [sendAddress, setSendAddress] = useState([]);
  // const [orderData, setOrderData] = useState([]);
  // const [loading, setLoading] = useState(true);

  // const getOrderList = async () => {
  //   const response = await api.get(`/api/order/getallorders`);
  //   console.log({ response: response.data.orders });
  //   setOrderData(response.data.orders);
  //   setLoading(false);
  // };
  // useEffect(() => {
  //   getOrderList();
  // }, []);
  
  return (
    // <Container>
    //   <div className="w-full h-[calc(100vh-85px)]  overflow-auto scrollbar-hide p-0.5 ">
    //     {/* Stats Cards Grid */}
    //     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full gap-3 pb-4">

    //       {/* Orders Card */}
    //       <OrderCount />

    //       {/* Products Card */}
    //       <ProductCount />

    //       {/* Total Blogs */}
    //       <BlogsCount />

    //       {/* Monthly Visitor Card */}
    //       {/* <LastMonthVisitor /> */}

    //       {/* Active Customers Card */}
    //       <ActiveVisitor />
    //     </div>

    //     {/* Main Content Grid */}
    //     <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
    //       {/* Recent Orders Chart - Takes 3 columns on large screens */}
    //       <MonthlySaleChart />

    //       {/* Top Products - Takes 2 columns on large screens */}
    //       <div className="lg:col-span-2 bg-white ring-1 ring-gray-300/80 rounded-md overflow-hidden">
    //         <div className="p-4 md:p-6 space-y-1">
    //           <div className="text-xl">Top Products</div>
    //           <div className="text-sm text-gray-600">Best performing products this month</div>
    //         </div>
            
    //         {/* <div className="max-h-96 overflow-y-auto ">
    //           {[...Array(6)].map((_, index) => (
    //             <div
    //               key={index}
    //               className="flex justify-between items-center p-4 border-b border-gray-100 last:border-b-0"
    //             >
    //               <div className="flex items-center">
    //                 <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center mr-3">
    //                   <span className="text-xs text-gray-500">Img</span>
    //                 </div>
    //                 <div>
    //                   <div className="text-sm font-medium">Summer Dress Collection</div>
    //                   <div className="text-xs text-gray-500">245 sales</div>
    //                 </div>
    //               </div>
    //               <div className="text-sm font-bold">$21,980</div>
    //             </div>
    //           ))}
    //         </div> */}
    //         <div className="w-full h-full py-6 flex justify-center text-gray-500">No Product found</div>
    //       </div>
    //     </div>

    //   </div>
    // </Container>
    <div>dashboard</div>
  );
}