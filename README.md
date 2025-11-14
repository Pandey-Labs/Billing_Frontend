# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```


✅ Product Data Fields
🔹 Required Fields (must have)

Product Name – e.g., Amul Milk 1L

Category – e.g., Dairy, Grocery, Electronics

SKU / Product Code (unique identifier)

Unit of Measure (UOM) – pcs, kg, liter, pack

Purchase Price (Cost Price)

Selling Price (MRP / Retail Price)

Tax Rate (GST / VAT %)

Stock Quantity / Opening Stock

Reorder Level (Low Stock Alert Point)

🔹 Optional but Recommended Fields

Barcode / QR Code

Brand – e.g., Amul, Nestlé

HSN / SAC Code (useful for GST billing in India)

Discount (%) or Offer Price

Supplier / Vendor Name

Batch Number (for packaged items)

Expiry Date / Manufacturing Date (for perishable items)

Product Image / Thumbnail (for POS UI)

Description / Notes (short product details)

Storage Location / Shelf / Rack No.

Weight / Dimensions (if applicable)

Color / Size / Variant (for apparel, electronics, etc.)

Status – Active / Inactive (to disable old products)

🔹 Advanced (optional, if needed later)

Loyalty Points per Item (if your shop runs a points system)

Warranty / Guarantee Period (for electronics, appliances)

Min/Max Order Quantity (for wholesale shops)

Unit Conversion (e.g., 1 case = 12 pcs)

Online Availability Flag (if later integrating with e-commerce)