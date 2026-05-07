'use client';

import { usePathname } from 'next/navigation';

export default function HeaderTitle() {
  const pathname = usePathname();

  const getTitle = () => {
    if (pathname === '/') return 'Unified Results Dashboard';
    if (pathname === '/students') return 'Student Records';
    if (pathname === '/upload') return 'Upload Results';
    if (pathname === '/report-cards') return 'Report Card Generator';
    if (pathname === '/analysis/subject') return 'Subject-wise Analytics';
    if (pathname === '/analysis/class') return 'Class-wise Analytics';
    if (pathname === '/analysis/section') return 'Section-wise Analytics';
    return 'SSC Results Analytics';
  };

  return (
    <div className="flex items-center flex-1">
      <h2 className="text-lg font-bold text-on-surface">{getTitle()}</h2>
    </div>
  );
}
