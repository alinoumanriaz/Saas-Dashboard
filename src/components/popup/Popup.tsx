import React from "react";
import { motion } from "framer-motion";

const Popup = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return (
    <div className="inset-0 fixed w-full flex justify-center items-center bg-black/20 h-screen backdrop-blur-sm z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full flex justify-center items-center h-full"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default Popup;
