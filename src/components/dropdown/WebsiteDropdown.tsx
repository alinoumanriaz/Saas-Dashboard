import { client } from "@/helpers/apollo-client";
import { useAppSelector } from "@/redux/hooks";
import { setCompanyCurrentWebsite } from "@/redux/slicers/companyCurrentWebsite";
import { useState, useEffect } from "react";
import { FiCheck } from "react-icons/fi";
import { LuPlus } from "react-icons/lu";
import { useDispatch } from "react-redux";

interface Props {
    data: any[];
}

const WebsiteDropdown = ({
    data,
}: Props) => {
    const [open, setOpen] = useState<boolean>(false);
    const [selected, setSelected] = useState<any | null>(null);
    const dispatch = useDispatch();
    const selectedWebsite = useAppSelector((state) => state.companyCurrentWebsite.companyWebsite);

    // Sync selected value from Redux or localStorage on mount
    useEffect(() => {
        // Priority: Redux > localStorage > first item
        if (selectedWebsite) {
            setSelected(selectedWebsite);
        } else {
            const savedWebsiteId = localStorage.getItem('websiteId');
            if (savedWebsiteId && data.length > 0) {
                const savedWebsite = data.find(w => w.id === savedWebsiteId);
                if (savedWebsite) {
                    setSelected(savedWebsite);
                    dispatch(setCompanyCurrentWebsite(savedWebsite));
                } else {
                    setSelected(data[0]);
                    dispatch(setCompanyCurrentWebsite(data[0]));
                }
            } else if (data.length > 0) {
                setSelected(data[0]);
                dispatch(setCompanyCurrentWebsite(data[0]));
            }
        }
    }, [selectedWebsite, data, dispatch]);

    const handleSelect = (website: any) => {
        setSelected(website);
        localStorage.setItem('websiteId', website.id);
        dispatch(setCompanyCurrentWebsite(website));
        
        // Reset Apollo cache to refetch data for new website
        client.resetStore();
        setOpen(false);
    };

    if (data.length === 0) return null;

    return (
        <div className="relative w-full group select-none">
            {/* Selected */}
            <div
                onClick={() => setOpen(!open)}
                className="text-black w-full px-2 py-1.5 rounded cursor-pointer flex justify-between items-center transition-colors duration-200"
            >
                <div className="flex justify-center items-center space-x-2">
                    <div className="flex items-center gap-2">
                        {selected?.logo ? (
                            <img
                                src={selected?.logo}
                                className="w-4 h-4 rounded"
                                alt={selected?.name}
                            />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                                <span className="text-white text-xs font-medium">
                                    {selected?.name?.charAt(0)?.toUpperCase() || "W"}
                                </span>
                            </div>
                        )}
                    </div>
                    <span className="truncate text-sm line-clamp-1 w-36">
                        {selected?.name || "Select Website"}
                    </span>
                </div>
                <div className="py-1 rounded-md text-black/60 group-hover:bg-black/20 group-hover:text-black transition-all duration-200">
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
                <div onMouseLeave={() => setOpen(false)} className="fixed w-96 ring-1 rounded-xl ring-white/30 bg-white mt-1 shadow-sm z-50 max-h-60 overflow-auto">
                    <div className="p-3">
                        {data.map((website) => {
                            // Handle both flat and nested structures
                            const websiteData = website.companyWebsite || website;
                            return (
                                <div
                                    key={websiteData.id}
                                    onClick={() => handleSelect(websiteData)}
                                    className="p-2 rounded-md hover:bg-black/10 text-black cursor-pointer flex justify-between items-center transition-colors duration-200"
                                >
                                    <div className="flex space-x-2 justify-center items-center">
                                        <div className="flex items-center gap-3">
                                            {websiteData.logo ? (
                                                <img
                                                    src={websiteData.logo}
                                                    className="w-6 h-6 rounded"
                                                    alt={websiteData.name}
                                                />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <span className="text-black text-xs font-medium">
                                                        {websiteData.name?.charAt(0)?.toUpperCase() || "W"}
                                                    </span>
                                                </div>
                                            )}
                                            <span className="line-clamp-1 max-w-56">{websiteData.name}</span>
                                        </div>
                                    </div>
                                    {selected?.id === websiteData.id && (
                                        <div>
                                            <FiCheck size={20} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="w-full hover:bg-black/10 text-black border-t border-black/10 py-4 cursor-pointer">
                        <div className="flex justify-start items-center">
                            <LuPlus size={20} className="mx-5" />
                            <div className="text-start">
                                <div className="text-sm">Add Website</div>
                                <div className="text-black/60 text-xs">Add new website for your company.</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WebsiteDropdown;