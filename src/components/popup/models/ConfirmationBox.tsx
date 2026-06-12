// import React from "react";
// import { FiAlertOctagon } from "react-icons/fi";
// import { RxCross2 } from "react-icons/rx";
// import Popup from "../Popup";

// interface Props {
//   onCancel: () => void;
//   onDelete: () => void;
//   loading?: boolean;
// }

// const ConfirmationBox = ({ onCancel, onDelete, loading = false }: Props) => {
//   return (
//     <Popup>
//       <div className="bg-white rounded-xl w-[40%] relative py-10 px-8 shadow-md">
//         <div onClick={onCancel} className="absolute right-4 top-4 bg-white">
//           <RxCross2 className="size-5" />
//         </div>
//         <div className="flex flex-col justify-center items-center text-center space-y-4">
//           <div className=" bg-red-100 rounded-full p-2">
//             <FiAlertOctagon className="text-red-500 size-6 " />
//           </div>
//           <div className="text-gray-400">
//             <div>Are you sure you want to delete it.</div>
//             <div>this action can not be undone</div>
//           </div>
//           <div className="flex justify-center items-center space-x-4 ">
//             <button
//               onClick={onCancel}
//               className="px-8 py-2 bg-blue-100 text-blue-600 rounded-md"
//             >
//               Cancel
//             </button>
//             <button
//               disabled={loading}
//               onClick={onDelete}
//               className="px-8 py-2 bg-red-100 text-red-600 rounded-md"
//             >
//               {loading ? "Deleting..." : "Delete"}
//             </button>
//           </div>
//         </div>
//       </div>
//     </Popup>
//   );
// };

// export default ConfirmationBox;

// src/components/popup/models/ConfirmationBox.tsx
"use client";
import React from "react";
import { BiTrash, BiX } from "react-icons/bi";
import Popup from "../Popup";
import { RxCross2 } from "react-icons/rx";
import { FiAlertOctagon } from "react-icons/fi";

interface ConfirmationBoxProps {
  onCancel: () => void;
  onDelete: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

const ConfirmationBox: React.FC<ConfirmationBoxProps> = ({
  onCancel,
  onDelete,
  title = "Delete Confirmation",
  message = "Are you sure you want to delete this item?",
  confirmText = "Delete",
  cancelText = "Cancel",
  loading = false,
}) => {
  return (
    <Popup>
      <div className="bg-white rounded-xl w-[40%] relative py-10 px-8 shadow-md">
         <div onClick={onCancel} className="absolute right-4 top-4 bg-white">
           <RxCross2 className="size-5" />
         </div>
         <div className="flex flex-col justify-center items-center text-center space-y-4">
           <div className=" bg-red-100 rounded-full p-2">
             <FiAlertOctagon className="text-red-500 size-6 " />
           </div>
           <div className="text-gray-400">
             <div>Are you sure you want to delete it.</div>
             <div>this action can not be undone</div>
           </div>
           <div className="flex justify-center items-center space-x-4 ">
             <button
               onClick={onCancel}
               className="px-8 py-2 bg-blue-100 text-blue-600 rounded-md"
             >
               Cancel
             </button>
             <button
               disabled={loading}
               onClick={onDelete}
               className="px-8 py-2 bg-red-100 text-red-600 rounded-md"
             >
               {loading ? "Deleting..." : "Delete"}
             </button>
           </div>
         </div>
       </div>
    </Popup>
  );
};

export default ConfirmationBox;
