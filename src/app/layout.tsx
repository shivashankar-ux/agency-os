import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agency OS | The Story Builder",
  description: "Internal client, team, and finance management for The Story Builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              const theme = localStorage.getItem('theme');
              if (theme === 'light') {
                document.documentElement.classList.add('light-mode');
              } else {
                document.documentElement.classList.remove('light-mode');
              }
            } catch (e) {}
          })();
        `}} />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
