import type { Customer } from '../types/customer';
import type { OrderAddress } from '../types/order';

/**
 * Scenario Engine — generates realistic underlying data for demo scenarios.
 * NEVER hardcodes a final risk score.
 * Each scenario modifies customer records, device links, order history, etc.
 * The real risk engine then evaluates these features.
 */

export type ScenarioType =
  | 'GENUINE_BUYER'
  | 'NEW_CUSTOMER'
  | 'INCOMPLETE_ADDRESS'
  | 'SERIAL_RETURNER'
  | 'ABUSE_RING'
  | 'COD_SPIKE';

export interface ScenarioData {
  type: ScenarioType;
  label: string;
  description: string;
  customer: Customer;
  address: OrderAddress;
  deviceId: string;
  orderAmount: number;
}

const NOW = Date.now();
const DAY = 86400_000;

export function generateScenario(type: ScenarioType): ScenarioData {
  switch (type) {
    case 'GENUINE_BUYER':
      return {
        type, label: 'Genuine Buyer',
        description: 'A verified customer with strong delivery history and a complete address.',
        customer: {
          id: 'CUS_1001', name: 'Aarav Sharma',
          phoneHash: 'phone_hash_a1b2', emailHash: 'email_hash_c3d4',
          totalOrders: 24, successfulDeliveries: 22, rtoOrders: 1, cancelledOrders: 1,
          codOrders: 8, prepaidOrders: 16, averageOrderValue: 1850,
          knownDevices: ['DEV_A01'], knownAddresses: ['addr_hash_g01'],
          createdAt: NOW - 180 * DAY,
        },
        address: {
          line1: '42, Sector 15, Vasant Kunj',
          city: 'New Delhi', state: 'Delhi', pincode: '110070',
          landmark: 'Near DLF Mall',
        },
        deviceId: 'DEV_A01',
        orderAmount: 1999,
      };

    case 'NEW_CUSTOMER':
      return {
        type, label: 'New Customer',
        description: 'A brand new customer with no order history. Should NOT be auto-flagged as high risk.',
        customer: {
          id: 'CUS_2001', name: 'Anika Verma',
          phoneHash: 'phone_hash_u1v2', emailHash: 'email_hash_w3x4',
          totalOrders: 0, successfulDeliveries: 0, rtoOrders: 0, cancelledOrders: 0,
          codOrders: 0, prepaidOrders: 0, averageOrderValue: 0,
          knownDevices: ['DEV_A05'], knownAddresses: [],
          createdAt: NOW - 2 * DAY,
        },
        address: {
          line1: '18, Green Park Extension',
          city: 'New Delhi', state: 'Delhi', pincode: '110016',
          landmark: 'Near Green Park Metro Station',
        },
        deviceId: 'DEV_A05',
        orderAmount: 1299,
      };

    case 'INCOMPLETE_ADDRESS':
      return {
        type, label: 'Incomplete Address',
        description: 'A customer with decent history but a vague, incomplete delivery address.',
        customer: {
          id: 'CUS_5001', name: 'Arjun Mehta',
          phoneHash: 'phone_hash_q9r0', emailHash: 'email_hash_s1t2',
          totalOrders: 6, successfulDeliveries: 4, rtoOrders: 2, cancelledOrders: 0,
          codOrders: 4, prepaidOrders: 2, averageOrderValue: 1700,
          knownDevices: ['DEV_A04'], knownAddresses: ['addr_hash_m01'],
          createdAt: NOW - 60 * DAY,
        },
        address: {
          line1: 'near metro',
          city: 'Delhi', state: 'Delhi', pincode: '110001',
        },
        deviceId: 'DEV_A04',
        orderAmount: 2499,
      };

    case 'SERIAL_RETURNER':
      return {
        type, label: 'Serial Returner',
        description: 'A customer with many orders, most of which were COD, and a very high RTO rate.',
        customer: {
          id: 'CUS_3001', name: 'Rahul Dubey',
          phoneHash: 'phone_hash_k7l8', emailHash: 'email_hash_m9n0',
          totalOrders: 19, successfulDeliveries: 8, rtoOrders: 8, cancelledOrders: 3,
          codOrders: 17, prepaidOrders: 2, averageOrderValue: 2100,
          knownDevices: ['DEV_B01'], knownAddresses: ['addr_hash_s01'],
          createdAt: NOW - 200 * DAY,
        },
        address: {
          line1: 'House 44, Gomti Nagar',
          city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226010',
        },
        deviceId: 'DEV_B01',
        orderAmount: 2199,
      };

    case 'ABUSE_RING':
      return {
        type, label: 'Abuse Ring',
        description: 'A customer sharing a device and network with multiple high-RTO accounts. Indicates coordinated COD abuse.',
        customer: {
          id: 'CUS_4001', name: 'Ravi Kumar',
          phoneHash: 'phone_hash_a3b4', emailHash: 'email_hash_c5d6',
          totalOrders: 9, successfulDeliveries: 2, rtoOrders: 5, cancelledOrders: 2,
          codOrders: 9, prepaidOrders: 0, averageOrderValue: 3200,
          knownDevices: ['DEV_B03'], knownAddresses: ['addr_hash_r01'],
          createdAt: NOW - 30 * DAY,
        },
        address: {
          line1: 'Room 3, Sector 62',
          city: 'Noida', state: 'Uttar Pradesh', pincode: '201301',
        },
        deviceId: 'DEV_B03',
        orderAmount: 3499,
      };

    case 'COD_SPIKE':
      return {
        type, label: 'COD Spike',
        description: 'A sudden burst of COD orders creating velocity anomalies. Simulates coordinated COD abuse spike.',
        customer: {
          id: 'CUS_5002', name: 'Divya Chauhan',
          phoneHash: 'phone_hash_u3v4', emailHash: 'email_hash_w5x6',
          totalOrders: 12, successfulDeliveries: 8, rtoOrders: 3, cancelledOrders: 1,
          codOrders: 10, prepaidOrders: 2, averageOrderValue: 1100,
          knownDevices: ['DEV_B01'], knownAddresses: ['addr_hash_m02'],
          createdAt: NOW - 130 * DAY,
        },
        address: {
          line1: '22 Civil Lines',
          city: 'Jaipur', state: 'Rajasthan', pincode: '302001',
        },
        deviceId: 'DEV_B01',
        orderAmount: 1599,
      };
  }
}

export const ALL_SCENARIOS: ScenarioType[] = [
  'GENUINE_BUYER',
  'NEW_CUSTOMER',
  'INCOMPLETE_ADDRESS',
  'SERIAL_RETURNER',
  'ABUSE_RING',
  'COD_SPIKE',
];
