import * as bcrypt from 'bcrypt';

/**
 * Nombre de rounds pour le hachage bcrypt (10 est un bon équilibre entre sécurité et performance)
 * Plus le nombre est élevé, plus c'est sécurisé mais plus c'est lent
 */
const SALT_ROUNDS = 10;

/**
 * Hash un mot de passe en utilisant bcrypt (algorithme optimisé pour les mots de passe)
 * Bcrypt gère automatiquement le salt et le nombre de rounds
 * @param password - Le mot de passe en clair
 * @returns Promise<string> - Le mot de passe hashé (contient déjà le salt)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Vérifie si un mot de passe correspond au hash
 * @param password - Le mot de passe en clair
 * @param hash - Le hash stocké (généré par hashPassword)
 * @returns Promise<boolean> - true si le mot de passe correspond
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
