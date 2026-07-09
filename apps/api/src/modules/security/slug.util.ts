import { customAlphabet } from 'nanoid';

// Unambiguous alphabet (no 0/O, 1/l/I confusion) — links are often read aloud or typed manually.
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Generates a non-sequential, non-guessable share slug. 21 characters from
 * a 58-character alphabet gives well over 120 bits of entropy — brute
 * forcing a specific link is infeasible, and unlike an auto-increment ID it
 * reveals nothing about how many files exist on the platform.
 */
export const generateSlug = customAlphabet(ALPHABET, 21);
