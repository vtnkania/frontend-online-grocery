const NEXT_PUBLIC_API_URL = 'http://localhost:8000/api/v1';

// 1. Ambil Semua Alamat
export const getUserAddresses = async () => {
  try {
    const token = localStorage.getItem('token'); 
    
    const response = await fetch(`${NEXT_PUBLIC_API_URL}/addresses`, {
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

// 2. Tambah Alamat Baru (Versi Clean Tanpa Memicu Crash verifyToken Kania)
export const createAddress = async (data: {
  addressName: string;
  receiverName: string;
  phoneNumber: string;
  addressDetails: string;
  isPrimary: boolean;
  userId?: string; // Tambahkan ini agar tidak komplain di modal
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

// 3. Atur Alamat Utama
export const setPrimaryAddress = async (addressId: string) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${NEXT_PUBLIC_API_URL}/addresses/${addressId}`, {
      method: "PATCH", 
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ isPrimary: true }),
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

// 4. Hapus Alamat
export const deleteAddress = async (addressId: string) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${NEXT_PUBLIC_API_URL}/addresses/${addressId}`, {
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

// 5. Perbarui Detail Alamat
export const updateAddressDetails = async (addressId: string, data: {
  addressName: string;
  receiverName: string;
  phoneNumber: string;
  addressDetails: string;
  isPrimary: boolean;
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