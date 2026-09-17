import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tour de Rôle",
  description: "Prenez rendez-vous et suivez votre tour dans les centres de santé, sans attendre sur place.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="bg-background text-ink font-sans min-h-screen">{children}</body>
    </html>
  );
}
