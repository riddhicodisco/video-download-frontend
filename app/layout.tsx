import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google"; // Using generic Google font for now, will switch to Outfit if available or fallback
import "./globals.css";

const outfit = Inter({
    subsets: ["latin"],
    variable: '--font-outfit',
    display: 'swap', // Prevents render-blocking
});

export const metadata: Metadata = {
    title: "VidFlow - Best Free YouTube Video Downloader (1080p & 4K)",
    description:
        "VidFlow is the best free online tool to download YouTube videos and convert YouTube to MP3 audio. High speed, 1080p/4K support, and 100% secure. No registration required.",
    keywords: [
        "youtube downloader",
        "video downloader",
        "youtube to mp3 converter",
        "save youtube videos",
        "4k video downloader",
        "download yt videos free",
        "vidflow",
    ],
    openGraph: {
        title: "VidFlow - Fast & Free Video Downloader",
        description: "Download YouTube videos and audio in high quality (1080p, 4K, MP3) for free.",
        type: "website",
        siteName: "VidFlow",
    },
    twitter: {
        card: 'summary_large_image',
        title: 'VidFlow - Fast Video Downloader',
        description: 'Download YouTube videos in high quality for free.',
    },
    metadataBase: new URL('https://video-download-frontend-codisco.vercel.app'),
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
