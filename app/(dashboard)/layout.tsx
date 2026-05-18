import { Sidebar } from '../components/Sidebar';
import { TopNav } from '../components/TopNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col w-full">
      <TopNav />
      <Sidebar />
      {children}
    </div>
  );
}
