import { Box } from 'lucide-react'
import React from 'react'

interface CardWithTitleAndIconProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    icon?: React.ReactNode;
}

const CardWithTitleAndIcon = ({ children, title, description, icon }: CardWithTitleAndIconProps) => {
    return (
        <div className="flex-col mb-4" >
            <div className="flex items-center gap-2 pb-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-[#1a3260]">
                    {icon || <Box size={17} />}
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                        {title || "Basic Information"}
                    </h3>
                    <p className="text-xs text-gray-500">
                        {description || "Essential details about your product."}
                    </p>
                </div>
            </div>
            {children}
        </div>
    )
}

export default CardWithTitleAndIcon
