'use client';

import { useEffect, useState } from 'react';
import { getUserAddresses } from '@/services/address.service'; // Path import disesuaikan

interface Address {
  id: string;
  label: string;
  receiver: string;
  phone: string;
  address: string;
  province: string;
  city: string;
  district: string;
  isPrimary: boolean;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      const data = await getUserAddresses();
      setAddresses(data);
      setLoading(false);
    };
    fetchInitialData();
  }, []);

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Daftar Alamat</h1>
            <p className="text-xs md:text-sm text-gray-500">Kelola alamat pengiriman belanjaan online kamu</p>
          </div>
          <button className="w-full sm:w-auto px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition active:scale-95">
            + Tambah Alamat Baru
          </button>
        </div>

        {/* State Management */}
        {loading ? (
          <div className="text-center py-8 text-sm text-gray-500 animate-pulse">
            Memuat data alamat dari server...
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500">Kamu belum memiliki alamat pengiriman.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {addresses.map((addr) => (
              <div 
                key={addr.id} 
                className={`p-4 md:p-5 bg-white rounded-xl shadow-sm border transition-all ${
                  addr.isPrimary ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-sm md:text-base text-gray-800">{addr.label}</span>
                  {addr.isPrimary && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] md:text-xs font-semibold rounded">
                      Utama
                    </span>
                  )}
                </div>
                
                <p className="text-sm font-medium text-gray-950 mb-0.5">{addr.receiver}</p>
                <p className="text-xs md:text-sm text-gray-500 mb-2">{addr.phone}</p>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  {addr.address}, Kec. {addr.district}, {addr.city}, {addr.province}
                </p>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 mt-4 border-t pt-3 border-gray-100 text-xs md:text-sm font-medium">
                  {!addr.isPrimary && (
                    <button className="text-green-600 hover:text-green-700 active:underline">
                      Atur Jadi Utama
                    </button>
                  )}
                  <button className="text-gray-600 hover:text-gray-800">Ubah</button>
                  <button className="text-red-500 hover:text-red-600">Hapus</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}