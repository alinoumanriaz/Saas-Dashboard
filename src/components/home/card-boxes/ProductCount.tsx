import { GET_PRODUCT_COUNT } from "@/graphql/query/product.query";
import { useQuery } from "@apollo/client/react";
import React from "react";
import { BsBoxSeam } from "react-icons/bs";

const ProductCount = () => {
  const { data, loading } = useQuery(GET_PRODUCT_COUNT);
  console.log({ pData: data?.getProductCount });

  return (
    <div className="ring-1 ring-gray-300/80 bg-white rounded-md p-4 space-y-2">
      <div className="flex justify-between items-center text-sm">
        <div>Products</div>
        <BsBoxSeam className="size-4" />
      </div>
      <div className="text-xl">{loading? <div className="text-sm">updating...</div>:data?.getProductCount?.productCount}</div>
      <div className="flex text-xs justify-start items-baseline-last">
        <div className="text-green-700 pr-1 text-sm">
          {loading? '-':data?.getProductCount?.lastMonthProduct}
        </div>
        <div className="text-gray-500"> added last month</div>
      </div>
    </div>
  );
};

export default ProductCount;
