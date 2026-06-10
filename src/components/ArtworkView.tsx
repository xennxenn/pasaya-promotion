/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { toPng } from "html-to-image";
import { 
  ArrowLeft, Calendar, User, Phone, Clock, Gift, Download, Copy, Check, 
  Star, ShieldCheck, RefreshCw, Sparkles, Award
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

  if (str.includes("T")) {
    str = str.split("T")[0];
  }

  const parts = str.split(/[^0-9]/).filter(Boolean);
  if (parts.length >= 3) {
    if (parts[0].length === 4) {
      const y = parts[0];
      const m = parts[1].padStart(2, "0");
      const d = parts[2].padStart(2, "0");
      return `${d}/${m}/${y}`;
    }
    if (parts[2].length === 4) {
      const d = parts[0].padStart(2, "0");
      const m = parts[1].padStart(2, "0");
      const y = parts[2];
      return `${d}-${m}-${y}`;
    }
  }

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

  const captureArtworkImage = async (): Promise<string | null> => {
    if (!artworkRef.current) return null;
    try {
      const dataUrl = await toPng(artworkRef.current, {
        cacheBust: true,
        pixelRatio: 3, 
        backgroundColor: "#F5EFE4", 
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
        link.download = `PASAYA-Privilege-${customer.cleanPhone}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setDownloadState("success");
      } catch (err) {
        console.error("Link trigger download failed", err);
        alert("ไม่สามารถบันทึกภาพลงเครื่องโดยตรงได้ กรุณาลองจับภาพหน้าจอ (Screenshot) เเทนครับ");
      }
    } else {
      alert("ไม่สามารถบันทึกภาพได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง");
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
        alert("เบราว์เซอร์นี้ไม่สนับสนุนการเซฟรูปลงคลิปบอร์ดตรงตัว กรุณาบันทึกภาพด้วยปุ่ม 'บันทึกรูปเอกสารสิทธิ์' เเทนครับ");
        setCopyState("idle");
      }
    } else {
      setCopyState("idle");
    }
    setTimeout(() => setCopyState("idle"), 3000);
  };

  const pasayaLogoSvg = (
    <div className="flex flex-col items-center justify-center pt-2 select-none">
      <img
        src="https://lh3.googleusercontent.com/d/1xT2ysUSWkTcFxs1ztoGxZuQcnO_c66Tu"
        alt="PASAYA Logo"
        className="h-28 sm:h-32 object-contain mx-auto"
        referrerPolicy="no-referrer"
      />
    </div>
  );

  const renderFormattedText = (text: string, isHighlighted: boolean) => {
    const parenRegex = /\(([^)]+)\)/;
    const match = text.match(parenRegex);
    
    if (match) {
      const parenContent = match[0]; 
      const partBefore = text.replace(parenContent, "").trim();

      return (
        <div className="flex flex-col items-start w-full gap-0.5">
          <span className={`${isHighlighted ? "text-brand-crimson font-medium" : "font-medium text-brand-charcoal"} text-xs sm:text-[13px] leading-relaxed block w-full`}>
            {partBefore}
          </span>
          <span className="text-[10.5px] sm:text-[11px] font-light text-neutral-400 block select-all leading-normal w-full">
            {parenContent}
          </span>
        </div>
      );
    }
    
    return (
      <span className={`${isHighlighted ? "text-brand-crimson font-semibold" : "font-medium text-brand-charcoal"} text-xs sm:text-[13px] leading-relaxed block w-full`}>
        {text}
      </span>
    );
  };

  return (
    <div className="bg-gradient-to-tr from-brand-charcoal via-[#231A18] to-brand-charcoal min-h-screen py-10 px-4 sm:px-6 flex flex-col items-center justify-start relative font-sans">
      
      {/* Decorative luxury radial glows */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-brand-gold/10 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-brand-crimson/5 rounded-full filter blur-[130px] pointer-events-none"></div>

      {showBackButton && (
        <div className="w-full max-w-[610px] mb-6 self-center flex">
          <button
            onClick={onBack}
            className="bg-transparent text-brand-gold/90 px-4 py-2.5 rounded-xl border border-brand-gold/30 hover:border-brand-gold/80 hover:bg-white/5 active:scale-[0.98] transition-all font-medium flex items-center text-xs sm:text-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2 text-brand-gold" />
            กลับหน้าแผงควบคุมระบบ
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
          className="pt-10 pb-6 px-6 bg-brand-light-gold relative flex-shrink-0"
        >

        {/* Elegant Gold/Crimson Luxury Border Box */}
        <div className="bg-white rounded-2xl p-8 sm:p-10 border border-brand-gold/30 shadow-[0_24px_60px_rgba(31,25,23,0.15)] relative overflow-hidden">
          
          {/* Executive Corner Watermarks */}
          <div className="absolute top-5 left-5 w-8 h-8 border-t border-l border-brand-gold/50"></div>
          <div className="absolute top-5 right-5 w-8 h-8 border-t border-r border-brand-gold/50"></div>
          <div className="absolute bottom-5 left-5 w-8 h-8 border-b border-l border-brand-gold/50"></div>
          <div className="absolute bottom-5 right-5 w-8 h-8 border-b border-r border-brand-gold/50"></div>
          
          {/* Certificate Header - Modern Luxury Layout */}
          <div className="text-center pt-2 pb-6 border-b border-neutral-100 relative">
            <div className="inline-block mx-auto mb-1">
              {pasayaLogoSvg}
            </div>
            
            <p className="font-serif italic text-brand-dark-gold text-[11px] sm:text-xs tracking-[0.25em] uppercase font-medium">
              Exclusive Privilege Partnership
            </p>
            
            <h1 className="text-[17px] sm:text-[21px] font-semibold text-brand-charcoal tracking-wide mt-2 font-serif uppercase">
              หนังสือยืนยันเอกสิทธิ์เฉพาะบุคคล
            </h1>
            
            <p className="text-xs text-neutral-400 font-light mt-0.5">
              Promotion Privilege Portfolio Specification
            </p>

            <div className="flex flex-col items-center gap-1.5 mt-4">
              <div className="inline-flex items-center gap-2 bg-brand-light-gold/80 border border-brand-gold/20 rounded-full px-4 py-1.5 text-[10px] sm:text-xs font-medium text-brand-dark-gold">
                <Calendar className="w-3.5 h-3.5 text-brand-crimson" />
                <span>งานบ้านและสวนแฟร์ Shopping Week ณ อิมแพ็ค เมืองทองธานี</span>
              </div>
              <span className="text-[10.5px] sm:text-xs text-brand-dark-gold font-medium tracking-wide">
                ระหว่างวันที่ 20 - 28 มิถุนายน 2026
              </span>
            </div>
          </div>

          {/* Core Documents Ledger */}
          <div className="py-6 space-y-6">
            
            {/* Elegant Prestige Ledger Table */}
            <div className="border border-neutral-100 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-brand-light-gold/50 border-b border-neutral-100 px-4 py-2 flex justify-between items-center">
                <span className="text-[9px] font-semibold text-brand-dark-gold tracking-widest uppercase">Registered specifications</span>
                <span className="text-[8px] sm:text-[9px] text-neutral-400 font-mono tracking-wider">REF. PASAYA-2026-REG</span>
              </div>
              <div className="divide-y divide-neutral-100 p-4 bg-white/70">
                <div className="grid grid-cols-2 gap-4 py-1">
                  <div>
                    <span className="text-[8px] text-neutral-400 font-medium uppercase tracking-widest block">คู่ค้าและผู้รับสิทธิพิเศษ</span>
                    <span className="text-[13px] sm:text-sm font-semibold text-brand-charcoal block mt-0.5">{customer.name}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-neutral-400 font-medium uppercase tracking-widest block">หมายเลขรับสิทธิ์ยืนยัน</span>
                    <span className="text-[13px] sm:text-sm font-semibold text-brand-charcoal block mt-0.5 font-mono">{customer.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Privilege Status Card */}
            <div className="bg-gradient-to-br from-brand-light-gold to-white border border-brand-gold/35 rounded-xl p-5 relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 right-0 p-3 text-brand-gold/15 select-none pointer-events-none">
                <Award className="w-20 h-20" />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-semibold bg-brand-crimson/10 text-brand-crimson border border-brand-crimson/15 tracking-wider uppercase">
                    {customer.promoType}
                  </span>
                  
                  <h3 className="text-[14px] sm:text-[15px] font-serif font-semibold text-brand-charcoal mt-1 flex items-start">
                    <Sparkles className="w-4 h-4 text-brand-gold fill-brand-gold mr-1.5 mt-0.5 flex-shrink-0" />
                    <span>
                      เอกสิทธิ์การรับโปรโมชั่น<br />ผ้าม่านสั่งตัดพิเศษ
                    </span>
                  </h3>
                  
                  <p className="text-[10.5px] text-neutral-400 font-light flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 flex-shrink-0 text-brand-gold" />
                    บันทึกหลักฐานยอดวางจอง: {formatDateToDDMMYYYY(customer.date)}
                  </p>
                </div>
                
                <div className="bg-white border border-brand-gold/45 px-4 py-2.5 rounded-xl text-center shadow-sm min-w-[150px] self-stretch sm:self-auto flex sm:flex-col justify-between items-center sm:justify-center flex-shrink-0">
                  <span className="text-[8px] text-neutral-400 font-medium tracking-widest uppercase block">วงเงินมัดจำสิทธิ์</span>
                  <span className="text-xl sm:text-2xl font-semibold text-brand-crimson mt-0.5 font-serif">
                    {customer.amount} <span className="text-xs font-normal text-neutral-500">THB</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Somfy Motor Upgrade section in luxury layout */}
            {customer.promoType === "จองโปรพร้อมมอเตอร์" && (
              <div className="bg-gradient-to-r from-neutral-50 to-[#FCF9F5] border border-neutral-100 rounded-xl p-4 flex items-center gap-3 shadow-inner">
                <div className="w-8 h-8 rounded-full bg-brand-gold/15 text-brand-dark-gold flex items-center justify-center text-xs font-semibold flex-shrink-0 select-none">
                  M
                </div>
                <div className="flex-1 min-w-0">
                  <span className="inline-block bg-brand-dark-gold/10 text-brand-dark-gold text-[7px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider mb-1">
                    Special Somfy Upgrade Option
                  </span>
                  <h4 className="text-[11.5px] sm:text-[12.5px] font-bold text-brand-charcoal leading-snug">
                    พิเศษ! ส่วนลดค่ามอเตอร์ SOMFY เฉพาะรุ่น DESINGO 35/50 RTS 50%
                  </h4>
                  <p className="text-[9.5px] text-neutral-400 mt-0.5 font-light leading-normal">
                    (สงวนสิทธิ์สำหรับโควตาคู่ค้าจองสิทธิ์พร้อมมอเตอร์ โดยงดร่วมรายการหักส่วนลดซ้ำซ้อนในตาราง Ontop)
                  </p>
                </div>
              </div>
            )}

            {/* Specific Privilege Provisions list */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                <Gift className="w-4 h-4 text-brand-dark-gold flex-shrink-0" />
                <span className="text-xs sm:text-[13px] font-serif font-semibold text-brand-charcoal tracking-wide uppercase">ข้อกำหนดสิทธิประโยชน์ระดับพรีเมี่ยม</span>
              </div>

              {/* Sophisticated Thai Rows Details */}
              <div className="space-y-2.5">
                {(() => {
                  let mainItemCounter = 0;
                  return promoConditions.map((cond, idx) => {
                    const isHighlight = cond.includes("พิเศษ!") || cond.includes("ฟรี!");
                    const isSubItem = /^\d+\.\d+/.test(cond);

                    let bulletSymbol = "";
                    if (isSubItem) {
                      bulletSymbol = "└─";
                    } else {
                      mainItemCounter++;
                      bulletSymbol = `${mainItemCounter}.`;
                    }

                    const cleanCond = cond.replace(/^\d+(\.\d+)?\.?\s*/, "");

                    return (
                      <div 
                        key={idx} 
                        className={`flex gap-3 text-xs leading-relaxed ${
                          isSubItem ? "pl-5 text-neutral-500 font-light" : "text-brand-charcoal font-medium"
                        }`}
                      >
                        <span className={`font-mono text-[11px] flex-shrink-0 ${
                          isHighlight ? "text-brand-crimson font-bold" : "text-brand-dark-gold"
                        }`}>
                          {bulletSymbol}
                        </span>
                        <div className="flex-1 min-w-0">
                          {renderFormattedText(cleanCond, isHighlight)}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

          </div>

          {/* Clean Thin Gold Line dividing stub spec */}
          <div className="border-t border-neutral-100 pt-5 mt-2 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-neutral-400">ผู้จัดบันทึกรายการ:</span>
              <span className="font-semibold text-brand-charcoal bg-[#F2EDE2]/60 px-3 py-1 rounded border border-neutral-200/50 font-sans">
                {customer.salesperson || "ส้มส้ม PASAYA"}
              </span>
            </div>
            
            {/* Signature Certificate verification label */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-dark-gold" />
              <span className="text-[10px] text-brand-dark-gold font-serif font-semibold tracking-wider uppercase">
                PASAYA Executive Safe
              </span>
            </div>
          </div>

          {/* Genuine certification seal footnote */}
          <div className="text-[9.5px] font-sans font-light text-neutral-400 text-left pt-3.5 mt-2 border-t border-neutral-100/60 leading-normal">
            * เอกสิทธิ์ใบยืนยันสิทธิ์นี้ได้รับการจองมัดจำอย่างถูกต้องภายใต้เงื่อนไข PASAYA Curtain Center สิทธิประโยชน์ไม่สามารถโอนสิทธิ์หรือแลกเปลี่ยนเป็นเงินสดได้ และมีระยะเวลาติดตั้งภายในกำหนดตามเงื่อนไขของสัญญาหลัก
          </div>

        </div> 
      </div> 
    </div> 

      {/* Control Actions - Luxuriously Formatted Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 w-full max-w-[610px] relative z-20 px-2 pb-16">
        <button
          onClick={handleDownload}
          disabled={downloadState === "loading"}
          className={`flex-1 flex justify-center items-center py-4 px-6 rounded-xl font-medium tracking-wide text-xs sm:text-sm min-h-[48px] uppercase transition-all shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer border disabled:opacity-75 ${
            downloadState === "success" 
              ? "bg-emerald-600 border-emerald-700 text-white" 
              : "bg-brand-crimson border-brand-crimson text-white hover:bg-brand-dark-red"
          }`}
        >
          {downloadState === "loading" ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : downloadState === "success" ? (
            <Check className="w-4 h-4 mr-2" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {downloadState === "loading" ? "กำลังบันทึกเอกสาร..." : downloadState === "success" ? "บันทึกเรียบร้อย!" : "บันทึกรูปเอกสารสิทธิ์ (Save Landscape)"}
        </button>

        <button
          onClick={handleCopyToClipboard}
          disabled={copyState === "loading"}
          className={`flex-1 flex justify-center items-center py-4 px-6 rounded-xl font-medium tracking-wide text-xs sm:text-sm min-h-[48px] transition-all border shadow-sm active:scale-[0.99] disabled:opacity-75 ${
            copyState === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-transparent text-brand-gold border-brand-gold/30 hover:border-brand-gold hover:bg-white/5"
          }`}
        >
          {copyState === "loading" ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : copyState === "success" ? (
            <Check className="w-4 h-4 mr-2" />
          ) : (
            <Copy className="w-4 h-4 mr-2" />
          )}
          {copyState === "loading"
            ? "กำลังคัดลอก..."
            : copyState === "success"
            ? "คัดลอกรูปสำเร็จแล้ว"
            : "คัดลอกรูปสำหรับส่ง LINE (Copy)"}
        </button>
      </div>

    </div>
  );
}
