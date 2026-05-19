/**
 * @file Petits utilitaires partagés.
 * Voir aussi : docs/modules/frontend/lib-other.md
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Fusionne plusieurs classes Tailwind en résolvant les conflits.
 * Pattern shadcn standard.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
