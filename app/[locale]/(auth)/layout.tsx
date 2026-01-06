export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-quest-purple/10 to-star-gold/10">
      <div className="w-full max-w-md px-4">{children}</div>
    </div>
  );
}
