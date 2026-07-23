"use client";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/redux/hooks";
import { WebsiteSwitcher } from "../website-switcher";
import { ModeToggle } from "../mode-toggle";

const AdminHeader = () => {
  const pathName = usePathname();
  const { companyMember, loading } = useAppSelector((state) => state.currentCompanyMember);
  const websitesOfSelectedCompanyOfCurrentMember = companyMember?.websites || [];
  console.log({ websitesOfSelectedCompanyOfCurrentMember: websitesOfSelectedCompanyOfCurrentMember })


  if (pathName.startsWith("/auth")) return null;

  return (
    <div className="sticky top-0 z-50 w-full flex justify-between items-center text-sm py-2 pr-4 px-2">
      <div className="flex justify-center items-center space-x-3">
        {!loading && (
          <WebsiteSwitcher websites={websitesOfSelectedCompanyOfCurrentMember} />
        )}
      </div>

      <div className="relative">
        <div className="flex justify-center items-center space-x-3">
          <div className="pl-2 hidden md:flex flex-col text-black">
          </div>
          <ModeToggle />
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;