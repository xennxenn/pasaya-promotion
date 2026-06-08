/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { toPng } from "html-to-image";
import { 
  ArrowLeft, Calendar, User, Phone, Clock, Gift, Download, Copy, Check, 
  Star, ShieldCheck, RefreshCw, Sparkles, Smile
} from "lucide-react";
import { Customer } from "../types";
import { PROMOTIONS } from "../data";

interface ArtworkViewProps {
  customer: Customer;
  onBack: () => void;
  showBackButton: boolean;
}

const formatDateToDDMMYYYY = (dateStr: string): string => {
  if (!dateStr) return "";
  let str = dateStr.trim();

  // If it's a full ISO timestamp, extract the date segment
  if (str.includes("T")) {
    str = str.split("T")[0];
  }

  // Split by any non-digit chars
  const parts = str.split(/[^0-9]/).filter(Boolean);
  if (parts.length >= 3) {
    // If the first part is 4 digits, it's YYYY-MM-DD
    if (parts[0].length === 4) {
      const y = parts[0];
      const m = parts[1].padStart(2, "0");
      const d = parts[2].padStart(2, "0");
      return `${d}-${m}-${y}`;
    }
    // If the third/last part is 4 digits, it's DD-MM-YYYY
    if (parts[2].length === 4) {
      const d = parts[0].padStart(2, "0");
      const m = parts[1].padStart(2, "0");
      const y = parts[2];
      return `${d}-${m}-${y}`;
    }
  }

  // Fallback: replace slashes with dashes
  return str.replace(/\//g, "-");
};

export default function ArtworkView({ customer, onBack, showBackButton }: ArtworkViewProps) {
  const artworkRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [downloadState, setDownloadState] = useState<"idle" | "loading" | "success">("idle");
  const [copyState, setCopyState] = useState<"idle" | "loading" | "success">("idle");

  const [scale, setScale] = useState(1);
  const [flyerHeight, setFlyerHeight] = useState<number | null>(null);

  const promoConditions = PROMOTIONS[customer.promoType] || PROMOTIONS["จองโปร"];

  // Generate deep link shareable URL encode query string
  const getShareUrl = () => {
    try {
      const origin = window.location.origin + window.location.pathname;
      const params = new URLSearchParams();
      params.set("phone", customer.phone);
      params.set("name", customer.name);
      params.set("amount", customer.amount);
      params.set("promoType", customer.promoType);
      params.set("salesperson", customer.salesperson || "");
      params.set("date", customer.date);
      return `${origin}?${params.toString()}`;
    } catch (e) {
      return window.location.href;
    }
  };

  const shareUrl = getShareUrl();
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareUrl)}`;

  // Screen layout scaling watcher
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const parentWidth = containerRef.current.getBoundingClientRect().width || containerRef.current.offsetWidth;
      const targetWidth = 610;
      if (parentWidth < targetWidth) {
        setScale(parentWidth / targetWidth);
      } else {
        setScale(1);
      }
    };

    handleResize();

    const observer = new ResizeObserver(() => {
      handleResize();
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    window.addEventListener("resize", handleResize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Monitor target actual size to adjust wrapper relative space
  useEffect(() => {
    if (!artworkRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setFlyerHeight(entry.contentRect.height);
      }
    });
    observer.observe(artworkRef.current);
    return () => observer.disconnect();
  }, []);

  // Modern capture with html-to-image avoiding OKLCH parse crash, forced to desktop layout dimension
  const captureArtworkImage = async (): Promise<string | null> => {
    if (!artworkRef.current) return null;
    try {
      const dataUrl = await toPng(artworkRef.current, {
        cacheBust: true,
        pixelRatio: 3, // HD printing standard for crisp renders
        backgroundColor: "#f9f6f0", // Warm organic background palette
        style: {
          transform: "scale(1)",
          transformOrigin: "top center",
          width: "610px",
          margin: "0",
        }
      });
      return dataUrl;
    } catch (err) {
      console.error("Error capturing artwork with html-to-image:", err);
      return null;
    }
  };

  const handleDownload = async () => {
    setDownloadState("loading");
    const dataUrl = await captureArtworkImage();
    if (dataUrl) {
      try {
        const link = document.createElement("a");
        link.download = `PASAYA-Flyer-${customer.cleanPhone}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setDownloadState("success");
      } catch (err) {
        console.error("Link trigger download failed", err);
        alert("ไม่สามารถบันทึกภาพลงเครื่องโดยตรงได้ กรุณาลองแคปหน้าจอแทนครับ");
      }
    } else {
      alert("ไม่สามารถเรนเดอร์ภาพได้ชั่วคราว กรุณาลองใหม่อีกครั้ง");
    }
    setTimeout(() => setDownloadState("idle"), 2200);
  };

  const handleCopyToClipboard = async () => {
    setCopyState("loading");
    const dataUrl = await captureArtworkImage();
    if (dataUrl) {
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
        setCopyState("success");
      } catch (err) {
        console.error("Clipboard blocked:", err);
        alert("เบราว์เซอร์นี้ไม่สนับสนุนการเซฟรูปลงคลิปบอร์ดตรงตัว กรุณาบันทึกภาพด้วยปุ่ม 'บันทึกรูปภาพ (Save Image)' เเทนครับ");
        setCopyState("idle");
      }
    } else {
      setCopyState("idle");
    }
    setTimeout(() => setCopyState("idle"), 3000);
  };

  // Google Drive Verified PASAYA Logo image replacement
  const pasayaLogoSvg = (
    <div className="flex flex-col items-center justify-center pt-2 select-none">
      <img
        src="https://lh3.googleusercontent.com/d/1xT2ysUSWkTcFxs1ztoGxZuQcnO_c66Tu"
        alt="PASAYA Logo"
        className="h-32 sm:h-40 object-contain mx-auto"
        referrerPolicy="no-referrer"
      />
    </div>
  );

  // Separates bracketized contents into its own line and styles them with font-normal to make sure it's not bold
  const renderFormattedText = (text: string, isHighlighted: boolean) => {
    const parenRegex = /\(([^)]+)\)/;
    const match = text.match(parenRegex);
    
    if (match) {
      const parenContent = match[0]; // Includes brackets e.g. "(ยกเว้นรุ่น Ultra Violet และ Ballet)"
      const partBefore = text.replace(parenContent, "").trim();

      return (
        <div className="flex flex-col items-start w-full gap-0.5">
          <span className={`${isHighlighted ? "text-gray-900 font-extrabold" : "font-extrabold text-[#2c201c]"} text-xs sm:text-[13px] leading-relaxed block w-full`}>
            {partBefore}
          </span>
          <span className="text-[10.5px] sm:text-[11px] font-medium text-gray-400 block pl-0.5 select-all leading-normal w-full">
            {parenContent}
          </span>
        </div>
      );
    }
    
    return (
      <span className={`${isHighlighted ? "text-gray-900 font-extrabold" : "font-extrabold text-[#2c201c]"} text-xs sm:text-[13px] leading-relaxed block w-full`}>
        {text}
      </span>
    );
  };

  return (
    <div className="bg-[#f2ebe1] min-h-screen py-10 px-4 sm:px-6 flex flex-col items-center justify-start relative font-sans">
      
      {/* Decorative indie background elements */}
      <div className="absolute top-20 left-10 w-40 h-40 bg-orange-200/40 rounded-full filter blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-[#ebd9c8]/50 rounded-full filter blur-3xl pointer-events-none"></div>

      {showBackButton && (
        <div className="w-full max-w-[610px] mb-6 self-center flex">
          <button
            onClick={onBack}
            className="bg-white text-[#4a0e10] px-4 py-2.5 rounded-xl shadow-sm border-2 border-[#4a0e10] hover:bg-neutral-50 active:scale-[0.98] transition font-bold flex items-center text-xs sm:text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับหน้าพนักงาน
          </button>
        </div>
      )}

      {/* Container wrapper that auto-scales the fixed-width flyer to fit mobile screens perfectly */}
      <div 
        ref={containerRef} 
        style={{ height: flyerHeight ? `${(flyerHeight * scale) + 24}px` : "auto" }} 
        className="w-full flex justify-center items-start overflow-hidden relative"
      >
        {/* Target element for html-to-image extraction - styled with a fixed desktop width */}
        <div 
          id="artwork-capture" 
          ref={artworkRef} 
          style={{ 
            width: "610px", 
            transform: `scale(${scale})`, 
            transformOrigin: "top center",
          }}
          className="pt-10 pb-5 px-5 bg-[#f9f6f0] rounded-[2.5rem] relative flex-shrink-0"
        >
        
        {/* Mock Washi tape sticker over the flyer */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#eee3d1] border-l-4 border-r-4 border-dashed border-[#bda88e] text-[#6d5638] text-[9px] font-extrabold px-8 py-1.5 rotate-[-1deg] shadow-sm uppercase tracking-widest z-20">
          📍 Verified Booking Handbill
        </div>

        {/* Outer Solid Border Box reminiscent of physical print layout with raw offset shadow */}
        <div className="bg-[#fffefe] rounded-3xl p-5 sm:p-7 border-3 border-[#2c201c] shadow-[6px_6px_0px_#4a0e10]">
          
          {/* Header - Editorial Style, NOT AI Style */}
          <div className="text-center pt-5 pb-6 border-b-2 border-dashed border-[#2c201c] relative">
            <div className="inline-block mx-auto mb-3">
              {pasayaLogoSvg}
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black text-[#2c201c] tracking-tight leading-tight mt-2">
              โปรโมชั่นงานบ้านและสวน
            </h1>
            <p className="text-[#a51c24] text-xs sm:text-sm font-extrabold tracking-wide mt-1">
              มหกรรมบ้านและสวน Shopping Week
            </p>

            <div className="inline-flex items-center gap-1.5 bg-[#fcf8f2] border-2 border-[#2c201c] rounded-xl px-3.5 py-1 mt-3.5 text-[10px] sm:text-xs font-bold text-[#4a0e10] shadow-[2px_2px_0px_#2c201c]">
              <Calendar className="w-3.5 h-3.5 text-[#a51c24]" />
              20 - 28 มิ.ย. 2569 @อิมแพ็ค เมืองทองธานี
            </div>
          </div>

          {/* Ticket Information Section */}
          <div className="py-6 space-y-5">
            
            {/* Soft-styled Post-it Note visual representing customer confirmation details */}
            <div className="bg-[#fcfaf4] border-2 border-[#2c201c]/70 rounded-2xl p-4 shadow-[3px_3px_0px_rgba(44,32,28,0.1)] relative">
              <div className="absolute top-2 right-3 opacity-10">
                <Smile className="w-12 h-12 text-[#4a0e10]" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-[#766352] bg-[#fbf5ee] border border-[#e8dccb] px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    Customer Info
                  </span>
                  <span className="text-[9px] font-bold text-[#a09080] tracking-wider uppercase">PASAYA CLIENT REGISTER</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="min-w-0">
                    <span className="text-[9px] text-[#2c201c]/50 font-black uppercase tracking-wider block">ผู้มีสิทธิ์ใช้งาน</span>
                    <span className="text-sm sm:text-base font-black text-[#2c201c] block mt-0.5 whitespace-nowrap">{customer.name}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] text-[#2c201c]/50 font-black uppercase tracking-wider block">เบอร์ติดต่อสำคัญ</span>
                    <span className="text-sm sm:text-base font-black text-[#2c201c] block mt-0.5 font-mono whitespace-nowrap">{customer.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign info block layout like a supermarket receipt */}
            <div className="bg-[#fffdfa] border-2 border-[#2c201c] rounded-2xl p-4.5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="min-w-0 flex-1">
                  <span className="inline-block bg-[#e9dad1] text-[#4a0e10] text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider whitespace-nowrap">
                    {customer.promoType}
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-[#2c201c] mt-2 flex items-center whitespace-nowrap">
                    <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 mr-1.5 flex-shrink-0" />
                    โควตาสิทธิพิเศษของท่าน
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold mt-1.5 flex items-center whitespace-nowrap animate-none">
                    <Clock className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                    บันทึกยอดมัดจำ: {formatDateToDDMMYYYY(customer.date)}
                  </p>
                </div>
                
                <div className="bg-[#fffcf8] border-2 border-dashed border-[#2c201c] px-4 py-2 bg-[#fffcf8] rounded-xl text-center min-w-[140px] shadow-sm self-stretch sm:self-auto flex sm:flex-col justify-between items-center sm:justify-center flex-shrink-0">
                  <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider">ยอดเงินวางจอง</span>
                  <span className="text-xl sm:text-2xl font-black text-[#a51c24] mt-0.5">{customer.amount} <span className="text-xs font-black text-gray-500">บาท</span></span>
                </div>
              </div>
            </div>

            {/* NEW ADDITION: Premium Smart Motor Upgrade Option (มอเตอร์ลด 50% สำหรับลูกค้าจองโปรพร้อมมอเตอร์) */}
            {customer.promoType === "จองโปรพร้อมมอเตอร์" && (
              <div className="bg-[#fefcf8] border-2 border-dashed border-[#a51c24] rounded-2xl p-3.5 flex items-center gap-3 shadow-sm relative overflow-hidden">
                <div className="text-xl flex-shrink-0 select-none">⚙️</div>
                <div className="flex-1 min-w-0">
                  <span className="inline-block bg-[#a51c24] text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider mb-1">
                    EXCLUSIVE MOTOR UPGRADE
                  </span>
                  <h4 className="text-xs sm:text-[13px] font-black text-[#2c201c] leading-snug">
                    พิเศษ! ส่วนลดค่ามอเตอร์ SOMFY เฉพาะรุ่น DESINGO 35/50 RTS 50%
                  </h4>
                  <p className="text-[10px] sm:text-[10.5px] text-gray-400 mt-1 leading-normal font-medium">
                    (ส่วนลดมอเตอร์นี้มีผลเฉพาะกรณีจองมัดจำและไม่ร่วมการคิดส่วนลดซ้อนในตาราง Ontop)
                  </p>
                </div>
              </div>
            )}

            {/* Benefits Leaflet Segment */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1.5 border-b border-[#2c201c]/10">
                <Gift className="w-4.5 h-4.5 text-[#a51c24] flex-shrink-0" />
                <span className="text-sm font-black text-[#2c201c]">รายการสิทธิพิเศษผ้าม่านที่คุณจะได้รับ</span>
              </div>

              {/* Perfectly-fitted Thai wrapped rows */}
              <div className="space-y-2">
                {promoConditions.map((cond, idx) => {
                  const isHighlight = cond.includes("พิเศษ!") || cond.includes("ฟรี!");
                  const isSubItem = /^\d+\.\d+/.test(cond);

                  const boxClass = isSubItem
                    ? "bg-[#faf8f4] border border-[#2c201c]/30 pl-4 py-2 pr-3 ml-3 rounded-lg flex items-center gap-2 text-xs text-[#2c201c]/80"
                    : "bg-[#fdfcf9] border-2 border-[#2c201c] p-2.5 rounded-xl flex items-center gap-2.5 text-xs font-bold text-[#2c201c]";

                  return (
                    <div key={idx} className={boxClass}>
                      {isHighlight ? (
                        <span className="text-amber-500 font-extrabold flex-shrink-0">★</span>
                      ) : (
                        <span className="text-[#a51c24] font-extrabold flex-shrink-0">✔</span>
                      )}
                      <div className="flex-1 min-w-0">
                        {renderFormattedText(cond, isHighlight)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Flyer Perforated Tear-off Coupon Line */}
          <div className="relative my-1 flex items-center justify-between text-[#2c201c]/50">
            <div className="absolute -left-[30px] w-6 h-6 rounded-full bg-[#f9f6f0] border-r-3 border-[#2c201c]"></div>
            <div className="w-full border-t-2 border-dashed border-[#2c201c]/40"></div>
            <div className="absolute -right-[30px] w-6 h-6 rounded-full bg-[#f9f6f0] border-l-3 border-[#2c201c]"></div>
          </div>

          {/* Bottom Coupon Stub "Tear-off Part" with mandatory rules and warranty terms */}
          <div className="pt-4 flex flex-col gap-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pb-1">
              <div className="flex items-center text-[#2c201c] gap-1 flex-shrink-0">
                <span className="text-sm">💬</span>
                <span className="font-black text-[#2c201c]/60 text-[11px] mr-1">ผู้แนะนำสิทธิ์:</span>
                <span className="font-extrabold text-[#2c201c] bg-[#efdfcc] px-2.5 py-1 rounded-md border border-[#2c201c]/25 select-all text-xs inline-block whitespace-nowrap">
                  {customer.salesperson || "ส้มส้ม PASAYA"}
                </span>
              </div>
              <div className="text-[9.5px] text-[#2c201c]/40 font-black tracking-widest uppercase select-none">
                PASAYA OFFICIAL
              </div>
            </div>
            
            <div className="text-[10px] text-[#2c201c]/60 font-semibold leading-relaxed font-sans text-left w-full border-t border-[#2c201c]/10 pt-2">
              *หมายเหตุ: เงื่อนไขและส่วนลดเป็นไปตามที่บริษัทกำหนดเฉพาะบุคคล สภาพสิทธิ์ตลอดจนสัญญารับประกันคุณภาพและการติดตั้งบริการหลังการขายยังคงสมบูรณ์ดีเยี่ยมตามมาตรฐาน PASAYA
            </div>
          </div>

        </div> {/* end of outer border box */}
      </div> {/* end of flyer scale div */}
    </div> {/* end of containerRef wrapper */}

      {/* Control Actions - Download / Copy Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3 w-full max-w-[610px] relative z-20 px-2 pb-12">
        <button
          onClick={handleDownload}
          disabled={downloadState === "loading"}
          className={`flex-1 ${
            downloadState === "success" ? "bg-emerald-600 border-[#064e3b]" : "bg-[#4a0e10] hover:bg-[#340709] border-[#2c201c]"
          } text-white py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base border-3 flex justify-center items-center shadow-[4px_4px_0px_#2c201c] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0px_#2c201c] transition-all cursor-pointer disabled:opacity-75`}
        >
          {downloadState === "loading" ? (
            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
          ) : downloadState === "success" ? (
            <Check className="w-5 h-5 mr-2" />
          ) : (
            <Download className="w-5 h-5 mr-2" />
          )}
          {downloadState === "loading" ? "กำลังสร้างใบปลิวรูปภาพ..." : downloadState === "success" ? "บันทึกรูปสำเร็จแล้ว!" : "บันทึกรูปภาพ (Save Image) 📸"}
        </button>

        <button
          onClick={handleCopyToClipboard}
          disabled={copyState === "loading"}
          className={`flex-1 py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base flex justify-center items-center shadow-[4px_4px_0px_#2c201c] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0px_#2c201c] transition-all border-3 disabled:opacity-75 ${
            copyState === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-600 shadow-[4px_4px_0px_#064e3b]"
              : "bg-white text-[#2c201c] border-[#2c201c] hover:bg-neutral-50"
          }`}
        >
          {copyState === "loading" ? (
            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
          ) : copyState === "success" ? (
            <Check className="w-5 h-5 mr-2" />
          ) : (
            <Copy className="w-5 h-5 mr-2" />
          )}
          {copyState === "loading"
            ? "กำลังบันทึก..."
            : copyState === "success"
            ? "คัดลอกลงคลิปบอร์ดแล้ว!"
            : "คัดลอกรูปส่งทาง LINE (Copy)"}
        </button>
      </div>

    </div>
  );
}
