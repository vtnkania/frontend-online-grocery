const NEXT_PUBLIC_API_URL = 'http://localhost:3000/api/v1';

export const getUserAddresses = async () => {
  try {
    const response = await fetch(`${NEXT_PUBLIC_API_URL}/addresses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
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

export const createAddress = async (data: {
  addressName: string;
  receiverName: string;
  phoneNumber: string;
  addressDetails: string;
  isPrimary: boolean;
}) => {
  try {
    const response = await fetch("http://localhost:3000/api/v1/addresses", {
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