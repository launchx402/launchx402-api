import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LaunchX402 - Launch Pump.fun Tokens",
  description: "Launch Pump.fun tokens instantly with crypto payments via x402 protocol",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

