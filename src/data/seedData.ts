import type { Customer } from '../types/customer';
import type { Order, OrderAddress } from '../types/order';
import type { NetworkNode, NetworkEdge } from '../types/network';

// ============================================================
// DETERMINISTIC SYNTHETIC SEED DATA
// 20 customers, 8 devices, 6 IP subnets, ~50 historical orders
//
// Customer breakdown:
//   5 genuine customers (good history)
//   4 new customers (no/minimal history)
//   4 serial returners (high RTO rates)
//   4 abuse-ring members (shared devices/IPs, temporal clustering)
//   3 mixed/edge cases
// ============================================================

const NOW = Date.now();
const DAY = 86400_000;

// ---------- CUSTOMERS ----------

export const SEED_CUSTOMERS: Customer[] = [
  // ---- GENUINE CUSTOMERS (5) ----
  {
    id: 'CUS_1001', name: 'Aarav Sharma', phoneHash: 'phone_hash_a1b2', emailHash: 'email_hash_c3d4',
    totalOrders: 24, successfulDeliveries: 22, rtoOrders: 1, cancelledOrders: 1,
    codOrders: 8, prepaidOrders: 16, averageOrderValue: 1850,
    knownDevices: ['DEV_A01'], knownAddresses: ['addr_hash_g01'],
    createdAt: NOW - 180 * DAY,
  },
  {
    id: 'CUS_1002', name: 'Priya Patel', phoneHash: 'phone_hash_e5f6', emailHash: 'email_hash_g7h8',
    totalOrders: 15, successfulDeliveries: 14, rtoOrders: 0, cancelledOrders: 1,
    codOrders: 5, prepaidOrders: 10, averageOrderValue: 2200,
    knownDevices: ['DEV_A02'], knownAddresses: ['addr_hash_g02'],
    createdAt: NOW - 240 * DAY,
  },
  {
    id: 'CUS_1003', name: 'Rohan Gupta', phoneHash: 'phone_hash_i9j0', emailHash: 'email_hash_k1l2',
    totalOrders: 32, successfulDeliveries: 30, rtoOrders: 1, cancelledOrders: 1,
    codOrders: 12, prepaidOrders: 20, averageOrderValue: 1500,
    knownDevices: ['DEV_A03'], knownAddresses: ['addr_hash_g03'],
    createdAt: NOW - 365 * DAY,
  },
  {
    id: 'CUS_1004', name: 'Sneha Reddy', phoneHash: 'phone_hash_m3n4', emailHash: 'email_hash_o5p6',
    totalOrders: 10, successfulDeliveries: 9, rtoOrders: 1, cancelledOrders: 0,
    codOrders: 3, prepaidOrders: 7, averageOrderValue: 3100,
    knownDevices: ['DEV_A04'], knownAddresses: ['addr_hash_g04'],
    createdAt: NOW - 120 * DAY,
  },
  {
    id: 'CUS_1005', name: 'Vikram Singh', phoneHash: 'phone_hash_q7r8', emailHash: 'email_hash_s9t0',
    totalOrders: 8, successfulDeliveries: 7, rtoOrders: 0, cancelledOrders: 1,
    codOrders: 6, prepaidOrders: 2, averageOrderValue: 980,
    knownDevices: ['DEV_A01'], knownAddresses: ['addr_hash_g05'],
    createdAt: NOW - 90 * DAY,
  },

  // ---- NEW CUSTOMERS (4) ----
  {
    id: 'CUS_2001', name: 'Anika Verma', phoneHash: 'phone_hash_u1v2', emailHash: 'email_hash_w3x4',
    totalOrders: 0, successfulDeliveries: 0, rtoOrders: 0, cancelledOrders: 0,
    codOrders: 0, prepaidOrders: 0, averageOrderValue: 0,
    knownDevices: ['DEV_A05'], knownAddresses: [],
    createdAt: NOW - 2 * DAY,
  },
  {
    id: 'CUS_2002', name: 'Karthik Nair', phoneHash: 'phone_hash_y5z6', emailHash: 'email_hash_a7b8',
    totalOrders: 1, successfulDeliveries: 1, rtoOrders: 0, cancelledOrders: 0,
    codOrders: 1, prepaidOrders: 0, averageOrderValue: 1200,
    knownDevices: ['DEV_A06'], knownAddresses: ['addr_hash_n01'],
    createdAt: NOW - 7 * DAY,
  },
  {
    id: 'CUS_2003', name: 'Meera Joshi', phoneHash: 'phone_hash_c9d0', emailHash: 'email_hash_e1f2',
    totalOrders: 2, successfulDeliveries: 2, rtoOrders: 0, cancelledOrders: 0,
    codOrders: 2, prepaidOrders: 0, averageOrderValue: 750,
    knownDevices: ['DEV_A05'], knownAddresses: ['addr_hash_n02'],
    createdAt: NOW - 14 * DAY,
  },
  {
    id: 'CUS_2004', name: 'Devansh Kapoor', phoneHash: 'phone_hash_g3h4', emailHash: 'email_hash_i5j6',
    totalOrders: 0, successfulDeliveries: 0, rtoOrders: 0, cancelledOrders: 0,
    codOrders: 0, prepaidOrders: 0, averageOrderValue: 0,
    knownDevices: ['DEV_A07'], knownAddresses: [],
    createdAt: NOW - 1 * DAY,
  },

  // ---- SERIAL RETURNERS (4) ----
  {
    id: 'CUS_3001', name: 'Rahul Dubey', phoneHash: 'phone_hash_k7l8', emailHash: 'email_hash_m9n0',
    totalOrders: 19, successfulDeliveries: 8, rtoOrders: 8, cancelledOrders: 3,
    codOrders: 17, prepaidOrders: 2, averageOrderValue: 2100,
    knownDevices: ['DEV_B01'], knownAddresses: ['addr_hash_s01'],
    createdAt: NOW - 200 * DAY,
  },
  {
    id: 'CUS_3002', name: 'Pooja Mishra', phoneHash: 'phone_hash_o1p2', emailHash: 'email_hash_q3r4',
    totalOrders: 14, successfulDeliveries: 5, rtoOrders: 7, cancelledOrders: 2,
    codOrders: 13, prepaidOrders: 1, averageOrderValue: 1800,
    knownDevices: ['DEV_B01'], knownAddresses: ['addr_hash_s02'],
    createdAt: NOW - 150 * DAY,
  },
  {
    id: 'CUS_3003', name: 'Amit Yadav', phoneHash: 'phone_hash_s5t6', emailHash: 'email_hash_u7v8',
    totalOrders: 11, successfulDeliveries: 3, rtoOrders: 6, cancelledOrders: 2,
    codOrders: 10, prepaidOrders: 1, averageOrderValue: 1400,
    knownDevices: ['DEV_B02'], knownAddresses: ['addr_hash_s03'],
    createdAt: NOW - 100 * DAY,
  },
  {
    id: 'CUS_3004', name: 'Neha Agarwal', phoneHash: 'phone_hash_w9x0', emailHash: 'email_hash_y1z2',
    totalOrders: 22, successfulDeliveries: 10, rtoOrders: 9, cancelledOrders: 3,
    codOrders: 20, prepaidOrders: 2, averageOrderValue: 1650,
    knownDevices: ['DEV_B02'], knownAddresses: ['addr_hash_s04'],
    createdAt: NOW - 180 * DAY,
  },

  // ---- ABUSE-RING MEMBERS (4) — shared DEV_B03, ip_subnet_R01 ----
  {
    id: 'CUS_4001', name: 'Ravi Kumar', phoneHash: 'phone_hash_a3b4', emailHash: 'email_hash_c5d6',
    totalOrders: 9, successfulDeliveries: 2, rtoOrders: 5, cancelledOrders: 2,
    codOrders: 9, prepaidOrders: 0, averageOrderValue: 3200,
    knownDevices: ['DEV_B03'], knownAddresses: ['addr_hash_r01'],
    createdAt: NOW - 30 * DAY,
  },
  {
    id: 'CUS_4002', name: 'Sunita Devi', phoneHash: 'phone_hash_e7f8', emailHash: 'email_hash_g9h0',
    totalOrders: 7, successfulDeliveries: 1, rtoOrders: 5, cancelledOrders: 1,
    codOrders: 7, prepaidOrders: 0, averageOrderValue: 2800,
    knownDevices: ['DEV_B03'], knownAddresses: ['addr_hash_r02'],
    createdAt: NOW - 25 * DAY,
  },
  {
    id: 'CUS_4003', name: 'Manoj Tiwari', phoneHash: 'phone_hash_i1j2', emailHash: 'email_hash_k3l4',
    totalOrders: 6, successfulDeliveries: 1, rtoOrders: 4, cancelledOrders: 1,
    codOrders: 6, prepaidOrders: 0, averageOrderValue: 2600,
    knownDevices: ['DEV_B03'], knownAddresses: ['addr_hash_r03'],
    createdAt: NOW - 20 * DAY,
  },
  {
    id: 'CUS_4004', name: 'Kavita Pandey', phoneHash: 'phone_hash_m5n6', emailHash: 'email_hash_o7p8',
    totalOrders: 5, successfulDeliveries: 0, rtoOrders: 4, cancelledOrders: 1,
    codOrders: 5, prepaidOrders: 0, averageOrderValue: 3500,
    knownDevices: ['DEV_B03'], knownAddresses: ['addr_hash_r04'],
    createdAt: NOW - 15 * DAY,
  },

  // ---- MIXED / EDGE CASES (3) ----
  {
    id: 'CUS_5001', name: 'Arjun Mehta', phoneHash: 'phone_hash_q9r0', emailHash: 'email_hash_s1t2',
    totalOrders: 6, successfulDeliveries: 4, rtoOrders: 2, cancelledOrders: 0,
    codOrders: 4, prepaidOrders: 2, averageOrderValue: 1700,
    knownDevices: ['DEV_A04'], knownAddresses: ['addr_hash_m01'],
    createdAt: NOW - 60 * DAY,
  },
  {
    id: 'CUS_5002', name: 'Divya Chauhan', phoneHash: 'phone_hash_u3v4', emailHash: 'email_hash_w5x6',
    totalOrders: 12, successfulDeliveries: 8, rtoOrders: 3, cancelledOrders: 1,
    codOrders: 10, prepaidOrders: 2, averageOrderValue: 1100,
    knownDevices: ['DEV_B01'], knownAddresses: ['addr_hash_m02'],
    createdAt: NOW - 130 * DAY,
  },
  {
    id: 'CUS_5003', name: 'Nikhil Saxena', phoneHash: 'phone_hash_y7z8', emailHash: 'email_hash_a9b0',
    totalOrders: 4, successfulDeliveries: 2, rtoOrders: 1, cancelledOrders: 1,
    codOrders: 3, prepaidOrders: 1, averageOrderValue: 2400,
    knownDevices: ['DEV_A08'], knownAddresses: ['addr_hash_m03'],
    createdAt: NOW - 45 * DAY,
  },

  // ---- DEMO ECOSYSTEM CUSTOMERS ----
  {
    id: 'CUS_6001', name: 'Rohan Deshmukh', phoneHash: 'phone_hash_r8s9', emailHash: 'email_hash_t0u1',
    totalOrders: 5, successfulDeliveries: 3, rtoOrders: 2, cancelledOrders: 0,
    codOrders: 5, prepaidOrders: 0, averageOrderValue: 2800,
    knownDevices: ['DEV_C01'], knownAddresses: ['addr_hash_muzaffar'],
    createdAt: NOW - 45 * DAY,
  },
  {
    id: 'CUS_7001', name: 'Sneha Mukherjee', phoneHash: 'phone_hash_x1y2', emailHash: 'email_hash_z3a4',
    totalOrders: 5, successfulDeliveries: 3, rtoOrders: 2, cancelledOrders: 0,
    codOrders: 4, prepaidOrders: 1, averageOrderValue: 2600,
    knownDevices: ['DEV_D01'], knownAddresses: ['addr_hash_pune1'],
    createdAt: NOW - 20 * DAY,
  },
  {
    id: 'CUS_8001', name: 'Karan Singhal', phoneHash: 'phone_hash_b5c6', emailHash: 'email_hash_d7e8',
    totalOrders: 7, successfulDeliveries: 1, rtoOrders: 5, cancelledOrders: 1,
    codOrders: 7, prepaidOrders: 0, averageOrderValue: 2300,
    knownDevices: ['DEV_B01', 'DEV_E01'], knownAddresses: ['addr_hash_delhi8'],
    createdAt: NOW - 35 * DAY,
  },
  {
    id: 'CUS_9001', name: 'Sunita Patel', phoneHash: 'phone_hash_f9g0', emailHash: 'email_hash_h1i2',
    totalOrders: 28, successfulDeliveries: 28, rtoOrders: 0, cancelledOrders: 0,
    codOrders: 6, prepaidOrders: 22, averageOrderValue: 4500,
    knownDevices: ['DEV_F01'], knownAddresses: ['addr_hash_ahmedabad'],
    createdAt: NOW - 400 * DAY,
  },
];

// ---------- DEVICES → IP SUBNET MAPPING ----------
export const DEVICE_IP_MAP: Record<string, string> = {
  'DEV_A01': 'ip_subnet_G01',
  'DEV_A02': 'ip_subnet_G01',
  'DEV_A03': 'ip_subnet_G02',
  'DEV_A04': 'ip_subnet_G02',
  'DEV_A05': 'ip_subnet_G03',
  'DEV_A06': 'ip_subnet_G03',
  'DEV_A07': 'ip_subnet_G04',
  'DEV_A08': 'ip_subnet_G04',
  'DEV_B01': 'ip_subnet_R01',   // serial returner cluster
  'DEV_B02': 'ip_subnet_R01',
  'DEV_B03': 'ip_subnet_R02',   // abuse-ring cluster
  'DEV_C01': 'ip_subnet_M01',
  'DEV_D01': 'ip_subnet_P01',
  'DEV_E01': 'ip_subnet_S01',
  'DEV_F01': 'ip_subnet_A01',
};

// ---------- HISTORICAL ORDERS (50) ----------
function makeOrder(
  id: string, custId: string, amount: number, method: 'COD' | 'UPI' | 'CARD',
  addr: OrderAddress, deviceId: string, daysAgo: number,
  outcome: 'DELIVERED' | 'RTO' | 'CANCELLED'
): Order {
  return {
    id, customerId: custId, amount, paymentMethod: method,
    address: addr, deviceId,
    ipSubnet: DEVICE_IP_MAP[deviceId] || 'ip_subnet_G01',
    timestamp: NOW - daysAgo * DAY,
    outcome,
  };
}

const ADDR_GENUINE_1: OrderAddress = { line1: '42, Sector 15, Vasant Kunj', city: 'New Delhi', state: 'Delhi', pincode: '110070', landmark: 'Near DLF Mall' };
const ADDR_GENUINE_2: OrderAddress = { line1: 'Flat 302, Sunrise Apartments, MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001', landmark: 'Opposite Trinity Mall' };
const ADDR_GENUINE_3: OrderAddress = { line1: '18/B, Andheri West, Link Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400050', landmark: 'Near Infinity Mall' };
const ADDR_GENUINE_4: OrderAddress = { line1: 'H.No 7, Jubilee Hills, Road No 36', city: 'Hyderabad', state: 'Telangana', pincode: '500034', landmark: 'Near GVK One Mall' };
const ADDR_GENUINE_5: OrderAddress = { line1: 'Plot 12, Aundh, ITI Road', city: 'Pune', state: 'Maharashtra', pincode: '411001', landmark: 'Near Westend Mall' };

const ADDR_SERIAL_1: OrderAddress = { line1: 'House 44, Gomti Nagar', city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226010' };
const ADDR_SERIAL_2: OrderAddress = { line1: 'B-12, Malviya Nagar', city: 'Jaipur', state: 'Rajasthan', pincode: '302020' };
const ADDR_SERIAL_3: OrderAddress = { line1: 'Flat 8, Kothrud', city: 'Pune', state: 'Maharashtra', pincode: '411030' };

const ADDR_ABUSE_1: OrderAddress = { line1: 'Room 3, Sector 62', city: 'Noida', state: 'Uttar Pradesh', pincode: '201301' };
const ADDR_ABUSE_2: OrderAddress = { line1: 'near metro', city: 'Noida', state: 'Uttar Pradesh', pincode: '201301' };
const ADDR_ABUSE_3: OrderAddress = { line1: 'shop 5 sector 62', city: 'Noida', state: 'Uttar Pradesh', pincode: '201301' };

export const SEED_ORDERS: Order[] = [
  // ---- Genuine Customer Orders (CUS_1001–CUS_1005) ----
  makeOrder('ORD_0001', 'CUS_1001', 1800, 'UPI', ADDR_GENUINE_1, 'DEV_A01', 170, 'DELIVERED'),
  makeOrder('ORD_0002', 'CUS_1001', 2200, 'COD', ADDR_GENUINE_1, 'DEV_A01', 150, 'DELIVERED'),
  makeOrder('ORD_0003', 'CUS_1001', 1500, 'CARD', ADDR_GENUINE_1, 'DEV_A01', 120, 'DELIVERED'),
  makeOrder('ORD_0004', 'CUS_1001', 2100, 'UPI', ADDR_GENUINE_1, 'DEV_A01', 90, 'DELIVERED'),
  makeOrder('ORD_0005', 'CUS_1002', 2500, 'UPI', ADDR_GENUINE_2, 'DEV_A02', 200, 'DELIVERED'),
  makeOrder('ORD_0006', 'CUS_1002', 1900, 'CARD', ADDR_GENUINE_2, 'DEV_A02', 160, 'DELIVERED'),
  makeOrder('ORD_0007', 'CUS_1002', 2100, 'COD', ADDR_GENUINE_2, 'DEV_A02', 100, 'DELIVERED'),
  makeOrder('ORD_0008', 'CUS_1003', 1400, 'UPI', ADDR_GENUINE_3, 'DEV_A03', 300, 'DELIVERED'),
  makeOrder('ORD_0009', 'CUS_1003', 1600, 'UPI', ADDR_GENUINE_3, 'DEV_A03', 250, 'DELIVERED'),
  makeOrder('ORD_0010', 'CUS_1003', 1200, 'COD', ADDR_GENUINE_3, 'DEV_A03', 180, 'DELIVERED'),
  makeOrder('ORD_0011', 'CUS_1004', 3200, 'CARD', ADDR_GENUINE_4, 'DEV_A04', 100, 'DELIVERED'),
  makeOrder('ORD_0012', 'CUS_1004', 2800, 'UPI', ADDR_GENUINE_4, 'DEV_A04', 50, 'DELIVERED'),
  makeOrder('ORD_0013', 'CUS_1005', 900, 'COD', ADDR_GENUINE_5, 'DEV_A01', 80, 'DELIVERED'),
  makeOrder('ORD_0014', 'CUS_1005', 1100, 'COD', ADDR_GENUINE_5, 'DEV_A01', 40, 'DELIVERED'),

  // ---- New Customer Orders (CUS_2002, CUS_2003) ----
  makeOrder('ORD_0015', 'CUS_2002', 1200, 'COD', { line1: '23, HSR Layout', city: 'Bengaluru', state: 'Karnataka', pincode: '560034', landmark: 'Near BDA Complex' }, 'DEV_A06', 5, 'DELIVERED'),
  makeOrder('ORD_0016', 'CUS_2003', 700, 'COD', { line1: '15 MG Road', city: 'Pune', state: 'Maharashtra', pincode: '411001' }, 'DEV_A05', 12, 'DELIVERED'),
  makeOrder('ORD_0017', 'CUS_2003', 800, 'COD', { line1: '15 MG Road', city: 'Pune', state: 'Maharashtra', pincode: '411001' }, 'DEV_A05', 8, 'DELIVERED'),

  // ---- Serial Returner Orders (CUS_3001–CUS_3004) ----
  makeOrder('ORD_0018', 'CUS_3001', 2100, 'COD', ADDR_SERIAL_1, 'DEV_B01', 190, 'DELIVERED'),
  makeOrder('ORD_0019', 'CUS_3001', 1800, 'COD', ADDR_SERIAL_1, 'DEV_B01', 170, 'RTO'),
  makeOrder('ORD_0020', 'CUS_3001', 2400, 'COD', ADDR_SERIAL_1, 'DEV_B01', 140, 'DELIVERED'),
  makeOrder('ORD_0021', 'CUS_3001', 1900, 'COD', ADDR_SERIAL_1, 'DEV_B01', 110, 'RTO'),
  makeOrder('ORD_0022', 'CUS_3001', 2200, 'COD', ADDR_SERIAL_1, 'DEV_B01', 80, 'RTO'),
  makeOrder('ORD_0023', 'CUS_3001', 2500, 'COD', ADDR_SERIAL_1, 'DEV_B01', 50, 'RTO'),
  makeOrder('ORD_0024', 'CUS_3001', 1700, 'COD', ADDR_SERIAL_1, 'DEV_B01', 20, 'RTO'),
  makeOrder('ORD_0025', 'CUS_3002', 1800, 'COD', ADDR_SERIAL_2, 'DEV_B01', 140, 'DELIVERED'),
  makeOrder('ORD_0026', 'CUS_3002', 2000, 'COD', ADDR_SERIAL_2, 'DEV_B01', 120, 'RTO'),
  makeOrder('ORD_0027', 'CUS_3002', 1600, 'COD', ADDR_SERIAL_2, 'DEV_B01', 90, 'RTO'),
  makeOrder('ORD_0028', 'CUS_3002', 2100, 'COD', ADDR_SERIAL_2, 'DEV_B01', 60, 'RTO'),
  makeOrder('ORD_0029', 'CUS_3002', 1500, 'COD', ADDR_SERIAL_2, 'DEV_B01', 30, 'RTO'),
  makeOrder('ORD_0030', 'CUS_3003', 1400, 'COD', ADDR_SERIAL_3, 'DEV_B02', 95, 'RTO'),
  makeOrder('ORD_0031', 'CUS_3003', 1300, 'COD', ADDR_SERIAL_3, 'DEV_B02', 70, 'RTO'),
  makeOrder('ORD_0032', 'CUS_3003', 1500, 'COD', ADDR_SERIAL_3, 'DEV_B02', 45, 'DELIVERED'),
  makeOrder('ORD_0033', 'CUS_3003', 1200, 'COD', ADDR_SERIAL_3, 'DEV_B02', 20, 'RTO'),
  makeOrder('ORD_0034', 'CUS_3004', 1700, 'COD', ADDR_SERIAL_1, 'DEV_B02', 160, 'DELIVERED'),
  makeOrder('ORD_0035', 'CUS_3004', 1600, 'COD', ADDR_SERIAL_1, 'DEV_B02', 130, 'RTO'),
  makeOrder('ORD_0036', 'CUS_3004', 1800, 'COD', ADDR_SERIAL_1, 'DEV_B02', 100, 'RTO'),
  makeOrder('ORD_0037', 'CUS_3004', 1500, 'COD', ADDR_SERIAL_1, 'DEV_B02', 70, 'RTO'),
  makeOrder('ORD_0038', 'CUS_3004', 2000, 'COD', ADDR_SERIAL_1, 'DEV_B02', 40, 'DELIVERED'),

  // ---- Abuse-Ring Orders (CUS_4001–CUS_4004, shared DEV_B03, ip_subnet_R02) ----
  makeOrder('ORD_0039', 'CUS_4001', 3200, 'COD', ADDR_ABUSE_1, 'DEV_B03', 28, 'RTO'),
  makeOrder('ORD_0040', 'CUS_4001', 2900, 'COD', ADDR_ABUSE_1, 'DEV_B03', 22, 'RTO'),
  makeOrder('ORD_0041', 'CUS_4001', 3500, 'COD', ADDR_ABUSE_1, 'DEV_B03', 15, 'RTO'),
  makeOrder('ORD_0042', 'CUS_4002', 2800, 'COD', ADDR_ABUSE_2, 'DEV_B03', 24, 'RTO'),
  makeOrder('ORD_0043', 'CUS_4002', 3100, 'COD', ADDR_ABUSE_2, 'DEV_B03', 18, 'RTO'),
  makeOrder('ORD_0044', 'CUS_4002', 2600, 'COD', ADDR_ABUSE_2, 'DEV_B03', 10, 'RTO'),
  makeOrder('ORD_0045', 'CUS_4003', 2600, 'COD', ADDR_ABUSE_3, 'DEV_B03', 19, 'RTO'),
  makeOrder('ORD_0046', 'CUS_4003', 2900, 'COD', ADDR_ABUSE_3, 'DEV_B03', 12, 'DELIVERED'),
  makeOrder('ORD_0047', 'CUS_4003', 2400, 'COD', ADDR_ABUSE_3, 'DEV_B03', 5, 'RTO'),
  makeOrder('ORD_0048', 'CUS_4004', 3500, 'COD', ADDR_ABUSE_1, 'DEV_B03', 14, 'RTO'),
  makeOrder('ORD_0049', 'CUS_4004', 3800, 'COD', ADDR_ABUSE_2, 'DEV_B03', 8, 'RTO'),

  // ---- Mixed / Edge Case Orders ----
  makeOrder('ORD_0050', 'CUS_5001', 1700, 'COD', { line1: 'Flat 5, Lake Town', city: 'Kolkata', state: 'West Bengal', pincode: '700064', landmark: 'Near South City Mall' }, 'DEV_A04', 55, 'DELIVERED'),
  makeOrder('ORD_0051', 'CUS_5001', 1800, 'COD', { line1: 'Flat 5, Lake Town', city: 'Kolkata', state: 'West Bengal', pincode: '700064' }, 'DEV_A04', 30, 'RTO'),
  makeOrder('ORD_0052', 'CUS_5002', 1100, 'COD', { line1: '22 Civil Lines', city: 'Jaipur', state: 'Rajasthan', pincode: '302001' }, 'DEV_B01', 125, 'DELIVERED'),
  makeOrder('ORD_0053', 'CUS_5002', 1000, 'COD', { line1: '22 Civil Lines', city: 'Jaipur', state: 'Rajasthan', pincode: '302001' }, 'DEV_B01', 80, 'RTO'),
  makeOrder('ORD_0054', 'CUS_5003', 2400, 'COD', { line1: 'A-11, Vaishali', city: 'Ghaziabad', state: 'Uttar Pradesh', pincode: '201010', landmark: 'Near Mahagun Mall' }, 'DEV_A08', 40, 'DELIVERED'),

  // ---- Recent Window Orders for Live Velocity & Abuse-Cluster Signals ----
  // DEV_B01 cluster burst (Aarav Mehta & Karan Singhal)
  { id: 'ORD_REC_1', customerId: 'CUS_3001', amount: 2499, paymentMethod: 'COD', address: { line1: 'Flat 402, Green Residency, Sector 62', city: 'Noida', state: 'Uttar Pradesh', pincode: '201309' }, deviceId: 'DEV_B01', ipSubnet: 'ip_subnet_S01', timestamp: NOW - 12 * 60_000, outcome: 'RTO' },
  { id: 'ORD_REC_2', customerId: 'CUS_3001', amount: 3100, paymentMethod: 'COD', address: { line1: 'Flat 402, Green Residency, Sector 62', city: 'Noida', state: 'Uttar Pradesh', pincode: '201309' }, deviceId: 'DEV_B01', ipSubnet: 'ip_subnet_S01', timestamp: NOW - 32 * 60_000, outcome: 'RTO' },
  { id: 'ORD_REC_3', customerId: 'CUS_8001', amount: 2299, paymentMethod: 'COD', address: { line1: 'Shop 14, Main Market, Shakarpur', city: 'Delhi', state: 'Delhi', pincode: '110001' }, deviceId: 'DEV_B01', ipSubnet: 'ip_subnet_S01', timestamp: NOW - 20 * 60_000, outcome: 'RTO' },
  { id: 'ORD_REC_4', customerId: 'CUS_8001', amount: 2500, paymentMethod: 'COD', address: { line1: 'Shop 14, Main Market, Shakarpur', city: 'Delhi', state: 'Delhi', pincode: '110001' }, deviceId: 'DEV_B01', ipSubnet: 'ip_subnet_S01', timestamp: NOW - 48 * 60_000, outcome: 'RTO' },

  // DEV_B03 cluster orders (Rahul Verma & Abuse-Ring)
  { id: 'ORD_REC_5', customerId: 'CUS_4001', amount: 3299, paymentMethod: 'COD', address: { line1: 'House 88, Raj Nagar Extension', city: 'Ghaziabad', state: 'Uttar Pradesh', pincode: '201017' }, deviceId: 'DEV_B03', ipSubnet: 'ip_subnet_R01', timestamp: NOW - 15 * 60_000, outcome: 'RTO' },
  { id: 'ORD_REC_6', customerId: 'CUS_4002', amount: 2800, paymentMethod: 'COD', address: { line1: 'Room 3, Sector 62', city: 'Noida', state: 'Uttar Pradesh', pincode: '201301' }, deviceId: 'DEV_B03', ipSubnet: 'ip_subnet_R02', timestamp: NOW - 40 * 60_000, outcome: 'RTO' },

  // Moderate velocity orders (Vikram Malhotra & Rohan Deshmukh)
  { id: 'ORD_REC_7', customerId: 'CUS_5002', amount: 4199, paymentMethod: 'COD', address: { line1: '14/2 100ft Road, Indiranagar', city: 'Bengaluru', state: 'Karnataka', pincode: '560038' }, deviceId: 'DEV_B02', ipSubnet: 'ip_subnet_S01', timestamp: NOW - 5 * 3600_000, outcome: 'DELIVERED' },
  { id: 'ORD_REC_8', customerId: 'CUS_6001', amount: 3499, paymentMethod: 'COD', address: { line1: 'Ward 4, Station Road, Mithanpura', city: 'Muzaffarpur', state: 'Bihar', pincode: '842001' }, deviceId: 'DEV_C01', ipSubnet: 'ip_subnet_M01', timestamp: NOW - 3 * 3600_000, outcome: 'DELIVERED' },
];

// ---------- BUILD NETWORK NODES AND EDGES FROM DATA ----------

export function buildNetworkFromData(
  customers: Customer[],
  orders: Order[]
): { nodes: NetworkNode[]; edges: NetworkEdge[] } {
  const nodes: NetworkNode[] = [];
  const edges: NetworkEdge[] = [];
  const nodeSet = new Set<string>();
  const edgeSet = new Set<string>();

  function addNode(id: string, type: NetworkNode['type'], label: string, meta: Record<string, unknown> = {}) {
    if (!nodeSet.has(id)) {
      nodeSet.add(id);
      nodes.push({ id, type, label, metadata: meta });
    }
  }
  function addEdge(src: string, tgt: string, rel: NetworkEdge['relationship']) {
    const key = `${src}-${rel}-${tgt}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push({ id: key, source: src, target: tgt, relationship: rel });
    }
  }

  for (const c of customers) {
    addNode(c.id, 'CUSTOMER', c.name, { rtoOrders: c.rtoOrders, totalOrders: c.totalOrders });
    addNode(c.phoneHash, 'PHONE_HASH', c.phoneHash);
    addNode(c.emailHash, 'EMAIL_HASH', c.emailHash);
    addEdge(c.id, c.phoneHash, 'USES_PHONE');
    addEdge(c.id, c.emailHash, 'USES_EMAIL');
    for (const d of c.knownDevices) {
      addNode(d, 'DEVICE', d);
      addEdge(c.id, d, 'USES_DEVICE');
      const ip = DEVICE_IP_MAP[d];
      if (ip) {
        addNode(ip, 'IP_SUBNET', ip);
        addEdge(d, ip, 'CONNECTED_TO_IP');
      }
    }
    for (const a of c.knownAddresses) {
      addNode(a, 'ADDRESS_HASH', a);
      addEdge(c.id, a, 'USES_ADDRESS');
    }
  }

  for (const o of orders) {
    addNode(o.id, 'ORDER', o.id, { amount: o.amount, outcome: o.outcome });
    addEdge(o.customerId, o.id, 'PLACED_ORDER');
  }

  return { nodes, edges };
}
