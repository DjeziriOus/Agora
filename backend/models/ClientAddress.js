import mongoose from 'mongoose';


const ClientAddressSchema = new mongoose.Schema({
  user: { type: String, required: true }, // Reference to the user
  recipientName: { type: String, required: true }, // Recipient's name
  recipientNameNormalized: { type: String, required: true },
  phone: { type: String, required: true },         // Phone number
  phoneNormalized: { type: String, required: true },
  email: { type: String },                        
  addressLabel: { type: String },                  // Address label (e.g., Home, Work)
  addressLine: { type: String, required: true },   // Detailed address
  addressLineNormalized: { type: String, required: true },
  city: { type: String, required: true },          
  cityNormalized: { type: String, required: true },
  province: { type: String,required: true },       
  provinceNormalized: { type: String, required: true },
  postalCode: { type: String, required: true },     
  postalCodeNormalized: { type: String, required: true },
  country: { type: String, required: true },       
  countryNormalized: { type: String, required: true },
  isDefault: { type: Boolean, default: false },    // Is this the default address
  createdAt: { type: Date, default: Date.now }     // Creation time
});

export default mongoose.model('ClientAddress', ClientAddressSchema);