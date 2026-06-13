import React, { useState } from 'react';
import { createAddress } from '@/services/address.service';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddressModal({ isOpen, onClose, onSuccess }: AddressModalProps) {
  const [formData, setFormData] = useState({
    addressName: '',
    receiverName: '',
    phoneNumber: '',
    addressDetails: '',
    isPrimary: false
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createAddress(formData);
      alert("Alamat berhasil disimpan!");
      onSuccess(); // Refresh data di halaman utama
      onClose();   // Tutup modal
      setFormData({ addressName: '', receiverName: '', phoneNumber: '', addressDetails: '', isPrimary: false });
    } catch (error) {
      alert("Waduh, gagal menyimpan alamat.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Tambah Alamat Baru</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label Alamat</label>
            <input 
              type="text" required placeholder="Contoh: Rumah, Kantor, Kosan"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm text-gray-800"
              value={formData.addressName}
              onChange={(e) => setFormData({...formData, addressName: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Penerima</label>
            <input 
              type="text" required placeholder="Nama lengkap penerima"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm text-gray-800"
              value={formData.receiverName}
              onChange={(e) => setFormData({...formData, receiverName: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
            <input 
              type="tel" required placeholder="Contoh: 08123456789"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm text-gray-800"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
            <textarea 
              required rows={3} placeholder="Nama jalan, nomor rumah, RT/RW, cluster"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm text-gray-800"
              value={formData.addressDetails}
              onChange={(e) => setFormData({...formData, addressDetails: e.target.value})}
            />
          </div>

          <div className="flex items-center">
            <input 
              type="checkbox" id="isPrimary"
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              checked={formData.isPrimary}
              onChange={(e) => setFormData({...formData, isPrimary: e.target.checked})}
            />
            <label htmlFor="isPrimary" className="ml-2 block text-sm text-gray-700 select-none">
              Jadikan Alamat Utama
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button 
              type="button" onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button 
              type="submit" disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm font-medium transition"
            >
              {loading ? 'Menyimpan...' : 'Simpan Alamat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}