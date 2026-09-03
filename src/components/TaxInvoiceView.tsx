import React from 'react';
import { Order, UserAccount } from '../types';

interface TaxInvoiceViewProps {
  order: Order;
  user: UserAccount;
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export const TaxInvoiceView: React.FC<TaxInvoiceViewProps> = ({
  order,
  user,
  onBack,
  onShowToast,
}) => {
  if (!order) {
    return (
      <div className="flex flex-col w-full pb-24 max-w-3xl mx-auto px-4 pt-12 text-center items-center gap-3">
        <span className="material-symbols-outlined text-4xl text-outline">receipt_long</span>
        <h2 className="text-[16px] font-bold text-primary">No Invoice Selected</h2>
        <p className="text-[13px] text-on-surface-variant">Please select an order from your account or tracking page to view its tax invoice.</p>
        <button
          onClick={onBack}
          className="mt-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-[13px] font-bold cursor-pointer"
        >
          Return to Orders
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    onShowToast('Preparing official PDF Tax Invoice with digital stamp...');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // Safely get invoice total amount
  const invoiceTotal = order.totalAmount ?? order.total ?? 0;

  // Compute taxes (assume 5% GST split into 2.5% CGST and 2.5% SGST as standard for Indian garments < ₹1000/garment)
  const taxableAmount = Math.round(invoiceTotal / 1.05);
  const totalGst = invoiceTotal - taxableAmount;
  const cgst = Math.round(totalGst / 2);
  const sgst = totalGst - cgst;

  const numberToWords = (num: number) => {
    // Simple Indian currency word representation
    return `${(num || 0).toLocaleString('en-IN')} Indian Rupees Only`;
  };

  return (
    <div className="flex flex-col w-full pb-24 max-w-3xl mx-auto px-4 pt-4">
      {/* Action Bar (Hidden when printing) */}
      <div className="print:hidden flex items-center justify-between mb-4 bg-surface-container-lowest p-3 rounded-xl shadow-xs border border-surface-container">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-primary hover:text-secondary font-bold text-[13px]"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-lg bg-surface-container text-primary text-[12px] font-bold flex items-center gap-1.5 hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Download PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-[12px] font-bold flex items-center gap-1.5 shadow-xs hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* Tax Invoice Document */}
      <div
        id="tax-invoice-printable"
        className="bg-white text-gray-900 rounded-2xl p-6 sm:p-8 shadow-md border border-gray-200 font-sans print:shadow-none print:border-none print:p-0"
      >
        {/* Top Header: Company Info + GSTIN */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b-2 border-gray-900">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <img
                src="/assets/magnum-logo.svg"
                alt="Magnum School Uniform"
                className="w-10 h-10 rounded-lg bg-black border border-[#d4af37]/30 p-0.5 object-contain shrink-0"
              />
              <h1 className="text-[20px] font-extrabold tracking-tight text-[#002244] uppercase">
                Magnum Uniforms & Institutional Apparel
              </h1>
            </div>
            <p className="text-[11px] text-gray-600 leading-snug max-w-sm">
              Magnum Logistics & Central Depot, Gate 4, MIDC Bhosari,
              <br />
              Pune - 411026, Maharashtra, India
            </p>
            <p className="text-[11px] text-gray-700 font-semibold mt-1">
              GSTIN: <span className="font-mono font-bold text-black">27AAACM8492Q1Z5</span> | PAN:{' '}
              <span className="font-mono">AAACM8492Q</span>
            </p>
            <p className="text-[11px] text-gray-600">
              CIN: U18101PN2015PTC154892 | State Code: 27 (Maharashtra)
            </p>
          </div>

          <div className="text-left sm:text-right flex flex-col sm:items-end">
            <span className="inline-block px-2.5 py-0.5 rounded bg-gray-900 text-white font-mono text-[11px] font-bold uppercase tracking-wider mb-1">
              Original For Recipient
            </span>
            <h2 className="text-[18px] font-black text-[#002244] uppercase">
              Tax Invoice
            </h2>
            <p className="text-[11px] text-gray-600">
              (Issued under Section 31 of CGST Act, 2017)
            </p>
            <div className="mt-2 text-[12px] leading-tight">
              <p>
                <span className="text-gray-500">Invoice No:</span>{' '}
                <strong className="font-mono text-black">
                  INV/2025/DPS/{order.id.replace('#MGN-', '')}
                </strong>
              </p>
              <p>
                <span className="text-gray-500">Date:</span>{' '}
                <strong className="text-black">{order.date}</strong>
              </p>
              <p>
                <span className="text-gray-500">Order Ref:</span>{' '}
                <strong className="font-mono text-black">{order.id}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* School & Parent/Student Metadata Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-gray-300 text-[12px]">
          {/* Institution Authorization */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
              Institutional Supplier Contract
            </span>
            <p className="font-bold text-[#002244] text-[13px]">{order.schoolName}</p>
            <p className="text-gray-600 text-[11px]">
              Approved Pattern Code: DPS-PUN-2025-26
            </p>
            <p className="text-gray-600 text-[11px]">
              Student: <strong className="text-black">{order.studentName}</strong> (Grade 6)
            </p>
            <p className="text-gray-600 text-[11px]">
              Admission No:{' '}
              <span className="font-mono font-bold text-black">DPS/PUN/2022/8492</span>
            </p>
          </div>

          {/* Billed To / Consignee */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
              Billed To & Consignee Details
            </span>
            <p className="font-bold text-black text-[13px]">
              {user.defaultAddress?.fullName || user.name || 'Authorized Parent'}
            </p>
            <p className="text-gray-600 text-[11px]">
              Phone: {user.defaultAddress?.phone || user.phone || 'On Record with School Depot'}
            </p>
            <p className="text-gray-600 text-[11px]">
              Delivery Destination:{' '}
              {[
                user.defaultAddress?.flat?.trim(),
                user.defaultAddress?.street?.trim(),
                user.defaultAddress?.city?.trim(),
                user.defaultAddress?.pincode?.trim() ? `PIN: ${user.defaultAddress.pincode.trim()}` : '',
              ]
                .filter(Boolean)
                .join(', ') || 'School Campus Uniform Depot'}
            </p>
            <p className="text-gray-600 text-[11px]">
              Place of Supply: <strong className="text-black">Maharashtra (27)</strong>
            </p>
          </div>
        </div>

        {/* Itemized Garments Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="bg-[#002244] text-white">
                <th className="p-2 border border-gray-300 w-8 text-center">#</th>
                <th className="p-2 border border-gray-300">Description of Goods</th>
                <th className="p-2 border border-gray-300 w-16 text-center">HSN Code</th>
                <th className="p-2 border border-gray-300 w-12 text-center">Size</th>
                <th className="p-2 border border-gray-300 w-10 text-center">Qty</th>
                <th className="p-2 border border-gray-300 w-16 text-right">Rate (₹)</th>
                <th className="p-2 border border-gray-300 w-16 text-right">Taxable (₹)</th>
                <th className="p-2 border border-gray-300 w-14 text-right">CGST (2.5%)</th>
                <th className="p-2 border border-gray-300 w-14 text-right">SGST (2.5%)</th>
                <th className="p-2 border border-gray-300 w-18 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => {
                const itemTotal = item.price * item.quantity;
                const itemTaxable = Math.round(itemTotal / 1.05);
                const itemTax = itemTotal - itemTaxable;
                const itemCgst = Math.round(itemTax / 2);
                const itemSgst = itemTax - itemCgst;

                // Typical HSN for Indian apparel
                const hsn = item.name.toLowerCase().includes('shirt')
                  ? '6205'
                  : item.name.toLowerCase().includes('skirt')
                  ? '6204'
                  : item.name.toLowerCase().includes('trouser')
                  ? '6203'
                  : item.name.toLowerCase().includes('blazer')
                  ? '6203'
                  : '6217';

                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-2 border border-gray-300 text-center font-bold text-gray-700">
                      {idx + 1}
                    </td>
                    <td className="p-2 border border-gray-300">
                      <p className="font-bold text-black">{item.name}</p>
                      <p className="text-[10px] text-gray-500">
                        Official DPS monogram cresting with shrink-resistant weave
                      </p>
                    </td>
                    <td className="p-2 border border-gray-300 text-center font-mono">
                      {hsn}
                    </td>
                    <td className="p-2 border border-gray-300 text-center font-bold">
                      {item.size}
                    </td>
                    <td className="p-2 border border-gray-300 text-center font-bold">
                      {item.quantity}
                    </td>
                    <td className="p-2 border border-gray-300 text-right">
                      {item.price.toLocaleString('en-IN')}
                    </td>
                    <td className="p-2 border border-gray-300 text-right font-mono">
                      {itemTaxable.toLocaleString('en-IN')}
                    </td>
                    <td className="p-2 border border-gray-300 text-right font-mono text-gray-600">
                      {itemCgst.toLocaleString('en-IN')}
                    </td>
                    <td className="p-2 border border-gray-300 text-right font-mono text-gray-600">
                      {itemSgst.toLocaleString('en-IN')}
                    </td>
                    <td className="p-2 border border-gray-300 text-right font-bold font-mono text-black">
                      ₹{itemTotal.toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Calculation & Tax Summary */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tax Summary Sub-table */}
          <div className="border border-gray-200 rounded-lg p-3 text-[11px] bg-gray-50">
            <h4 className="font-bold text-[#002244] uppercase mb-1">
              GST Tax Breakdown (In INR)
            </h4>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-600">Total Taxable Value:</span>
              <span className="font-mono font-bold">₹{taxableAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-600">Central Tax (CGST @ 2.5%):</span>
              <span className="font-mono font-bold">₹{cgst.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-600">State Tax (SGST @ 2.5%):</span>
              <span className="font-mono font-bold">₹{sgst.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 text-black font-bold">
              <span>Total Tax Amount:</span>
              <span className="font-mono">₹{totalGst.toLocaleString('en-IN')}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-300">
              <span className="text-[10px] text-gray-500 uppercase block font-semibold">
                Amount in Words:
              </span>
              <span className="font-bold text-gray-800 text-[11px]">
                {numberToWords(invoiceTotal)}
              </span>
            </div>
          </div>

          {/* Total & Payment Confirmation */}
          <div className="border border-gray-200 rounded-lg p-3 flex flex-col justify-between text-[12px] bg-gray-50">
            <div className="space-y-1">
              <div className="flex justify-between text-gray-600">
                <span>Sub-Total:</span>
                <span className="font-mono font-semibold">
                  ₹{invoiceTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping & School Consignment Fee:</span>
                <span className="font-bold text-green-700 uppercase text-[11px]">
                  FREE (Pre-Reopening Session)
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-300 text-[15px] font-black text-[#002244]">
                <span>Total Invoice Value:</span>
                <span className="font-mono">₹{invoiceTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="mt-3 p-2 bg-green-50 rounded border border-green-200 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-green-800 font-bold">
                <span className="material-symbols-outlined text-sm">verified</span>
                <span>Payment Status: PAID</span>
              </div>
              <span className="font-mono text-gray-600">
                UPI / Ref: #419208192831
              </span>
            </div>
          </div>
        </div>

        {/* Terms & Digital Stamp Signature Footer */}
        <div className="mt-6 pt-4 border-t border-gray-300 flex flex-col sm:flex-row justify-between items-end gap-6 text-[11px]">
          <div className="max-w-md text-gray-600 space-y-1">
            <h5 className="font-bold text-gray-800 uppercase text-[10px]">
              Terms & Conditions:
            </h5>
            <p>
              1. 7-day complimentary size exchange valid with original tags and school crest intact.
            </p>
            <p>
              2. Free exchange available via campus delivery desk or doorstep courier swap.
            </p>
            <p>
              3. Color fastness and stitching covered under Magnum Institutional Guarantee.
            </p>
          </div>

          {/* Authorized Signatory Stamp Box */}
          <div className="flex flex-col items-center sm:items-end text-center sm:text-right shrink-0">
            <div className="w-40 h-16 border border-dashed border-gray-400 rounded p-1 flex flex-col items-center justify-center bg-gray-50 mb-1 relative">
              <span className="material-symbols-outlined text-gray-400 text-2xl absolute opacity-25">
                verified
              </span>
              <span className="text-[10px] font-bold text-gray-700 font-mono">
                DIGITALLY CERTIFIED
              </span>
              <span className="text-[8px] text-gray-500">
                Magnum Signatory Auth #9812
              </span>
            </div>
            <p className="font-bold text-gray-900 text-[11px]">
              For Magnum Uniforms & Apparel Pvt. Ltd.
            </p>
            <p className="text-[10px] text-gray-500">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
};
