import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { PropertyCompany } from "@/lib/data"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUrlPath(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFKD')                // Normalize unicode characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[']/g, '-')             // Remove apostrophes
    .replace(/[^a-z0-9\s-]/g, '')    // Remove special characters
    .replace(/\s+/g, '-')            // Replace spaces with dashes
    .replace(/-+/g, '-')             // Replace multiple dashes with single dash
    .replace(/-+$/, '');             // Remove trailing dashes
}

// Helper function to group properties by normalized location
export function groupByNormalizedLocation(
  properties: PropertyCompany[], 
  locationKey: 'country' | 'state' | 'location'
) {
  const grouped = new Map<string, {
    normalizedName: string;
    displayName: string;
    properties: PropertyCompany[]}>();
  
  properties.forEach(property => {
    const normalizedLocation = formatUrlPath(property[locationKey]);
    if (!grouped.has(normalizedLocation)) {
      grouped.set(normalizedLocation, {
        normalizedName: normalizedLocation,
        displayName: property[locationKey], // Use the first occurrence as display name
        properties: []
      });
    }
    grouped.get(normalizedLocation)?.properties.push(property);
  });

  return Array.from(grouped.values());
}

export function shouldSkipCityPage(state: string, city: string): boolean {
  return state.toLowerCase() === city.toLowerCase() && state.toLowerCase() !== 'new york';
}

