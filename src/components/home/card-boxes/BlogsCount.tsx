import { GET_BLOG_COUNT } from "@/graphql/query/blog.query";
import { useQuery } from "@apollo/client/react";
import React from "react";
import { TbBrandBlogger } from "react-icons/tb";

const BlogsCount = () => {
  const { data, loading } = useQuery(GET_BLOG_COUNT);
  console.log({ pData: data?.getBlogCount });
  return (
    <div className="ring-1 ring-gray-300/80 bg-white rounded-md p-4 space-y-2">
      <div className="flex justify-between items-center text-sm">
        <div>Blogs</div>
        <TbBrandBlogger className="size-4" />
      </div>
      <div className="text-xl">{loading? <div className="text-sm">updating...</div>:data?.getBlogCount?.blogCount}</div>
      <div className="flex text-xs justify-start items-baseline-last">
        <div className="text-green-700 pr-1 text-sm">
          {loading? '-':data?.getBlogCount?.lastMonthBlog}
        </div>
        <div className="text-gray-500">Blogs added last month</div>
      </div>
    </div>
  );
};

export default BlogsCount;
