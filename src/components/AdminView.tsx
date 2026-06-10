/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import QRCode from "qrcode";
import { 
  Users, Search, UserPlus, QrCode, Image as ImageIcon, Sparkles, Copy, Check, X,
  RefreshCw, Info, AlertCircle, Plus, ChevronRight, ExternalLink
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
      const qrDataUrl = await QRCode.toDataURL(targetUrl, {
        width: 250,
        margin: 2,
        color: {
          dark: "#7C1014", // Brand crimson
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
      setFormError("กรุณากรอกเบอร์โทรศัพท์ของคู่ค้าที่ถูกต้อง");
      return;
    }

    const duplicate = customers.find(c => c.cleanPhone === clean);
    if (duplicate) {
      setFormError(`เบอร์โทรศัพท์นี้ลงทะเบียนร่วมกับสิทธิ์ของคุณ ${duplicate.name} เรียบร้อยแล้ว`);
      return;
    }

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
    
    setFormName("");
    setFormPhone("");
    setFormAmount("5,000");
    setFormPromo("จองโปร");
    setFormSalesperson("");
    setShowAddForm(false);
  };

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
      
      {/* Brand Luxury Header Panel */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-neutral-100 mb-8 transition-shadow duration-300 hover:shadow-lg">
        <div className="p-6 sm:p-10 bg-gradient-to-br from-brand-charcoal via-[#231A18] to-brand-charcoal text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative overflow-hidden">
          {/* Subtle gold decoration background circle */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-gold/5 rounded-full filter blur-[120px] pointer-events-none"></div>
          
          <div className="space-y-3 relative z-10">
            <div className="flex items-center gap-3">
              <span className="bg-brand-gold/10 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-widest backdrop-blur-md border border-brand-gold/20 text-brand-gold">
                PASAYA CONCIERGE UTILITY
              </span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-white tracking-wide mt-2">
              โปรโมชั่นงานบ้านและสวน
            </h1>
            <p className="text-neutral-400 text-xs sm:text-sm font-light max-w-xl leading-relaxed">
              เครื่องมือจัดการและออกเอกสารยืนยันสิทธิพิเศษและรายงานโควตาแบบ เรียลไทม์ (E-Certificate Handbill Spec) มหกรรมงานบ้านและสวน สำหรับลูกค้าแบรนด์ผ้าม่านสั่งตัดเครือ PASAYA
            </p>
          </div>

          <div className="flex gap-4 self-stretch md:self-auto justify-between sm:justify-end items-center relative z-10">
            {/* Total Registered client metric */}
            <div className="bg-white/5 p-4 rounded-xl text-center backdrop-blur-md border border-white/5 min-w-[130px] shadow-sm">
              <p className="text-neutral-400 text-[9px] font-medium tracking-widest uppercase">ลูกค้าจองสิทธิ์</p>
              <p className="text-3xl font-serif font-bold text-brand-gold mt-1">{customers.length}</p>
            </div>
            
            {/* Google sheet direct synchronizer rate */}
            <div className="bg-brand-gold/5 p-4 rounded-xl text-center backdrop-blur-md border border-brand-gold/10 min-w-[130px] shadow-sm">
              <p className="text-brand-gold/80 text-[9px] font-medium tracking-widest uppercase">ซิงค์ชีทล่าสุด</p>
              <p className="text-3xl font-serif font-bold text-white mt-1">{sheetSyncedCount}</p>
            </div>
          </div>
        </div>

        {/* Sync Controls & Guidance Information Bar */}
        <div className="px-6 py-4 bg-neutral-50/50 border-t border-neutral-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center text-xs text-neutral-500 font-light">
            <Info className="w-4 h-4 text-brand-gold mr-2.5 flex-shrink-0" />
            ตารางข้อมูลเชื่อมโยงกับฐานข้อมูลโควตาจองของบูธ PASAYA อัตโนมัติในเครือข่ายความปลอดภัยสูง
          </div>

          <div className="flex gap-2">
            <button
              onClick={syncFromSheet}
              disabled={isSyncing}
              className="bg-white hover:bg-neutral-50 active:scale-[0.98] text-neutral-700 font-medium text-xs py-2.5 px-4 rounded-xl shadow-xs border border-neutral-200/80 flex items-center transition duration-200 cursor-pointer disabled:opacity-70"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-2 text-brand-crimson ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "กำลังดาวน์โหลดเอกสารจอง..." : "ดึงข้อมูลจาก Google Sheet"}
            </button>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-brand-crimson hover:bg-brand-dark-red active:scale-[0.98] text-white font-medium text-xs py-2.5 px-4 rounded-xl shadow-xs flex items-center transition duration-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              {showAddForm ? "ซ่อนแบบฟอร์มลงทะเบียน" : "ลงทะเบียนจองสิทธิ์ Manual หน้าร้าน"}
            </button>
          </div>
        </div>
      </div>

      {/* Manual Addition Form section structured like an official ledger entry */}
      {showAddForm && (
        <div className="bg-brand-light-gold/30 border border-brand-gold/25 rounded-2xl p-6 mb-8 shadow-inner animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b border-brand-gold/15">
            <div className="bg-brand-gold/15 text-brand-dark-gold p-2 rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-semibold text-brand-charcoal">บันทึกสิทธิ์ลูกค้าเพิ่มเติม (Concierge Entry)</h3>
              <p className="text-xs text-neutral-400 font-light mt-0.5">ใช้ในกรณีลงทะเบียนลูกค้าเข้ารับข้อเสนอพิเศษที่บูธ โดยยังไม่อยู่ในสารบบตารางหลัก</p>
            </div>
          </div>

          <form onSubmit={handleAddSubmit} className="space-y-4">
            {formError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-800 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-650 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">ชื่อ-นามสกุลลูกค้าคู่สัญญา <span className="text-brand-crimson">*</span></label>
                <input
                  type="text"
                  placeholder="เช่น คุณ ชุตินันท์ สิทธิพงศ์"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-gold focus:border-brand-gold outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">เบอร์ติดต่อสำคัญในการจองสิทธิ์ <span className="text-brand-crimson">*</span></label>
                <input
                  type="text"
                  placeholder="เช่น 0812345678"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-gold focus:border-brand-gold outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">ยอดมัดจำสัญญาสั่งทำ (บาท)</label>
                <select
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-gold focus:border-brand-gold outline-none transition"
                >
                  <option value="5,000">5,000 บาท</option>
                  <option value="10,000">10,000 บาท</option>
                  <option value="15,000">15,000 บาท</option>
                  <option value="20,000">20,000 บาท</option>
                  <option value="30,000">30,000 บาท</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">โมเดลสิทธิพิเศษผ้าม่าน</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormPromo("จองโปร")}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border transition duration-200 ${
                      formPromo === "จองโปร"
                        ? "bg-brand-crimson text-white border-brand-crimson shadow-xs"
                        : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    เอกสิทธิ์แบบจองโปรปกติ
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPromo("จองโปรพร้อมมอเตอร์")}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border transition duration-200 ${
                      formPromo === "จองโปรพร้อมมอเตอร์"
                        ? "bg-brand-crimson text-white border-brand-crimson shadow-xs"
                        : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    โปรพร้อมมอเตอร์ Somfy 50%
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">พนักงานจองสิทธิ์ประจำบูธ</label>
                <input
                  type="text"
                  placeholder="เช่น ส้มส้ม PASAYA"
                  value={formSalesperson}
                  onChange={(e) => setFormSalesperson(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs focus:ring-1 focus:ring-brand-gold focus:border-brand-gold outline-none transition pointer-events-auto"
                />
              </div>

              <div className="flex items-end pt-1">
                <button
                  type="submit"
                  className="w-full bg-brand-crimson hover:bg-brand-dark-red active:scale-[0.98] text-white py-2.5 px-4 rounded-xl font-semibold text-xs tracking-wide shadow-xs transition duration-200 cursor-pointer"
                >
                  ลงทะเบียนสัญญาจองสิทธิ์ลูกค้าใหม่
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Directory Search and Records Ledger Table */}
      <div className="bg-white rounded-2xl shadow-md border border-neutral-100 overflow-hidden">
        
        {/* Search filter toolbar */}
        <div className="p-6 border-b border-neutral-100 bg-neutral-50/20 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="ค้นหารายชื่อคู่ค้า หรือเบอร์โทรศัพท์ประจำสิทธิ์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 focus:ring-1 focus:ring-brand-gold focus:border-brand-gold outline-none rounded-xl text-xs transition duration-200"
            />
          </div>

          <div className="text-[11px] text-neutral-400 font-medium tracking-wide">
            {searchQuery ? `ค้นพบผู้ถือครองเอกสิทธิ์ ${filteredCustomers.length} รายการ` : `บันทึกสิทธิ์ลูกค้าทั้งหมด ${filteredCustomers.length} รายการ`}
          </div>
        </div>

        {/* Directory Listing Table */}
        {filteredCustomers.length === 0 ? (
          <div className="p-16 text-center text-neutral-400 flex flex-col items-center justify-center">
            <ImageIcon className="w-10 h-10 text-neutral-200 mb-3" />
            <p className="text-xs font-semibold text-neutral-500">ไม่พบบันทึกข้อมูลคู่ค้าหรือผู้จองเบอร์รายชื่อดังกล่าว</p>
            <p className="text-[11px] text-neutral-400 mt-0.5">ลองกรองชื่อสะกด หรือเปิดฟอร์มด้านบนเขียนบันทึกด้วยระบบ Manual</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50/50 border-b border-neutral-100 text-neutral-500 font-medium text-[10px] sm:text-xs tracking-wider uppercase">
                  <th className="p-4 pl-6 font-semibold">วันที่รับจอง</th>
                  <th className="p-4 font-semibold">ชื่อ-นามสกุลคู่สัญญากิตติมศักดิ์</th>
                  <th className="p-4 font-semibold">หมายเลขรับสิทธิ์</th>
                  <th className="p-4 font-semibold">เอกสิทธิ์การรับโปรฯ</th>
                  <th className="p-4 text-right font-semibold">วงเงินวางจองสิทธิ์</th>
                  <th className="p-4 text-center pr-6 font-semibold">เครื่องมือออกใบยืนยันสิทธิ์</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100/60">
                {filteredCustomers.map((customer, index) => (
                  <tr key={index} className="hover:bg-brand-light-gold/15 transition-colors group">
                    <td className="p-4 pl-6 text-xs text-neutral-400 font-mono">{customer.date}</td>
                    <td className="p-4 font-semibold text-brand-charcoal text-xs sm:text-sm group-hover:text-brand-crimson transition-colors">
                      {customer.name}
                    </td>
                    <td className="p-4 text-neutral-500 text-xs font-mono">{customer.phone}</td>
                    <td className="p-4 text-xs font-semibold">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-medium tracking-wide uppercase ${
                        customer.promoType === "จองโปรพร้อมมอเตอร์"
                          ? "bg-brand-gold/10 text-brand-dark-gold border border-brand-gold/15"
                          : "bg-brand-crimson/5 text-brand-crimson border border-brand-crimson/10"
                      }`}>
                        {customer.promoType}
                      </span>
                    </td>
                    <td className="p-4 text-xs sm:text-sm font-semibold text-right text-brand-crimson font-serif">
                      {customer.amount} <span className="text-[10px] text-neutral-400 font-normal">THB</span>
                    </td>
                    <td className="p-4 text-center pr-6">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => handleOpenQRModal(customer.cleanPhone, customer.name)}
                          className="bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-600 py-1.5 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition duration-150 cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5 text-neutral-400 group-hover:text-brand-crimson transition-colors" />
                          ลิงก์ใบยืนยันสิทธิ์ / QR
                        </button>

                        <button
                          onClick={() => onSelectCustomer(customer.cleanPhone)}
                          className="bg-brand-crimson hover:bg-brand-dark-red text-white py-1.5 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition duration-150 cursor-pointer shadow-xs"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          เปิดหน้าเอกสารสิทธิ์
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

      {/* Elegant Concierge QR Code Generation Drawer/Modal */}
      {modalCustomer && (
        <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md transform scale-100 animate-in zoom-in-95 duration-200 border border-neutral-150">
            
            {/* Header close cross controls */}
            <div className="flex justify-between items-center mb-4 border-b pb-3 border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="bg-brand-gold/10 p-1.5 rounded-lg text-brand-dark-gold">
                  <QrCode className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-serif font-semibold text-brand-charcoal">ส่งมอบรหัสจองและลิงก์เอกสารสิทธิ์</h3>
              </div>
              <button 
                onClick={handleCloseQRModal}
                className="text-neutral-400 hover:text-neutral-600 transition p-1.5 rounded-lg hover:bg-neutral-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selected user details */}
            <div className="text-center bg-brand-light-gold/40 p-4 rounded-xl mb-4 border border-brand-gold/15">
              <p className="text-[8px] text-brand-dark-gold font-medium uppercase tracking-widest leading-none">เจ้าของเอกสิทธิ์ผู้ลงทะเบียน</p>
              <p className="text-base font-semibold text-brand-charcoal mt-1.5">{modalCustomer.name}</p>
            </div>

            <p className="text-[10px] text-brand-dark-gold text-center mb-4 leading-normal bg-brand-light-gold/30 p-3 rounded-xl border border-brand-gold/10 font-normal">
              สแกนโค้ด QR ด้านล่างด้วยโทรศัพท์มือถือ เพื่อออกใบยืนยันสิทธิพิเศษของลูกค้าโดยตรง หรือคัดลอกส่วนลิงก์ URL คู่อภิสิทธิ์ส่งไปทาง LINE/SMS
            </p>

            {/* Generated QR Canvas container showcase */}
            <div className="flex justify-center p-4 bg-neutral-55 rounded-xl border border-neutral-100 mb-4 shadow-inner">
              {qrCodeUrl ? (
                <div className="p-2.5 bg-white rounded-lg shadow-sm border border-neutral-150/50">
                  <img src={qrCodeUrl} alt="QR Code" className="w-[170px] h-[170px]" />
                </div>
              ) : (
                <div className="w-[170px] h-[170px] flex items-center justify-center text-neutral-400">
                  <RefreshCw className="animate-spin" />
                </div>
              )}
            </div>

            {/* copy dynamic sharing frame links */}
            <div className="space-y-2">
              <div className="flex items-center gap-1 justify-start text-[10px] text-neutral-400 font-medium tracking-wide">
                ลิงก์เข้าชมเอกสารสิทธิ์แบบ Interactive
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentArtworkUrl()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="flex-1 bg-neutral-50 border border-neutral-200 text-neutral-500 text-xs rounded-xl px-3 py-2.5 outline-none font-mono text-[10.5px]"
                />
                
                <button
                  onClick={handleCopyLink}
                  className={`px-3.5 rounded-xl flex items-center justify-center transition-all border duration-150 ${
                    copiedLink
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-brand-crimson hover:bg-brand-dark-red border-brand-crimson text-white active:scale-95 cursor-pointer shadow-xs"
                  }`}
                  title="คัดลอกคีย์ลิงก์"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex gap-2 mt-5 pt-2">
                <button
                  onClick={handleCloseQRModal}
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-2.5 rounded-xl text-xs font-medium transition duration-150 cursor-pointer"
                >
                  ปิดหน้าต่างย่อย
                </button>
                <button
                  onClick={() => {
                    onSelectCustomer(modalCustomer.phone);
                    handleCloseQRModal();
                  }}
                  className="flex-1 bg-brand-crimson hover:bg-brand-dark-red text-white py-2.5 rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  เปิดประเมินเอกสารสิทธิ์
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
