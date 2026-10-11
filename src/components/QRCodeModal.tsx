'use client';

import React, { useState, useEffect, useRef } from 'react';
import { generateQRCodeDataUrl, generateQRCodeSVG } from '../lib/qrService';
import { X, Download, Printer, Copy, Check, QrCode as QrIcon } from 'lucide-react';
import { SchoolLogo } from './SchoolLogo';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose }) => {
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [qrPngUrl, setQrPngUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const defaultUrl = window.location.origin;
      setTargetUrl(defaultUrl);
      updateQR(defaultUrl);
    }
  }, [isOpen]);

  const updateQR = async (url: string) => {
    if (!url) return;
    try {
      const png = await generateQRCodeDataUrl({ url, width: 1200 });
      setQrPngUrl(png);
    } catch (e) {
      console.error('Error creating QR:', e);
    }
  };

  const handleUrlChange = (newUrl: string) => {
    setTargetUrl(newUrl);
    updateQR(newUrl);
  };

  const downloadPNG = () => {
    if (!qrPngUrl) return;
    const a = document.createElement('a');
    a.href = qrPngUrl;
    a.download = 'Irshad_English_School_Inspection_QR.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadSVG = async () => {
    try {
      const svg = await generateQRCodeSVG({ url: targetUrl });
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Irshad_English_School_Inspection_QR.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('Error creating SVG:', e);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const printSticker = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <QrIcon className="w-5 h-5 text-blue-700" />
            <h2 className="text-base font-serif font-black text-[#0f2b5c]">
              Inspection Booklet QR Code Generator
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[85vh]">
          
          {/* Target URL input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Exhibition Destination URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
              <button
                onClick={copyUrl}
                className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              When printed on the booklet front cover, scanning this code opens the mobile exhibition immediately.
            </p>
          </div>

          {/* Printable Booklet Sticker Card */}
          <div 
            ref={printAreaRef}
            className="p-6 rounded-2xl bg-white text-slate-900 shadow-xl border-4 border-[#0b172a] text-center space-y-4"
          >
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full overflow-hidden mb-1.5 p-0.5 border border-[#d4af37] bg-white shadow-xs">
                <img src="/assets/school-logo.png" alt="Logo" className="w-full h-full object-contain rounded-full" />
              </div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-amber-700">
                OFFICIAL INSPECTION EDITION 2024–2026
              </span>
              <h3 className="text-lg font-serif font-bold text-[#0b172a] tracking-tight uppercase">
                Irshad English School
              </h3>
              <p className="text-[11px] text-slate-600 font-medium">
                Melattur, Malappuram • CBSE Affiliation No. 930636
              </p>
            </div>

            {/* QR Code with clean quiet zone */}
            <div className="flex justify-center my-2">
              <div className="p-3 bg-white rounded-xl shadow-inner border border-slate-200 inline-block">
                {qrPngUrl ? (
                  <img src={qrPngUrl} alt="QR Code" className="w-52 h-52 object-contain" />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400">
                    Generating QR...
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-[#0b172a] uppercase tracking-wide">
                Scan to Explore Our Achievements
              </p>
              <p className="text-[10px] text-slate-500">
                Point any smartphone camera to open the digital exhibition
              </p>
            </div>
          </div>

          {/* Download & Print Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={downloadPNG}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>PNG (1200px)</span>
            </button>

            <button
              onClick={downloadSVG}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Vector SVG</span>
            </button>

            <button
              onClick={printSticker}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b89028] text-slate-950 text-xs font-bold shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sticker</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
