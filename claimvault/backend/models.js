const { Schema, model } = require('mongoose');

const User = model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  claimsFiled: { type: Number, default: 0 }
}, { timestamps: true }));

const repairLogSchema = new Schema({
  serviceDate: { type: Date, required: true },
  technicianName: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  cost: { type: Number, default: 0, min: 0 },
  coveredUnderWarranty: { type: Boolean, default: true }
}, { timestamps: true });

const productSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  category: { type: String, enum: ['Electronics', 'Appliances', 'Vehicles', 'Office', 'Other'], required: true },
  brand: { type: String, required: true, trim: true },
  serialNumber: { type: String, required: true, trim: true },
  purchaseDate: { type: Date, required: true },
  warrantyMonths: { type: Number, required: true, min: 1 },
  expiryDate: { type: Date, required: true },
  price: { type: Number, required: true, min: 0 },
  receipt: { type: String, default: '' },
  isBookmarked: { type: Boolean, default: false },
  repairLogs: [repairLogSchema]
}, { timestamps: true, toJSON: { virtuals: true } });

productSchema.virtual('status').get(function () {
  const days = (this.expiryDate - Date.now()) / 864e5;
  return days < 0 ? 'Expired' : days <= 30 ? 'Expiring Soon' : 'Active';
});

module.exports = { User, Product: model('Product', productSchema) };
