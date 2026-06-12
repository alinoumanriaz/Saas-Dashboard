import React from "react";

interface IProps {
  children: React.ReactNode;
  className?: string;
}

const Container = ({ children, className }: IProps) => {
  return (
    <section className={`${className} h-full w-full flex justify-center items-start relative`}>
      <div className="w-full h-full flex justify-center items-center">{children}</div>
    </section>
  );
};

export default Container;
