export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex-1 overflow-y-auto px-4 md:px-8">
      {children}
    </main>
  );
}
