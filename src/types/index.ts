export type Role = 'Admin' | 'Cashier' | 'Manager'


export interface User {
id: string
username: string
role: Role
email?: string
name?: string
}


export interface Product {
id: string
name: string
sku?: string
barcode?: string
barcodeImage?: string
price: number
mrp?: number
discountPrice?: number
discountAmount?: number
taxPercent?: number
stock: number
category?: string
// Variant support
parentProductId?: string // If set, this is a variant of the parent product
size?: string
color?: string
weight?: string
mfg?: string // Manufacturing date
image?: string // Image URL or base64
purchasePrice?: number // Variant-specific purchase price
sellingPrice?: number // Variant-specific selling price (overrides price)
taxRate?: number // Variant-specific tax rate (overrides taxPercent)
unit?: string
brand?: string
hsn?: string
discount?: number
discountType?: 'percentage' | 'flat'
discountValue?: number
location?: string
description?: string
status?: 'active' | 'inactive'
isFavorite?: boolean
isBestSeller?: boolean
createdAt?: string
updatedAt?: string
}


export interface CartItem {
id: string
productId: string
name: string
price: number
qty: number
taxPercent?: number
}


export interface Customer {
id: string
name: string
phone?: string
email?: string
}


export interface Invoice {
  id: string
  items: CartItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  customer?: Customer | null
  customerId?: string
  paymentMethod?: string
  paymentStatus?: string
  date: string
  createdDate?: string
  createdTime?: string
  refundTotal?: number
  refundStatus?: 'none' | 'partial' | 'full'
  status?: string
}
