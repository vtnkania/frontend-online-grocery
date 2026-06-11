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