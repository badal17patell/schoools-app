import React from 'react';
import { RefreshCw, Users, BarChart3, ShieldCheck, Settings } from 'lucide-react';
import { Order } from '../../types';

interface AdminCustomersViewProps {
  orders: Order[];
}

export const AdminCustomersView: React.FC<AdminCustomersViewProps> = ({ orders }) => (
  <div className="space-y-6">
    <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-xs">
      <h2 className="text-lg font-bold text-[#171717]">Institutional Customers</h2>
      <p className="text-xs text-zinc-500 mt-0.5">Parent and institutional account directory.</p>
    </div>

    <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden shadow-xs">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="bg-[#F8F6F0] border-b border-[#E5E5E5] text-zinc-500 uppercase font-bold text-[10px] tracking-wider">
            <th className="py-3 px-4">Customer Name</th>
            <th className="py-3 px-4">Phone</th>
            <th className="py-3 px-4">City</th>
            <th className="py-3 px-4">Orders Placed</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-[#F8F6F0]/40">
              <td className="py-3 px-4 font-bold text-[#171717]">{o.shippingAddress.fullName}</td>
              <td className="py-3 px-4 text-zinc-600">{o.shippingAddress.phone}</td>
              <td className="py-3 px-4 text-zinc-600">{o.shippingAddress.city}</td>
              <td className="py-3 px-4 font-semibold text-[#171717]">1 Order</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const AdminExchangesView: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-xs">
      <h2 className="text-lg font-bold text-[#171717]">Exchanges & Size Swaps</h2>
      <p className="text-xs text-zinc-500 mt-0.5">Manage garment size swap tickets and return processing.</p>
    </div>
    <div className="bg-white p-16 rounded-2xl border border-[#E5E5E5] text-center text-zinc-400">
      <RefreshCw size={40} className="mx-auto mb-3 text-zinc-300" />
      <p className="text-sm font-bold text-zinc-700">No active exchange requests.</p>
    </div>
  </div>
);

export const AdminReportsView: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-xs">
      <h2 className="text-lg font-bold text-[#171717]">Operations Reports & Analytics</h2>
      <p className="text-xs text-zinc-500 mt-0.5">Real-time financial and inventory reports.</p>
    </div>
    <div className="bg-white p-12 rounded-2xl border border-[#E5E5E5] text-center text-zinc-600">
      <p className="text-xs font-semibold">Authoritative reports generated from Firestore records.</p>
    </div>
  </div>
);

export const AdminTeamView: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-xs">
      <h2 className="text-lg font-bold text-[#171717]">Team & Roles Management</h2>
      <p className="text-xs text-zinc-500 mt-0.5">Master Tailor & Administrator permissions.</p>
    </div>
    <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5]">
      <p className="text-xs font-semibold text-zinc-800">Master Administrator: badal17patell@gmail.com</p>
      <p className="text-[11px] text-zinc-500 mt-1">Role: Super Admin (Full access to all institutional workspaces)</p>
    </div>
  </div>
);

export const AdminSettingsView: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-xs">
      <h2 className="text-lg font-bold text-[#171717]">Magnum Operations Settings</h2>
      <p className="text-xs text-zinc-500 mt-0.5">Configure institutional preferences and business rules.</p>
    </div>
    <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] space-y-4">
      <div>
        <p className="text-xs font-bold text-[#171717]">Business Name</p>
        <p className="text-xs text-zinc-600 mt-0.5">Magnum School Uniforms & Tailoring</p>
      </div>
      <div>
        <p className="text-xs font-bold text-[#171717]">Default Currency</p>
        <p className="text-xs text-zinc-600 mt-0.5">INR (₹)</p>
      </div>
    </div>
  </div>
);
