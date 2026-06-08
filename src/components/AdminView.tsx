/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { 
  Users, Search, UserPlus, QrCode, Image as ImageIcon, Sparkles, Copy, Check, X,
  BadgeCent, Landmark, RefreshCw, Layers, ExternalLink, Calendar, Plus, ChevronRight, Info, AlertCircle
} from "lucide-react";
import { Customer } from "../types";

interface AdminViewProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  onSelectCustomer: (phone: string) => void;
  syncFromSheet: () => void;
  isSyncing: boolean;
  sheetSyncedCount: number;
}

export default function AdminView({ 
  customers, 
  onAddCustomer, 
  onSelectCustomer, 
  syncFromSheet, 
  isSyncing,
  sheetSyncedCount
}: AdminViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalCustomer, setModalCustomer] = useState<{ phone: string; name: string } | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Form states for manual registration addition
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAmount, setFormAmount] = useState("5,000");
  const [formPromo, setFormPromo] = useState<"จองโปร" | "จองโปรพร้อมมอเตอร์">("จองโปร");
  const [formSalesperson, setFormSalesperson] = useState("");
  const [formError, setFormError] = useState("");

  const getCustomerShareUrl = (phone: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const customer = customers.find(c => c.cleanPhone === phone);
    const params = new URLSearchParams();
    params.set("phone", phone);
    if (customer) {
      params.set("name", customer.name);
      params.set("amount", customer.amount);
      params.set("promoType", customer.promoType);
      params.set("salesperson", customer.salesperson || "");
      params.set("date", customer.date);
    }
    return `${baseUrl}?${params.toString()}`;
  };

  const handleOpenQRModal = async (phone: string, name: string) => {
    setModalCustomer({ phone, name });
    
    const targetUrl = getCustomerShareUrl(phone);
    
    try {
      // Generate clean QR code using the module
      const qrDataUrl = await QRCode.toDataURL(targetUrl, {
        width: 250,
        margin: 2,
        color: {
          dark: "#7a1215", // Deep PASAYA Red
          light: "#ffffff"
        },
        errorCorrectionLevel: "H"
      });
      setQrCodeUrl(qrDataUrl);
    } catch (err) {
      console.error("QR Code Generation failed", err);
    }
  };

  const handleCloseQRModal = () => {
    setModalCustomer(null);
    setQrCodeUrl("");
    setCopiedLink(false);
  };

  const handleCopyLink = () => {
    if (!modalCustomer) return;
    const targetUrl = getCustomerShareUrl(modalCustomer.phone);
    
    navigator.clipboard.writeText(targetUrl);
    setCopiedLink(true);
    setTimeout(() => {
      setCopiedLink(false);
    }, 2000);
  };

  const currentArtworkUrl = () => {
    if (!modalCustomer) return "";
    return getCustomerShareUrl(modalCustomer.phone);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formName.trim()) {
      setFormError("กรุณากรอกชื่อ-นามสกุลลูกค้า");
      return;
    }
    if (!formPhone.trim()) {
      setFormError("กรุณากรอกเบอร์โทรศัพท์");
      return;
    }

    const clean = formPhone.replace(/[\s-]/g, "");
    if (clean.length < 9) {
      setFormError("กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (เช่น 0812345678)");
      return;
    }

    // Check if phone number already exists
    const duplicate = customers.find(c => c.cleanPhone === clean);
    if (duplicate) {
      setFormError(`เบอร์โทรศัพท์นี้ถูกใช้งานแล้วโดยคุณ ${duplicate.name}`);
      return;
    }

    // Capture localized Bangkok date
    const today = new Date();
    const formattedDate = today.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });

    const newCustomer: Customer = {
      date: formattedDate,
      name: formName.trim(),
      phone: formPhone.trim(),
      cleanPhone: clean,
      amount: Number(formAmount.replace(/,/g, "")).toLocaleString("th-TH"),
      promoRaw: "Manual registration",
      promoType: formPromo,
      salesperson: formSalesperson.trim() || "พนักงานสาขา"
    };

    onAddCustomer(newCustomer);
    
    // Reset form states
    setFormName("");
    setFormPhone("");
    setFormAmount("5,000");
    setFormPromo("จองโปร");
    setFormSalesperson("");
    setShowAddForm(false);
  };

  // Filter list matching search query (name or phone)
  const filteredCustomers = customers.filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.phone.includes(query) ||
      c.cleanPhone.includes(query)
    );
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* Brand Header & Quick Metrics Visualizer */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-8 transition-all hover:shadow-2xl">
        <div className="p-6 sm:p-8 bg-gradient-to-br from-[#7a1215] via-[#630b0e] to-[#4c0507] text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm border border-white/20 text-red-200">
                PASAYA Official Utility
              </span>
              <span className="animate-pulse flex h-2 w-2 rounded-full bg-emerald-400"></span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center leading-tight">
              <Sparkles className="mr-3 text-amber-400 w-8 h-8 fill-amber-400/20" />
              โปรโมชั่นงานบ้านและสวน
            </h1>
            <p className="text-red-100/85 text-xs sm:text-sm font-medium tracking-wide">
              ระบบออก Artwork ยืนยันสิทธิ์โปรโมชั่นและโควตาของสัมนาผ้าม่าน - ณ อิมแพ็ค เมืองทองธานี
            </p>
          </div>

          <div className="flex gap-4 self-stretch md:self-auto justify-between sm:justify-end items-center">
            {/* Total metric box */}
            <div className="bg-white/10 p-4 rounded-2xl text-center backdrop-blur-sm border border-white/10 min-w-[120px] shadow-inner">
              <p className="text-red-200 text-xs font-bold tracking-wider uppercase">ลูกค้าทั้งหมด</p>
              <p className="text-3xl font-black text-white mt-1">{customers.length}</p>
            </div>
            
            {/* Sync rate indicator */}
            <div className="bg-amber-400/10 p-4 rounded-2xl text-center backdrop-blur-sm border border-amber-400/20 min-w-[120px]">
              <p className="text-amber-300 text-xs font-bold tracking-wider uppercase">จาก Google Sheets</p>
              <p className="text-3xl font-black text-amber-400 mt-1">{sheetSyncedCount}</p>
            </div>
          </div>
        </div>

        {/* Sync Controls & Dynamic Actions Toolbar */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center text-xs text-gray-500 font-medium">
            <Info className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
            ตารางนี้ซิงค์ข้อมูลกับบัตรจองจำเลยของบูธแบบเรียลไทม์
          </div>

          <div className="flex gap-2">
            <button
              onClick={syncFromSheet}
              disabled={isSyncing}
              className="bg-white hover:bg-gray-50 active:scale-[0.98] text-gray-700 font-semibold text-xs py-2 px-4 rounded-xl shadow-sm border border-gray-200/80 flex items-center transition cursor-pointer disabled:opacity-70"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-2 text-red-800 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "กำลังดึงข้อมูล..." : "ซิงค์จาก Google Sheet"}
            </button>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-red-800 hover:bg-red-900 active:scale-[0.98] text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-sm flex items-center transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              {showAddForm ? "ซ่อนกล่องเพิ่มลูกค้า" : "จองสิทธิ์ลูกค้าใหม่แบบ Manual"}
            </button>
          </div>
        </div>
      </div>

      {/* manual Addition Form section */}
      {showAddForm && (
        <div className="bg-gradient-to-r from-red-50/30 to-rose-50/30 border border-red-100 rounded-3xl p-6 mb-8 shadow-inner animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-red-100 text-red-800 p-1.5 rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">เพิ่มลูกค้าหน้าร้าน (Manual Booking)</h3>
              <p className="text-xs text-gray-500 mt-0.5">ใช้ในกรณีลูกค้าหน้างานยังไม่ได้จองในฟอร์มชีทปกติ</p>
            </div>
          </div>

          <form onSubmit={handleAddSubmit} className="space-y-4">
            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-650 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">ชื่อ-นามสกุลลูกค้า <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="เช่น คุณ จิตราภรณ์ มั่งมี"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-red-600 focus:border-red-600 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">เบอร์ติดต่อยืนยันสิทธิ์ <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="เช่น 0812345678"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-red-600 focus:border-red-600 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">ยอดเงินมัดจำ (บาท)</label>
                <select
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-red-600 focus:border-red-600 outline-none transition"
                >
                  <option value="5,000">5,000 บาท</option>
                  <option value="10,000">10,000 บาท</option>
                  <option value="15,000">15,000 บาท</option>
                  <option value="20,000">20,000 บาท</option>
                  <option value="30,000">30,000 บาท</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">ประเภทสิทธิ์โปรโมชั่น</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormPromo("จองโปร")}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                      formPromo === "จองโปร"
                        ? "bg-red-800 text-white border-red-800 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-55"
                    }`}
                  >
                    จองโปรผ้าม่านปกติ
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPromo("จองโปรพร้อมมอเตอร์")}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                      formPromo === "จองโปรพร้อมมอเตอร์"
                        ? "bg-red-800 text-white border-red-800 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-55"
                    }`}
                  >
                    จองโปรพร้อมมอเตอร์ 50%
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">พนักงานผู้จองสิทธิ์</label>
                <input
                  type="text"
                  placeholder="เช่น พี่หนึ่ง แบรนด์ม่าน"
                  value={formSalesperson}
                  onChange={(e) => setFormSalesperson(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-red-600 focus:border-red-600 outline-none transition"
                />
              </div>

              <div className="flex items-end pl-1 pt-1">
                <button
                  type="submit"
                  className="w-full bg-red-800 hover:bg-red-900 active:scale-[0.98] text-white py-2.5 px-4 rounded-xl font-bold text-sm tracking-wide shadow-md transition cursor-pointer"
                >
                  บันทึกสิทธิ์ลูกค้าใหม่
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Search Input Table Module Wrapper */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        
        {/* Search filter toolbar */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/40 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="ค้นหาชื่อลูกค้า, เบอร์โทรศัพท์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none rounded-xl text-sm transition"
            />
          </div>

          <div className="text-xs text-gray-400 font-bold self-center">
            {searchQuery ? `ค้นพบ ${filteredCustomers.length} รายการ` : `กำลังแสดงทั้งหมด ${filteredCustomers.length} รายการ`}
          </div>
        </div>

        {/* Primary Data List Grid/Table depending on device */}
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-200 mb-2" />
            <p className="text-sm font-semibold">ไม่พบข้อมูลลูกค้าที่ตรงกับคำค้นของคุณ</p>
            <p className="text-xs text-gray-400 mt-1">ลองเปลี่ยนแบบสะกด หรือเพิ่มลูกค้าแบบ Manual</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/50 border-b border-gray-200 text-gray-500 font-bold text-xs tracking-wider">
                  <th className="p-4 pl-6">วันที่จอง</th>
                  <th className="p-4">ชื่อ-นามสกุลลูกค้า</th>
                  <th className="p-4">เบอร์โทรศัพท์</th>
                  <th className="p-4">ประเภทสิทธิ์โปรฯ</th>
                  <th className="p-4 text-right">ยอดจอง (บาท)</th>
                  <th className="p-4 text-center pr-6">การส่งงาน / ตรวจสิทธิ์ Artwork</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((customer, index) => (
                  <tr key={index} className="hover:bg-red-50/20 transition group">
                    <td className="p-4 pl-6 text-xs text-gray-500 font-semibold">{customer.date}</td>
                    <td className="p-4 font-bold text-gray-800 text-sm group-hover:text-red-900 transition">
                      {customer.name}
                    </td>
                    <td className="p-4 text-gray-600 text-xs font-mono">{customer.phone}</td>
                    <td className="p-4 text-xs font-semibold">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        customer.promoType === "จองโปรพร้อมมอเตอร์"
                          ? "bg-amber-100 text-amber-900 border border-amber-200/50"
                          : "bg-red-50 text-red-900 border border-red-200/30"
                      }`}>
                        {customer.promoType}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-bold text-right text-red-900">
                      {customer.amount}
                    </td>
                    <td className="p-4 text-center pr-6">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => handleOpenQRModal(customer.cleanPhone, customer.name)}
                          className="bg-white hover:bg-gray-55 active:scale-[0.98] border border-gray-200 text-gray-700 py-1.5 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-sm transition hover:border-red-200 hover:text-red-900 cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5 text-gray-500 group-hover:text-red-800 transition" />
                          แชร์สิทธิ์ / สร้าง QR
                        </button>

                        <button
                          onClick={() => onSelectCustomer(customer.cleanPhone)}
                          className="bg-red-800 hover:bg-red-900 text-white py-1.5 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-sm transition hover:scale-[1.02] cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          ดู Artwork คู่ค้า
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sleek Custom QR Code Generation Drawer Modal */}
      {modalCustomer && (
        <div className="fixed inset-0 bg-gray-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md transform scale-100 animate-in zoom-in-95 duration-200 border border-gray-150">
            
            {/* Header close cross controls */}
            <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-100">
              <div className="flex items-center gap-2">
                <div className="bg-red-100 p-1.5 rounded-lg text-red-800">
                  <QrCode className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-800">แชร์สิทธิ์คู่ค้า / โควตาจอง</h3>
              </div>
              <button 
                onClick={handleCloseQRModal}
                className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selected user details */}
            <div className="text-center bg-red-50/50 p-3.5 rounded-2xl mb-4 border border-red-100/50">
              <p className="text-[10px] text-red-700 font-bold uppercase tracking-wider">โควตาสำหรับ</p>
              <p className="text-base font-extrabold text-red-950 mt-0.5">{modalCustomer.name}</p>
            </div>

            <p className="text-[11px] text-amber-800 text-center mb-3 bg-amber-50 p-3 rounded-xl border border-amber-200/50 leading-relaxed font-medium">
              * สแกน QR ตัวนี้ด้วยมือถือเพื่อดู Artwork หน้าร้าน และส่งให้ลูกค้าดาวน์โหลด บันทึกสิทธิ์ได้สะดวกรวดเร็ว
            </p>

            {/* Generated QR Canvas container showcase */}
            <div className="flex justify-center p-4 bg-gray-100/40 rounded-2xl border border-gray-100 mb-4 shadow-inner">
              {qrCodeUrl ? (
                <div className="p-3 bg-white rounded-xl shadow-md border border-gray-100">
                  <img src={qrCodeUrl} alt="QR Code" className="w-[180px] h-[180px]" />
                </div>
              ) : (
                <div className="w-[180px] h-[180px] flex items-center justify-center text-gray-400">
                  <RefreshCw className="animate-spin" />
                </div>
              )}
            </div>

            {/* copy dynamic sharing frame links */}
            <div className="space-y-2">
              <div className="flex items-center gap-1 justify-center text-[10px] text-gray-400 font-medium">
                ลิงก์ส่งมอบ Artwork
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentArtworkUrl()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="flex-1 bg-gray-100 border border-gray-200 text-gray-500 text-xs rounded-xl px-3 py-2.5 outline-none font-mono"
                />
                
                <button
                  onClick={handleCopyLink}
                  className={`px-3 rounded-xl flex items-center justify-center transition border-2 ${
                    copiedLink
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-red-800 hover:bg-red-900 border-red-800 text-white active:scale-95 cursor-pointer"
                  }`}
                  title="คัดลอกลิงก์"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex gap-2 mt-4 pt-2">
                <button
                  onClick={handleCloseQRModal}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  ปิดหน้าต่างนี้
                </button>
                <button
                  onClick={() => {
                    onSelectCustomer(modalCustomer.phone);
                    handleCloseQRModal();
                  }}
                  className="flex-1 bg-gradient-to-r from-red-850 to-rose-900 text-white py-2 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1 hover:brightness-110 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  เปิดดูหน้า Artwork
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
