"use client";
import { CompanyMember } from "@/Types/companyMember.types";
import { useState, useEffect } from "react";

interface Props {
    data: any[];
    selectedData?: any;
    onChange: (cm: any) => void;
}

const CustomDropdown = ({
    data,
    selectedData,
    onChange,
}: Props) => {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<any | null>(null);

    // Sync selected value
    useEffect(() => {
        if (selectedData) {
            setSelected(selectedData);
        } else if (data.length > 0) {
            setSelected(data[0]);
        }
    }, [selectedData, data]);

    const handleSelect = (cm: CompanyMember) => {
        setSelected(cm);
        onChange(cm);
        setOpen(false);
    };

    return (
        <div className="relative w-56">
            {/* Selected */}
            <div
                onClick={() => setOpen(!open)}
                className=" text-white p-2 rounded cursor-pointer flex justify-between items-center"
            >
                <div className="flex justify-center items-center space-x-3">
                    <div className="flex items-center gap-2">
                        {selected?.company?.logo ? (
                            <img
                                src={selected?.company.logo}
                                className="w-6 h-6 rounded"
                            />
                        ) : (
                            <div className="w-6 h-6 bg-blue-800 rounded-full" />
                        )}
                    </div>
                    <span className="truncate">
                        {selected?.company?.name || "Select Company"}
                    </span>
                </div>
                <span className="text-xs bg-white text-black px-2 rounded">
                    {selected?.role}
                </span>
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute w-full bg-blue-800 mt-1 rounded shadow-lg z-50 max-h-60 overflow-auto">
                    {data.map((cm) => (
                        <div
                            key={cm.id}
                            onClick={() => handleSelect(cm)}
                            className="p-2 hover:bg-blue-600 cursor-pointer flex justify-between items-center"
                        >
                            <div className="flex items-center gap-3">
                                {cm.company?.logo ? (
                                    <img
                                        src={cm.company.logo}
                                        className="w-6 h-6 rounded"
                                    />
                                ) : (
                                    <div className="w-6 h-6 bg-blue-300 rounded-full" />
                                )}
                                <span>{cm.company?.name}</span>
                            </div>

                            <span className="text-xs bg-white text-black px-2 rounded">
                                {cm.role}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;