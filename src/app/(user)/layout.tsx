import React from 'react';

interface UserLayoutProps {
  children: React.ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col">
      {/* Jika Kania sudah membuat Navbar atau Sidebar global untuk user, 
          kamu bisa menaruh komponennya di sini. */}
      
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Jika ada Footer global, bisa ditaruh di bawah sini. */}
    </div>
  );
}