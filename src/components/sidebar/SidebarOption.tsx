'use client'
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { IconType } from "react-icons";
import { motion, AnimatePresence } from "framer-motion";
import { PiArrowBendDownRightDuotone } from "react-icons/pi";

interface Props {
  icon: IconType;
  arrowIcon?: IconType;
  link?: string;
  name: string;
  exactMatch?: boolean;
  sidebarOpen?: boolean;
  subItems?: Props[];
  isSubItem?: boolean;
}

const SidebarOption: React.FC<Props> = ({
  icon: Icon,
  arrowIcon: Arrow,
  link,
  name,
  exactMatch = false,
  sidebarOpen = true,
  subItems,
  isSubItem = false
}) => {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if current item is active
  const isActive = exactMatch
    ? pathname === link
    : link && pathname.startsWith(link);

  // Check if any subitem is active
  const hasActiveSubItem = subItems?.some(subItem =>
    exactMatch
      ? pathname === subItem.link
      : subItem.link && pathname.startsWith(subItem.link)
  );

  const hasSubItems = subItems && subItems.length > 0;

  const handleClick = (e: React.MouseEvent) => {
    if (hasSubItems) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
  };

  // Auto-expand if a subitem is active
  React.useEffect(() => {
    if (hasActiveSubItem) {
      setIsExpanded(true);
    }
  }, [hasActiveSubItem]);

  return (
    <div className={` w-full`}>
      <Link
        href={link || '#'}
        onClick={handleClick}
        className={`${isSubItem ? 'pl-4' : ''} flex items-center space-y-1 gap-2 py-2 rounded-md px-3 hover:bg-black/5  ${(isActive || hasActiveSubItem) ? "bg-black/10" : ""} ${hasSubItems ? 'cursor-pointer' : ''}`}
        aria-current={isActive ? "page" : undefined}
      >
        {/* {
          isSubItem && isActive && (
            <PiArrowBendDownRightDuotone size={18} />
          )
        } */}
        {!isSubItem && (
          <Icon
            className={`size-4.5 min-w-5 ${(isActive || hasActiveSubItem) ? "text-black" : "text-black/80"}`}
            aria-hidden="true"
          />
        )}

        <span className={`${sidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200 truncate flex-1 ${(isActive || hasActiveSubItem) ? "text-black" : "text-black/80"
          }`}>
          {name}
        </span>
        {hasSubItems && sidebarOpen && (
          <motion.span
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className={`${(isActive || hasActiveSubItem) ? "text-black" : "text-black/80"}`}
          >
            {Arrow && <Arrow className="size-4" aria-hidden="true" />}
          </motion.span>
        )}
      </Link>

      {hasSubItems && sidebarOpen && (
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden "
            >
              
              <div className=" py-1 flex flex-col space-y-1">
                {subItems.map((subItem) => (
                  <SidebarOption
                    key={subItem.name}
                    {...subItem}
                    arrowIcon={Arrow}
                    sidebarOpen={sidebarOpen}
                    isSubItem={true}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default SidebarOption;