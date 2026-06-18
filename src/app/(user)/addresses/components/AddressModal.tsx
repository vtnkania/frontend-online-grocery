import React, { useState, useEffect } from 'react';
import { createAddress, updateAddressDetails, getReverseGeocoding } from '@/services/address.service';
import { useAuth } from '@/hooks/useAuth';
import { useCatalogLocation } from '@/hooks/useCatalogLocation';

interface Address {
  id: string; label: string; receiver: string; phone: string;
  address: string; province: string; city: string; district: string; isPrimary: boolean;
}

interface AddressModalProps {
  isOpen: boolean; onClose: () => void; onSuccess: () => void; addressData?: Address | null;
}

type FormFields = 'province' | 'city' | 'district';

export default function AddressModal({ isOpen, onClose, onSuccess, addressData }: AddressModalProps) {
  const { user } = useAuth();
  const catalogLocation = useCatalogLocation();

  const [formData, setFormData] = useState({
    addressName: '', receiverName: '', phoneNumber: '', addressDetails: '',
    province: '', city: '', district: '', isPrimary: false
  });
  const [coordinates, setCoordinates] = useState({ latitude: -6.17511, longitude: 106.86503 });
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [isFormUnlocked, setIsFormUnlocked] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handler = setTimeout(() => {
      setIsFormUnlocked(false);
      if (addressData) {
        const rawAddress = addressData.address || '';
        const hasRtRw = rawAddress.toUpperCase().includes('RT') || rawAddress.toUpperCase().includes('RW');
        const formattedAddress = hasRtRw ? rawAddress : `RT ... / RW ..., ${rawAddress}`;

        setFormData({
          addressName: addressData.label, receiverName: addressData.receiver, phoneNumber: addressData.phone,
          addressDetails: formattedAddress, province: addressData.province || '', city: addressData.city || '',
          district: addressData.district || '', isPrimary: addressData.isPrimary
        });
      } else {
        setFormData({ addressName: '', receiverName: '', phoneNumber: '', addressDetails: '', province: '', city: '', district: '', isPrimary: false });
      }
    }, 0);
    return () => clearTimeout(handler);
  }, [isOpen, addressData]);

  const autoFillFromCoords = async (lat: number, lng: number) => {
    try {
      const comp = await getReverseGeocoding(lat, lng);
      if (!comp) return;

      const detailParts = [
        "RT ... / RW ...",
        comp.road || '',
        comp.neighbourhood || '',
        comp.village || comp.suburb || '',
        comp.postcode ? `Kode Pos ${comp.postcode}` : ''
      ].filter(Boolean).join(', ');

      if (addressData) {
        setIsFormUnlocked(true);
      }

      setFormData({
        ...formData,
        province: String(comp.state || comp.region || ''),
        city: String(comp.city || comp.county || ''),
        district: String(comp.subdistrict || comp.city_district || comp.suburb || comp.municipality || ''),
        addressDetails: detailParts
      });
      setCoordinates({ latitude: lat, longitude: lng });
      alert("📍 Sukses memperbarui lokasi koordinat dan wilayah otomatis!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memproses data lokasi.");
    }
  };

  const handleFetchCurrentLocation = async () => {
    setGeoLoading(true);
    if (catalogLocation?.latitude && catalogLocation?.longitude) {
      await autoFillFromCoords(catalogLocation.latitude, catalogLocation.longitude);
      setGeoLoading(false);
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await autoFillFromCoords(pos.coords.latitude, pos.coords.longitude);
          setGeoLoading(false);
        },
        () => { setGeoLoading(false); alert("Izin lokasi ditolak. Isi kolom wilayah manual."); }
      );
    } else {
      setGeoLoading(false);
      alert("Browser tidak mendukung GPS.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      alert("Sesi kamu telah berakhir. Silakan login kembali.");
      return;
    }
    setLoading(true);
    try {
      if (addressData?.id) {
        await updateAddressDetails(addressData.id, {
          addressName: formData.addressName, receiverName: formData.receiverName, phoneNumber: formData.phoneNumber,
          addressDetails: formData.addressDetails, isPrimary: formData.isPrimary, userId: user.id,
          ...(isFormUnlocked ? {
            latitude: coordinates.latitude, longitude: coordinates.longitude,
            province: formData.province, city: formData.city, district: formData.district
          } : {})
        } as unknown as Parameters<typeof updateAddressDetails>[1]);
        alert("Alamat berhasil diperbarui!");
      } else {
        const payload = {
          addressName: formData.addressName, receiverName: formData.receiverName,
          phoneNumber: formData.phoneNumber, addressDetails: formData.addressDetails,
          isPrimary: formData.isPrimary, userId: user.id,
          latitude: coordinates.latitude, longitude: coordinates.longitude,
          province: formData.province, city: formData.city, district: formData.district
        };
        await createAddress(payload as unknown as Parameters<typeof createAddress>[0]);
        alert("Alamat baru berhasil disimpan!");
      }
      onSuccess(); onClose();
    } catch {
      alert("Waduh, gagal memproses data alamat.");
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto text-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">{addressData ? 'Ubah Alamat' : 'Tambah Alamat Baru'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        
        <button type="button" disabled={geoLoading} onClick={handleFetchCurrentLocation} className="w-full mb-4 px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition flex items-center justify-center gap-2 disabled:opacity-60">
          {geoLoading ? "⏳ Mendeteksi Lokasimu..." : "📍 Gunakan Lokasi Saya Sekarang (Auto-Fill)"}
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Label Alamat</label>
            <input type="text" required placeholder="Contoh: Rumah, Kantor" className="w-full px-3 py-2 border rounded-lg text-gray-800" value={formData.addressName} onChange={(e) => setFormData({...formData, addressName: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Penerima</label>
              <input type="text" required placeholder="Nama lengkap" className="w-full px-3 py-2 border rounded-lg text-gray-800" value={formData.receiverName} onChange={(e) => setFormData({...formData, receiverName: e.target.value})} />
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-1">Telepon</label>
              <input type="tel" required placeholder="081234xxx" className="w-full px-3 py-2 border rounded-lg text-gray-800" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded-lg border">
            {(['province', 'city', 'district'] as FormFields[]).map((field) => (
              <div key={field}>
                <label className="block text-[11px] font-bold text-gray-500 capitalize mb-0.5">{field === 'district' ? 'Kecamatan' : field}</label>
                <input type="text" required placeholder={field} disabled={!!addressData && !isFormUnlocked} className="w-full px-2 py-1.5 border bg-white rounded text-xs text-gray-800 disabled:bg-gray-100 disabled:text-gray-400" value={formData[field]} onChange={(e) => setFormData({...formData, [field]: e.target.value})} />
              </div>
            ))}
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">Alamat Lengkap & Detail Rumah</label>
            <textarea required rows={2} placeholder="Nama jalan, nomor rumah, RT/RW, nomor kamar/blok jika ada" className="w-full px-3 py-2 border rounded-lg text-gray-800" value={formData.addressDetails} onChange={(e) => setFormData({...formData, addressDetails: e.target.value})} />
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="isPrimary" className="h-4 w-4 text-green-600 rounded" checked={formData.isPrimary} onChange={(e) => setFormData({...formData, isPrimary: e.target.checked})} />
            <label htmlFor="isPrimary" className="ml-2 block text-gray-700 select-none">Jadikan Alamat Utama</label>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Batal</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition">{loading ? 'Menyimpan...' : 'Simpan Alamat'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}