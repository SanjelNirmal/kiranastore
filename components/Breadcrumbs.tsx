import React from 'react';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <div className="container mx-auto px-4 py-4 text-xs text-gray-500 flex items-center gap-1">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight size={12} />}
          <span 
            className={`${item.isActive ? 'text-gray-800 font-medium' : 'hover:text-brand-orange cursor-pointer transition-colors'}`}
            onClick={item.onClick}
          >
            {item.label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumbs;