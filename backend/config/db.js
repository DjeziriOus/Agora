/**
 * @file Connexion Mongoose à MongoDB.
 *
 * Ce module est appelé une seule fois au démarrage par {@link module:server},
 * juste avant que l'application n'écoute le port HTTP.
 */

import mongoose from 'mongoose';

/**
 * Établit la connexion Mongoose à la base MongoDB définie par `process.env.MONGO_URI`.
 *
 * En cas d'échec :
 *   - L'erreur est loggée en console.
 *   - Le processus Node sort avec le code 1 (échec) — le serveur n'a aucune raison
 *     de tourner si la base est inaccessible.
 *
 * @async
 * @function connectDB
 * @returns {Promise<void>} Se résout quand la connexion est établie.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

export default connectDB;
