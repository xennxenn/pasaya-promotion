/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Customer {
  date: string;
  name: string;
  phone: string;
  cleanPhone: string;
  amount: string;
  promoRaw: string;
  promoType: "จองโปร" | "จองโปรพร้อมมอเตอร์";
  salesperson: string;
}

export interface PromoConditions {
  [key: string]: string[];
}
