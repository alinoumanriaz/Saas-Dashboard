'use client'
import { CompanyMember } from "@/Types/companyMember.types";
import { useEffect, useState } from "react";
import { setCompanyMember } from "@/redux/slicers/currentCompanyMember";
import { useAppSelector } from "@/redux/hooks";
import { useDispatch } from "react-redux";
import { FiCheck } from "react-icons/fi";
import { LuPlus } from "react-icons/lu";


interface Props {
  data: CompanyMember[];
}

const MemberDropdown = ({
  data,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CompanyMember | null>(null);
  const dispatch = useDispatch();
  const selectedCompanyMember = useAppSelector((state) => state.currentCompanyMember.companyMember);

  // Sync selected value
  useEffect(() => {
    if (selectedCompanyMember) {
      setSelected(selectedCompanyMember);
    } else if (data.length > 0) {
      setSelected(data[0]);
    }
  }, [selectedCompanyMember, data]);

  const handleSelect = (cm: CompanyMember) => {
    setSelected(cm);
    dispatch(setCompanyMember(cm));
    setOpen(false);
  };

  return (
    <div className="relative w-full group select-none">
      {/* Selected */}
      <div
        onClick={() => setOpen(!open)}
        className="text-black w-full px-2 py-1.5 rounded cursor-pointer flex justify-between items-center  transition-colors duration-200"
      >
        <div className="flex justify-center items-center space-x-2">
          <div className="flex items-center gap-2 ">
            {selected?.company?.logo ? (
              <img
                src={selected?.company.logo}
                className="w-4 h-4 rounded"
                alt={selected?.company?.name}
              />
            ) : (
              <div className="w-6 h-6 bg-black rounded-full" />
            )}
          </div>
          <span className="truncate text-sm line-clamp-1 max-w-30 ">
            {selected?.company?.name || "Select Company"}
          </span>
        </div>

        <span className="text-xs text-black px-2 pt-0.5 rounded-md bg-black/10 transition-colors duration-200">
          {selected?.role}
        </span>

        {/* SVG Container with peer and group hover effects */}
        <div className="py-1 rounded-md  text-black/60 group-hover:bg-black/20 group-hover:text-black transition-all duration-200">
          <svg
            data-testid="geist-icon"
            height="18"
            strokeLinejoin="round"
            viewBox="0 0 16 16"
            width="18"
            className="peer"
            style={{
              color: 'currentcolor',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }}
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8.7071 2.39644C8.31658 2.00592 7.68341 2.00592 7.29289 2.39644L4.46966 5.21966L3.93933 5.74999L4.99999 6.81065L5.53032 6.28032L7.99999 3.81065L10.4697 6.28032L11 6.81065L12.0607 5.74999L11.5303 5.21966L8.7071 2.39644ZM5.53032 9.71966L4.99999 9.18933L3.93933 10.25L4.46966 10.7803L7.29289 13.6035C7.68341 13.9941 8.31658 13.9941 8.7071 13.6035L11.5303 10.7803L12.0607 10.25L11 9.18933L10.4697 9.71966L7.99999 12.1893L5.53032 9.71966Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div onMouseLeave={() => setOpen(false)} className="fixed bottom-12 left-1 w-96 ring-1 rounded-xl ring-black/10 bg-white mt-1 shadow-sm z-50 max-h-60 overflow-auto">
          <div className="p-3">
            {data.map((cm) => (
              <div
                key={cm.id}
                onClick={() => handleSelect(cm)}
                className="p-2 rounded-md hover:bg-black/10 text-black cursor-pointer flex justify-between items-center transition-colors duration-200"
              >
                <div className="flex space-x-2 justify-center items-center">
                  <div className="flex items-center gap-3">
                    {cm.company?.logo ? (
                      <img
                        src={cm.company.logo}
                        className="w-6 h-6 rounded"
                        alt={cm.company?.name}
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {cm?.company?.name?.charAt(0)?.toUpperCase() || "C"}
                        </span>
                      </div>
                    )}
                    <span className="line-clamp-1 max-w-56">{cm.company?.name}</span>
                  </div>

                  <span className="text-xs text-black px-1.5 pt-0.5 rounded-md bg-black/30 transition-colors duration-200">
                    {cm.role}
                  </span>
                </div>
                <div>
                  <FiCheck size={20} />
                </div>
              </div>
            ))}
          </div>
          <div className="w-full hover:bg-black/10 text-black border-t border-black/20 py-4">
            <div className="flex justify-start items-center">
              <LuPlus size={20} className="mx-5" />
              <div className="text-start">
                <div className="text-sm">Create Company</div>
                <div className="text-black/60 text-xs">Collaborating with other in a shared workspace</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberDropdown;