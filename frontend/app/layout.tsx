import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SANKET · AI — SIF Precursor Detection Engine",
  description: "AI/NLP Engine for SIF Precursor Detection in Oil India Safety Reports (SIH26165). See the Sanket (Signal) Before It Becomes the Incident.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
