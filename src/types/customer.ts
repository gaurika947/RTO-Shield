export interface Customer {
  id: string;                  // CUS_xxxx
  name: string;
  phoneHash: string;           // phone_hash_xxxx
  emailHash: string;           // email_hash_xxxx
  totalOrders: number;
  successfulDeliveries: number;
  rtoOrders: number;
  cancelledOrders: number;
  codOrders: number;
  prepaidOrders: number;
  averageOrderValue: number;
  knownDevices: string[];      // DEV_xxxx
  knownAddresses: string[];    // addr_hash_xxxx
  createdAt: number;           // timestamp
  trustScore?: number;         // 0-100
}
