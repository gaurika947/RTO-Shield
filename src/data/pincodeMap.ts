/**
 * Demo pincode → city/state validation dataset
 * Labeled: "Demo validation dataset" — NOT a comprehensive Indian postal database.
 */
export const PINCODE_MAP: Record<string, { city: string; state: string }> = {
  '110001': { city: 'New Delhi', state: 'Delhi' },
  '110002': { city: 'New Delhi', state: 'Delhi' },
  '110005': { city: 'New Delhi', state: 'Delhi' },
  '110011': { city: 'New Delhi', state: 'Delhi' },
  '110020': { city: 'New Delhi', state: 'Delhi' },
  '110025': { city: 'New Delhi', state: 'Delhi' },
  '110030': { city: 'New Delhi', state: 'Delhi' },
  '110044': { city: 'New Delhi', state: 'Delhi' },
  '110065': { city: 'New Delhi', state: 'Delhi' },
  '110085': { city: 'New Delhi', state: 'Delhi' },
  '400001': { city: 'Mumbai', state: 'Maharashtra' },
  '400002': { city: 'Mumbai', state: 'Maharashtra' },
  '400050': { city: 'Mumbai', state: 'Maharashtra' },
  '400070': { city: 'Mumbai', state: 'Maharashtra' },
  '400080': { city: 'Mumbai', state: 'Maharashtra' },
  '411001': { city: 'Pune', state: 'Maharashtra' },
  '411014': { city: 'Pune', state: 'Maharashtra' },
  '411030': { city: 'Pune', state: 'Maharashtra' },
  '560001': { city: 'Bengaluru', state: 'Karnataka' },
  '560034': { city: 'Bengaluru', state: 'Karnataka' },
  '560066': { city: 'Bengaluru', state: 'Karnataka' },
  '560078': { city: 'Bengaluru', state: 'Karnataka' },
  '600001': { city: 'Chennai', state: 'Tamil Nadu' },
  '600020': { city: 'Chennai', state: 'Tamil Nadu' },
  '600040': { city: 'Chennai', state: 'Tamil Nadu' },
  '700001': { city: 'Kolkata', state: 'West Bengal' },
  '700020': { city: 'Kolkata', state: 'West Bengal' },
  '700064': { city: 'Kolkata', state: 'West Bengal' },
  '500001': { city: 'Hyderabad', state: 'Telangana' },
  '500034': { city: 'Hyderabad', state: 'Telangana' },
  '380001': { city: 'Ahmedabad', state: 'Gujarat' },
  '380015': { city: 'Ahmedabad', state: 'Gujarat' },
  '380054': { city: 'Ahmedabad', state: 'Gujarat' },
  '302001': { city: 'Jaipur', state: 'Rajasthan' },
  '302020': { city: 'Jaipur', state: 'Rajasthan' },
  '226001': { city: 'Lucknow', state: 'Uttar Pradesh' },
  '226010': { city: 'Lucknow', state: 'Uttar Pradesh' },
  '452001': { city: 'Indore', state: 'Madhya Pradesh' },
  '462001': { city: 'Bhopal', state: 'Madhya Pradesh' },
  '201301': { city: 'Noida', state: 'Uttar Pradesh' },
  '201010': { city: 'Ghaziabad', state: 'Uttar Pradesh' },
  '122001': { city: 'Gurugram', state: 'Haryana' },
  '122002': { city: 'Gurugram', state: 'Haryana' },
  '248001': { city: 'Dehradun', state: 'Uttarakhand' },
  '160001': { city: 'Chandigarh', state: 'Chandigarh' },
  '641001': { city: 'Coimbatore', state: 'Tamil Nadu' },
  '682001': { city: 'Kochi', state: 'Kerala' },
  '695001': { city: 'Thiruvananthapuram', state: 'Kerala' },
  '520001': { city: 'Vijayawada', state: 'Andhra Pradesh' },
  '530001': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
};

export function validatePincode(pincode: string, city: string): { valid: boolean; expected?: string } {
  const entry = PINCODE_MAP[pincode];
  if (!entry) return { valid: true }; // Unknown pincode — don't penalize
  const cityMatch = entry.city.toLowerCase().includes(city.toLowerCase()) ||
    city.toLowerCase().includes(entry.city.toLowerCase());
  return { valid: cityMatch, expected: entry.city };
}
