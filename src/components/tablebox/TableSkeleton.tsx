import React from "react";

const TableSkeleton = () => {
  return (
    <>
      <div className="w-full">
        <table className="w-full table-auto">
          <thead className="rounded-xl bg-gray-200 ">
            <tr className="py-2 px-4 m-2 w-full">
              {[...Array(8)].map((_, idx) => (
                <th
                  key={idx}
                  className=" h-8 m-2 "
                >
                  <div className=" rounded-md animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(4)].map((_, idx) => (
              <tr key={idx}>
                {[...Array(8)].map((_, idx) => (
                  <td
                    key={idx}
                    className="py-2 px-4 m-2  "
                  >
                    <div className="h-6 bg-gray-300 rounded animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default TableSkeleton;
