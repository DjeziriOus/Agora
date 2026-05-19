/**
 * @file Modèle Mongoose des adresses de livraison.
 *
 * Particularité : chaque champ d'adresse a une version `*Normalized` (minuscules,
 * sans espaces ni tirets) calculée par le service. Sert à détecter les doublons.
 *
 * Voir aussi : docs/modules/backend/models-ClientAddress.md
 *
 * @swagger
 * components:
 *   schemas:
 *     ClientAddress:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         user: { type: string, description: "ID Better Auth de l'acheteur" }
 *         recipientName: { type: string }
 *         phone: { type: string }
 *         email: { type: string, format: email }
 *         addressLabel: { type: string, description: "ex: 'Domicile', 'Bureau'" }
 *         addressLine: { type: string }
 *         city: { type: string }
 *         province: { type: string }
 *         postalCode: { type: string }
 *         country: { type: string }
 *         isDefault: { type: boolean }
 *         createdAt: { type: string, format: date-time }
 */

import mongoose from 'mongoose';


const ClientAddressSchema = new mongoose.Schema({
  user: { type: String, required: true }, // ID Better Auth (string, pas ObjectId)
  recipientName: { type: String, required: true },
  recipientNameNormalized: { type: String, required: true },
  phone: { type: String, required: true },
  phoneNormalized: { type: String, required: true },
  email: { type: String },
  addressLabel: { type: String },
  addressLine: { type: String, required: true },
  addressLineNormalized: { type: String, required: true },
  city: { type: String, required: true },
  cityNormalized: { type: String, required: true },
  province: { type: String,required: true },
  provinceNormalized: { type: String, required: true },
  postalCode: { type: String, required: true },
  postalCodeNormalized: { type: String, required: true },
  country: { type: String, required: true },
  countryNormalized: { type: String, required: true },
  // Une seule adresse par utilisateur peut être marquée isDefault: true.
  // Cette contrainte est appliquée par le service (setDefaultAddress), pas
  // par le schéma.
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('ClientAddress', ClientAddressSchema);
