import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google"; // Using generic Google font for now, will switch to Outfit if available or fallback
import "./globals.css";

const outfit = Inter({ subsets: ["latin"], variable: '--font-outfit' }); // Using Inter as base, naming it outfit for variable handling if needed

export const metadata: Metadata = {
    title: "VidFlow - Free Online Video Downloader (High Quality)",
    description:
        "Download YouTube videos and audio in 1080p, 4K, and MP3. Fast, free, and no installation required. Best tool for saving videos.",
    keywords: [
        "youtube downloader",
        "video saver",
        "mp3 converter",
        "4k video download",
        "online video downloader",
        "yt to mp3",
        "vidflow",
    ],
    openGraph: {
        title: "VidFlow - Fast Video Downloader",
        description: "Download videos and audio instantly. No ads, free forever.",
        type: "website",
        siteName: "VidFlow",
    },
    metadataBase: new URL('https://vidflow.vercel.app'),
    alternates: {
        canonical: '/',
    },
    authors: [{ name: "VidFlow Team" }],
    icons: {
        icon: '/favicon.ico',
        apple: '/favicon.ico',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={outfit.className}>{children}</body>
        </html>
    );
}
