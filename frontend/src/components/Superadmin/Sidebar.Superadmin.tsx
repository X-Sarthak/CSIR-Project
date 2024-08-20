import { Link } from 'react-router-dom';

interface SidebarItem {
  label: string;
  link: string;
}

const items: SidebarItem[] = [
  {
    label: 'Dashboard',
    link: '',
  },
];

function SuperAdminSidebar(): JSX.Element {
  return (
    <div className='flex flex-col gap-2'>
      {items?.map((item: SidebarItem) => (
        <Link key={item.label} to={item.link} className='px-16 py-2 border border-black font-serif bg-sky-600 text-white'>
        {item.label}
        </Link>
      ))}
    </div>
  );
}

export default SuperAdminSidebar;
