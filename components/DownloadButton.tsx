'use client';

import { useState } from 'react';
import axios from 'axios';

interface DownloadButtonProps {
  url: string;
  videoInfo: any;
  type: 'video' | 'audio';
  onDownloadComplete?: () => void;
  onError?: (error: string) => void;
}

export default function DownloadButton({ url, videoInfo, type, onDownloadComplete, onError }: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDownload = async (quality: string = 'auto') => {
    if (!url) return;

    setDownloading(true);
    setProgress(0);
    onError?.('');

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    try {
      // Try different methods in order
      const methods = [
        { name: 'ytdl-core', endpoint: type === 'video' ? '/api/download/video' : '/api/download/audio' },
        { name: 'play-dl', endpoint: type === 'video' ? '/api/download/video-playdl' : '/api/download/audio-playdl' },
        { name: 'simple', endpoint: type === 'video' ? '/api/download/video-simple' : '/api/download/audio-simple' }
      ];

      let lastError = '';

      for (const method of methods) {
        try {
          console.log(`Trying ${method.name}...`);

          if (method.name === 'simple') {
            // For simple method, get download link
            const response = await axios.post(`${API_BASE_URL}${method.endpoint}`, { url });
            if (response.data.downloadUrl) {
              // Open in new tab
              window.open(response.data.downloadUrl, '_blank');
              setDownloading(false);
              onDownloadComplete?.();
              return;
            }
          } else {
            // For other methods, get blob
            const response = await axios.post(`${API_BASE_URL}${method.endpoint}`,
              { url, quality },
              { responseType: 'blob' }
            );

            // Create download
            const blob = new Blob([response.data], {
              type: type === 'video' ? 'video/mp4' : 'audio/mpeg'
            });
            const downloadUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = downloadUrl;

            const extension = type === 'video' ? 'mp4' : 'mp3';
            const filename = videoInfo?.title
              ? `${videoInfo.title.replace(/[^\w\s]/gi, '')}.${extension}`
              : `download.${extension}`;

            link.setAttribute('download', filename);
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(downloadUrl);
            setDownloading(false);
            onDownloadComplete?.();
            return;
          }
        } catch (error: any) {
          console.log(`${method.name} failed:`, error.message);
          lastError = error.response?.data?.error || error.message;
          continue;
        }
      }

      // If all methods failed
      onError?.(lastError || 'All download methods failed');
      setDownloading(false);

    } catch (error: any) {
      console.error('Download error:', error);
      onError?.(error.message || 'Download failed');
      setDownloading(false);
    }
  };



  return (
    <div className="relative">
      {/* Main Download Button */}
      <button
        onClick={() => handleDownload()}
        disabled={!url || downloading}
        className={`w-full px-6 py-4 font-bold text-white rounded-xl transition-all transform hover:-translate-y-1 ${type === 'video'
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
            : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
          } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-2xl`}
      >
        <div className="flex items-center justify-center gap-3">
          {downloading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Downloading... {progress > 0 && `${progress}%`}</span>
            </>
          ) : (
            <>
              {type === 'video' ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              )}
              <span>Download {type === 'video' ? 'Video' : 'Audio'}</span>
            </>
          )}
        </div>
      </button>

    </div>
  );
}
