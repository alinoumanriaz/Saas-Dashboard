import React from "react";
interface IProps {
  color: string;
}
const LoaderSpin = ({ color }: IProps) => {
  return (
    <div
      className={` ${
        color ? color : "text-white"
      } animate-spin mx-auto size-5 border-[2px] border-current border-t-transparent  rounded-full`}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoaderSpin;
