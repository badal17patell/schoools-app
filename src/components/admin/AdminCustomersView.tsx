import React from 'react';
import { Users, Mail, Phone, ShoppingCart } from 'lucide-react';
import { Order, UserAccount } from '../../types';

interface AdminCustomersViewProps {
  orders: Order[];
}

export const AdminCustomersView: React.FC<AdminCustomersViewProps> = ({ orders }) => {
  return (
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
};
