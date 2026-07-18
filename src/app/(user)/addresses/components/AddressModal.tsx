import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet'; // 🚀 Impor core library Leaflet
import 'leaflet/dist/leaflet.css'; // 🚀 Impor style CSS Leaflet agar peta tidak berantakan
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

// 🚀 FIX ASSET BUG: Membuat pin custom SVG warna hijau emerald agar aman dari error 404 image asset Next.js
const customIcon = typeof window !== 'undefined' ? L.divIcon({
  html: `<div style="color: #16a34a;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width: 32px; height: 32px;"><path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" /></svg></div>`,
  className: 'custom-leaflet-pin',
  iconSize: [32, 32],
  iconAnchor: [16, 32]
}) : null;

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

  // 🚀 REFS PETA: Referensi untuk wadah HTML dan objek instansi peta Leaflet
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

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

  const autoFillFromCoords = async (lat: number, lng: number, updateMapCamera = false) => {
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

      // Sinkronisasikan posisi kamera peta jika fungsi dipicu oleh tombol Auto-Fill GPS luar
      if (updateMapCamera && mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.setView([lat, lng], 16);
        markerRef.current.setLatLng([lat, lng]);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memproses data lokasi.");
    }
  };

  const handleFetchCurrentLocation = async () => {
    setGeoLoading(true);
    if (catalogLocation?.latitude && catalogLocation?.longitude) {
      await autoFillFromCoords(catalogLocation.latitude, catalogLocation.longitude, true);
      setGeoLoading(false);
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await autoFillFromCoords(pos.coords.latitude, pos.coords.longitude, true);
          setGeoLoading(false);
        },
        () => { setGeoLoading(false); alert("Izin lokasi ditolak. Isi kolom wilayah manual."); }
      );
    } else {
      setGeoLoading(false);
      alert("Browser tidak mendukung GPS.");
    }
  };

  // 🚀 INTERACTIVE MAP ENGINE: Inisialisasi & sinkronisasi peta OpenStreetMap Leaflet
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Inisialisasi instansi peta baru jika belum pernah terbuat
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([coordinates.latitude, coordinates.longitude], 15);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const marker = L.marker([coordinates.latitude, coordinates.longitude], {
        draggable: true,
        icon: customIcon || undefined
      }).addTo(map);

      // Event Listener: Deteksi titik koordinat saat pin marker selesai digeser user
      marker.on('dragend', async () => {
        const position = marker.getLatLng();
        await autoFillFromCoords(position.lat, position.lng, false);
      });

      // Event Listener: Ubah posisi pin saat area peta acak diklik oleh user
      map.on('click', async (e) => {
        marker.setLatLng(e.latlng);
        await autoFillFromCoords(e.latlng.lat, e.latlng.lng, false);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }

    // Pembersihan instansi peta otomatis saat modal ditutup agar terhindar dari kebocoran memori browser
    return () => {
      if (!isOpen && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen]);

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
        
        <button type="button" disabled={geoLoading} onClick={handleFetchCurrentLocation} className="w-full mb-3 px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition flex items-center justify-center gap-2 disabled:opacity-60">
          {geoLoading ? "⏳ Mendeteksi Lokasimu..." : "📍 Gunakan Lokasi Saya Sekarang (Auto-Fill)"}
        </button>

        {/* 🚀 LAYOUT CONTAINER PETA INTERAKTIF */}
        <div className="w-full h-44 rounded-xl border border-gray-200 mb-4 overflow-hidden relative z-10 shadow-inner">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>

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