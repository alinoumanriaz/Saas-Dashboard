// components/DynamicIcon.tsx
import React, { useState, useEffect } from 'react';
import { IconType } from 'react-icons';

interface DynamicIconProps {
  iconName: string;
  className?: string;
  size?: number;
}

const DynamicIcon: React.FC<DynamicIconProps> = ({ iconName, className = '', size = 24 }) => {
  const [IconComponent, setIconComponent] = useState<IconType | null>(null);

  useEffect(() => {
    const loadIcon = async () => {
      try {
        // Determine the icon library from the prefix (first 2 characters)
        const library = iconName.substring(0, 2).toLowerCase();
        
        // Dynamic import without assigning to 'module'
        const iconModule = await import(`react-icons/${library}/index.esm.js`);
        setIconComponent(iconModule[iconName]);
      } catch (error) {
        console.error(`Error loading icon ${iconName}:`, error);
        setIconComponent(null);
      }
    };

    loadIcon();
  }, [iconName]);

  if (!IconComponent) return <div className={className}>[Icon]</div>;

  return <IconComponent className={className} size={size} />;
};

export default DynamicIcon;