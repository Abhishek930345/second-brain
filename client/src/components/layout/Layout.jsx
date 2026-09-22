import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen" style={{ background: '#0A0A0F' }}>
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}