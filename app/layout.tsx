import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "WKORA NOTIFY",
  description: "Central de notificações web da WKORA.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "WKORA" }
};
export const viewport: Viewport = { themeColor: "#0b0b0b", width: "device-width", initialScale: 1 };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
