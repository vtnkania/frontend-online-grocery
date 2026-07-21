const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// 1. Ambil Semua Alamat (Ditambahkan parameter userId agar dinamis)
export const getUserAddresses = async (userId: string) => {
  try {
    const token = localStorage.getItem('token'); 
    
    // 💡 Mengirim userId lewat query string agar dibaca oleh backend controller
    const response = await fetch(`${NEXT_PUBLIC_API_URL}/addresses?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    
    if (!response.ok) throw new Error('Failed to fetch addresses');
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return [];
  }
};

// 2. Tambah Alamat Baru
export const createAddress = async (data: {
  addressName: string;
  receiverName: string;
  phoneNumber: string;
  addressDetails: string;
  isPrimary: boolean;
  userId: string; // 👈 Wajib dikirim dari form modal frontend kamu
  latitude: number;
  longitude: number;
}) => {
  try {
    const response = await fetch(`${NEXT_PUBLIC_API_URL}/addresses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Gagal menambahkan alamat baru");
    }

    return await response.json();
  } catch (error) {
    console.error("Error createAddress service:", error);
    throw error;
  }
};

// 3. Atur Alamat Utama (Ditambahkan userId di body request)
export const setPrimaryAddress = async (addressId: string, userId: string) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${NEXT_PUBLIC_API_URL}/addresses/${addressId}`, {
      method: "PATCH", 
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ isPrimary: true, userId }), // 💡 Kirim userId agar backend mengizinkan update
    });

    if (!response.ok) {
      throw new Error("Gagal mengubah alamat utama");
    }

    return await response.json();
  } catch (error) {
    console.error("Error setPrimaryAddress service:", error);
    throw error;
  }
};

// 4. Perbarui Detail Alamat (Ditambahkan userId di dalam tipe data & payload)
export const updateAddressDetails = async (addressId: string, data: {
  addressName: string;
  receiverName: string;
  phoneNumber: string;
  addressDetails: string;
  isPrimary: boolean;
  userId: string; // 👈 Tambahkan ini agar controller backend tidak melempar eror 400
}) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${NEXT_PUBLIC_API_URL}/addresses/${addressId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Gagal memperbarui alamat");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updateAddressDetails service:", error);
    throw error;
  }
};

// 5. Hapus Alamat (Ditambahkan query string ?userId= agar sesuai aturan delete controller)
export const deleteAddress = async (addressId: string, userId: string) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${NEXT_PUBLIC_API_URL}/addresses/${addressId}?userId=${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error("Gagal menghapus alamat");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleteAddress service:", error);
    throw error;
  }
};

export type ReverseGeocodingComponents = {
  road?: string;
  neighbourhood?: string;
  village?: string;
  suburb?: string;
  postcode?: string;
  state?: string;
  region?: string;
  city?: string;
  county?: string;
  subdistrict?: string;
  city_district?: string;
  municipality?: string;
  [key: string]: string | undefined;
};

export type ReverseGeocodingResult = {
  formatted: string;
  components: ReverseGeocodingComponents;
};

export type ForwardGeocodingResult = {
  formatted: string;
  latitude: number;
  longitude: number;
};

export const forwardGeocodeLocations = async (
  query: string,
  signal?: AbortSignal,
): Promise<ForwardGeocodingResult[]> => {
  const apiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;
  if (!apiKey) throw new Error("API Key OpenCage tidak ditemukan di .env");

  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2) return [];

  const params = new URLSearchParams({
    q: normalizedQuery,
    key: apiKey,
    language: "id",
    countrycode: "id",
    limit: "5",
    no_annotations: "1",
  });
  const res = await fetch(`https://api.opencagedata.com/geocode/v1/json?${params.toString()}`, { signal });
  if (!res.ok) throw new Error("Gagal mencari lokasi melalui OpenCage");

  const data = await res.json();
  if (!Array.isArray(data.results)) return [];

  return data.results.flatMap((result: {
    formatted?: unknown;
    geometry?: { lat?: unknown; lng?: unknown };
  }) => {
    const latitude = Number(result.geometry?.lat);
    const longitude = Number(result.geometry?.lng);
    const formatted = String(result.formatted || "").trim();

    if (!formatted || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
    return [{ formatted, latitude, longitude }];
  });
};

// 6. Terjemahkan Koordinat via OpenCage API (Ramping & Terisolasi)
export const reverseGeocodeLocation = async (
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<ReverseGeocodingResult | null> => {
  const apiKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;
  if (!apiKey) throw new Error("API Key OpenCage tidak ditemukan di .env");

  const res = await fetch(
    `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}&language=id`,
    { signal },
  );
  if (!res.ok) throw new Error("Gagal menghubungi server OpenCage");

  const data = await res.json();
  const result = data.results?.[0];
  if (!result) return null;

  return {
    formatted: String(result.formatted || ""),
    components: result.components || {},
  };
};

// Dipertahankan agar AddressModal dan pemanggil lama tetap kompatibel.
export const getReverseGeocoding = async (lat: number, lng: number) => {
  const result = await reverseGeocodeLocation(lat, lng);
  return result?.components || null;
};
