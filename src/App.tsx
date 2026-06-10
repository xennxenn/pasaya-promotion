/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { Customer } from "./types";
import { CSV_URL, FALLBACK_CUSTOMERS } from "./data";
import AdminView from "./components/AdminView";
import ArtworkView from "./components/ArtworkView";
import { Sparkles, QrCode, Search, RefreshCw, AlertCircle, AlertTriangle } from "lucide-react";

export default function App() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [manualCustomers, setManualCustomers] = useState<Customer[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncedCount, setSyncedCount] = useState<number>(0);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Router route state - derived from URL parameters or hash
  const [activeCustomerPhone, setActiveCustomerPhone] = useState<string | null>(null);

  // 1. Listen for hash/URL changes to handle real-time deep links automatically
  useEffect(() => {
    const handleUrlRouting = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const searchPhone = urlParams.get("phone");

      let hashPhone = null;
      if (window.location.hash.startsWith("#phone=")) {
        hashPhone = decodeURIComponent(window.location.hash.replace("#phone=", ""));
      }

      const matchedPhone = searchPhone || hashPhone;
      if (matchedPhone) {
        // Strip out any formatting characters to get clean digits
        setActiveCustomerPhone(matchedPhone.replace(/[\s-]/g, ""));
      } else {
        setActiveCustomerPhone(null);
      }
    };

    // Run on mount
    handleUrlRouting();

    // Register listener for back-button or link clicks
    window.addEventListener("hashchange", handleUrlRouting);
    window.addEventListener("popstate", handleUrlRouting);

    return () => {
      window.removeEventListener("hashchange", handleUrlRouting);
      window.removeEventListener("popstate", handleUrlRouting);
    };
  }, []);

  // 2. Load manual entries stored in local storage
  useEffect(() => {
    const saved = localStorage.getItem("pasaya_manual_customers");
    if (saved) {
      try {
        setManualCustomers(JSON.parse(saved));
      } catch (err) {
        console.error("Local storage restoration failed:", err);
      }
    }
  }, []);

  // 3. Sync from Google Sheet CSV
  const syncFromSheet = () => {
    setIsSyncing(true);
    setSyncError(null);

    Papa.parse(CSV_URL, {
      download: true,
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as string[][];
        if (!rows || rows.length < 2) {
          console.warn("Spreadsheet retrieved with empty or sparse rows, using fallbacks");
          setSyncError("ตาราง Google Sheets โหลดเสร็จสิ้น แต่ไม่พบคอลัมน์ข้อมูล จึงเปิดระบบออฟไลน์เสริม");
          setCustomers(FALLBACK_CUSTOMERS);
          setSyncedCount(0);
          setIsSyncing(false);
          return;
        }

        try {
          // Skip header row
          const parsed: Customer[] = rows
            .slice(1)
            .map((row) => {
              const getCol = (idx: number) => (row[idx] || "").trim();
              const rawPhone = getCol(3);
              const cleanPhone = rawPhone.replace(/[\s-]/g, "");

              const promoRaw = getCol(9);
              let promoType: "จองโปร" | "จองโปรพร้อมมอเตอร์" = "จองโปร"; // Default
              
              if (
                promoRaw.includes("พร้อมมอเตอร์") ||
                promoRaw.includes("พร้อมมอเตอร์ Somfy") ||
                promoRaw.includes("2.")
              ) {
                promoType = "จองโปรพร้อมมอเตอร์";
              }

              return {
                date: getCol(1),
                name: getCol(2),
                phone: rawPhone,
                cleanPhone: cleanPhone,
                amount: getCol(5) || "5,000",
                promoRaw: promoRaw,
                promoType: promoType,
                salesperson: getCol(10)
              };
            })
            .filter((c) => c.name && c.cleanPhone);

          setCustomers(parsed);
          setSyncedCount(parsed.length);
        } catch (e) {
          console.error("Error parsing Google sheet structures", e);
          setCustomers(FALLBACK_CUSTOMERS);
          setSyncedCount(0);
        }
        setIsSyncing(false);
      },
      error: (error) => {
        console.error("Error trying to download sheets file:", error);
        setSyncError("ไม่สามารถเข้าถึงลิงก์ Google Sheets ได้โดยตรง (CORS / เครือข่าย) ระบบจะแสดงข้อมูลตัวอย่างให้ใช้งานแทน");
        setCustomers(FALLBACK_CUSTOMERS);
        setSyncedCount(0);
        setIsSyncing(false);
      }
    });
  };

  // Run sheet-sync automatically on launch
  useEffect(() => {
    syncFromSheet();
  }, []);

  // 4. Add custom Customer manually (persistent in LocalStorage)
  const handleAddManualCustomer = (newCustomer: Customer) => {
    const updated = [newCustomer, ...manualCustomers];
    setManualCustomers(updated);
    localStorage.setItem("pasaya_manual_customers", JSON.stringify(updated));
  };

  // Merge synchronized sheets data and local manual database
  const getCombinedCustomers = () => {
    const list = [...manualCustomers, ...customers];
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlName = urlParams.get("name");
      const urlPhone = urlParams.get("phone");
      if (urlName && urlPhone) {
        const cleanPhone = urlPhone.replace(/[\s-]/g, "");
        const urlAmount = urlParams.get("amount") || "5,000";
        const urlPromoTypeRaw = urlParams.get("promoType") || "จองโปร";
        const urlPromoType = urlPromoTypeRaw === "จองโปรพร้อมมอเตอร์" ? "จองโปรพร้อมมอเตอร์" : "จองโปร";
        const urlSalesperson = urlParams.get("salesperson") || "ส้มส้ม PASAYA";
        const urlDate = urlParams.get("date") || "20/06/2026";

        const tempCustomer: Customer = {
          date: urlDate,
          name: urlName,
          phone: urlPhone,
          cleanPhone: cleanPhone,
          amount: urlAmount,
          promoRaw: `โปรโมชั่นส่วนลด จองสิทธิ์ ${urlPromoType}`,
          promoType: urlPromoType,
          salesperson: urlSalesperson
        };

        // If this customer phone doesn't already exist in list, inject them
        if (!list.some(c => c.cleanPhone === cleanPhone)) {
          list.push(tempCustomer);
        }
      }
    } catch (e) {
      console.error("Failed to parse URL customer", e);
    }
    return list;
  };

  const combinedCustomers = getCombinedCustomers();

  const handleSelectCustomer = (phone: string) => {
    window.location.hash = `#phone=${phone}`;
    setActiveCustomerPhone(phone);
  };

  const handleBackToAdmin = () => {
    // Clear hash and query params
    window.location.hash = "";
    // Reconstruct URL omitting search params
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.pushState({}, document.title, cleanUrl);
    setActiveCustomerPhone(null);
  };

  // Find targeted customer by stripping spaces/dashes for reliable matching
  const activeCustomer = activeCustomerPhone 
    ? combinedCustomers.find(c => c.cleanPhone === activeCustomerPhone) 
    : null;
 
  // Decide view based on routing logic
  if (activeCustomerPhone) {
    if (activeCustomer) {
      return (
        <ArtworkView 
          customer={activeCustomer} 
          onBack={handleBackToAdmin} 
          showBackButton={true} 
        />
      );
    } else {
      // If phone input exists but customer is not yet synchronized, show beautiful lookup tool
      return (
        <div className="bg-artwork-pattern min-h-screen py-10 px-4 sm:px-6 flex flex-col items-center justify-center font-sans relative">
          <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-brand-gold/25 text-center text-neutral-850">
            <div className="bg-brand-light-gold p-4 rounded-full text-brand-dark-gold w-16 h-16 flex items-center justify-center mx-auto mb-5 border border-brand-gold/30">
              <AlertTriangle className="w-8 h-8 text-brand-crimson" />
            </div>
            
            <h2 className="text-lg font-serif font-semibold text-brand-charcoal mb-2">ไม่พบสัญญาสิทธิ์ของหมายเลขนี้ในระบบ</h2>
            
            <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
              หมายเลขสัญญายืนยัน <span className="font-semibold text-brand-crimson font-mono">{activeCustomerPhone}</span> ยังไม่ถูกซิงค์ข้อมูลลงในตาราง หรือไม่ได้จองผ่านฟอร์มส่งมอบ
            </p>
 
            <div className="bg-brand-light-gold/50 rounded-xl p-4.5 text-[11px] text-brand-dark-gold border border-brand-gold/15 text-left leading-relaxed mb-6 space-y-1.5 font-light">
              <p className="font-semibold">คู่มือปฏิบัติงานประจำสาขา:</p>
              <p>1. กรุณากลับไปยังหน้าบริหารจัดการสิทธิ์ส่วนกลาง</p>
              <p>2. เปิดกล่อง "ลงทะเบียนจองสิทธิ์ Manual หน้าร้าน" ด้านบน</p>
              <p>3. กรอกบันทึกข้อมูลชื่อสะกด และหมายเลขนี้เพื่อทำรายงานออกเอกสิทธิ์</p>
            </div>
 
            <button
              onClick={handleBackToAdmin}
              className="w-full bg-brand-crimson hover:bg-brand-dark-red text-white py-3 rounded-xl transition duration-200 text-xs font-semibold uppercase tracking-wider cursor-pointer shadow-sm shadow-brand-crimson/10"
            >
              กลับสู่ระบบส่วนบริหารจัดการสิทธิ์
            </button>
          </div>
        </div>
      );
    }
  }

  // Admin and Directory Display
  return (
    <div className="min-h-screen bg-slate-50/50">
      
      {/* Toast Alert representing sheets syncing failures */}
      {syncError && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 animate-bounce" />
          <span>{syncError}</span>
          <button 
            onClick={() => setSyncError(null)}
            className="ml-4 underline cursor-pointer text-amber-950 hover:text-amber-800"
          >
            ฉันรับทราบ / ซ่อนปิด
          </button>
        </div>
      )}

      <AdminView
        customers={combinedCustomers}
        onAddCustomer={handleAddManualCustomer}
        onSelectCustomer={handleSelectCustomer}
        syncFromSheet={syncFromSheet}
        isSyncing={isSyncing}
        sheetSyncedCount={syncedCount}
      />
    </div>
  );
}
