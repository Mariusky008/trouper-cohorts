export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container max-w-3xl mx-auto py-12 px-4 space-y-8">
      {children}
    </div>
  );
}
