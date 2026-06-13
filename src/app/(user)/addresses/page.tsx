'use client';

import { useEffect, useState } from 'react';
import AddressModal from './components/AddressModal';
import { getUserAddresses, setPrimaryAddress, deleteAddress } from '@/services/address.service';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // Fungsi untuk menarik data dari API Backend
  const fetchInitialData = async () => {
    try {
      const data = await getUserAddresses();
      setAddresses(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk mengubah alamat aktif menjadi alamat utama
  const handleSetPrimary = async (addressId: string) => {
    try {
      await setPrimaryAddress(addressId);
      // Panggil kembali data dari backend agar lencana "Utama" langsung berpindah secara real-time
      fetchInitialData(); 
    } catch (error) {
      alert("Gagal mengubah alamat utama, coba lagi nanti.");
    }
  };

  // Fungsi untuk menghapus alamat yang dipilih
  const handleDelete = async (addressId: string, isPrimary: boolean) => {
    // Proteksi: Alamat utama tidak boleh dihapus secara tidak sengaja
    if (isPrimary) {
      alert("Alamat utama tidak boleh dihapus! Atur alamat lain sebagai utama terlebih dahulu.");
      return;
    }

    const konfirmasi = confirm("Apakah kamu yakin ingin menghapus alamat ini?");
    if (!konfirmasi) return;

    try {
      await deleteAddress(addressId);
      fetchInitialData(); // Refresh data secara real-time dari database
    } catch (error) {
      alert("Gagal menghapus alamat, coba lagi nanti.");
    }
  };

  const handleEditClick = (address: Address) => {
    setSelectedAddress(address); // Simpan data alamat yang dipilih ke state
    setIsModalOpen(true);        // Buka modalnya
  };

  useEffect(() => {
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
          {/* Tombol untuk membuka modal */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition active:scale-95 shadow-sm"
          >
            + Tambah Alamat Baru
          </button>
        </div>

        {/* State Loading / Empty / Content */}
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
                    <button 
                      onClick={() => handleSetPrimary(addr.id)}
                      className="text-green-600 hover:text-green-700 active:underline transition"
                    >
                      Atur Jadi Utama
                    </button>
                  )}
                  <button 
                    onClick={() => handleEditClick(addr)}
                  className="text-gray-600 hover:text-gray-800 transition active:underline"
                  >
                    Ubah
                  </button>
                  <button 
                    onClick={() => handleDelete(addr.id, addr.isPrimary)} 
                    className="text-red-500 hover:text-red-600 active:underline transition"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tampilkan Pop-up Modal Form di sini */}
      <AddressModal 
    isOpen={isModalOpen} 
    onClose={() => {
      setIsModalOpen(false);
      setSelectedAddress(null); // Reset kembali ke null saat ditutup
    }} 
    onSuccess={fetchInitialData} 
    addressData={selectedAddress} // <-- Kita oper data alamat yang mau diedit ke komponen Modal
  />
    </div>
  );
}