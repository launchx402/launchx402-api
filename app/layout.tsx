import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "x402 Test API",
  description: "A test API endpoint for demonstrating the x402 payment protocol on Solana",
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

