import Airtable from 'airtable';
import { promises as fs } from 'fs';
import path from 'path';
import { cache } from 'react'
import 'react-virtualized/styles.css'
import { Record, FieldSet } from 'airtable';
import summaries from '../scripts/summaries.json';

export interface PropertyCompany {
  actualID: string;
  id: string;
  name: string;
  logo: string;
  website: string;
  country: string;
  state: string;
  location: string;
  introBlog?: string;
  blog?: string;
  oneLiner?: string;
  facebook?: string;
  linkedin?: string;
  twitter?: string;
  employees?: number;
  yearFounded?: number;
  description?: string;
  images: string[];
  airbnbUrl?: string;
  propertyCount?: number;
  totalReviews?: number;
  rating?: number;
  otherStates?: string[];
  otherCities?: string[];
  isVerified?: boolean;
  tags?: string;
  socialMedia?: {
    facebook?: string;
    linkedin?: string;
    twitter?: string;
  };
  keyFeatures?: string;
}

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID!);

let companiesCache: PropertyCompany[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

// Add retry logic helper
export async function fetchWithRetry(fn: () => Promise<any>, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
}

export const getPropertyCompanies = cache(async (): Promise<PropertyCompany[]> => {
  // Return cached data if valid
  if (companiesCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return companiesCache;
  }

  try {
    // Fetch location data with retry logic
    const [countryRecords, stateRecords, cityRecords] = await Promise.all([
      fetchWithRetry(() => base('Countries').select().all()),
      fetchWithRetry(() => base('States').select().all()),
      fetchWithRetry(() => base('Cities').select().all())
    ]);

    // Create maps for each location type
    const countryMap = new Map();
    const stateMap = new Map();
    const cityMap = new Map();

    countryRecords.forEach((record: Record<FieldSet>) => {
      countryMap.set(record.id, record.get('Country Name'));
    });

    stateRecords.forEach((record: Record<FieldSet>) => {
      stateMap.set(record.id, record.get('State Name'));
    });

    cityRecords.forEach((record: Record<FieldSet>) => {
      cityMap.set(record.id, record.get('City Name'));
    });

    // Fetch company records with retry
    const records = await fetchWithRetry(() => 
      base('Marketplace').select({ view: 'Grid view' }).all()
    );

    const companies: PropertyCompany[] = [];



    const featureMap = new Map<string, string>();
    summaries.forEach(item => {
  // item.id must match your record's "actualID" or "id"
  featureMap.set(item.id, item.summary);
});

    for (const record of records) {
      const name = record.get('Company Name')?.toString();
      if (!name) continue;

      // Get the logo URL properly from Airtable attachment
      const logoUrl = record.get('Company Logo')?.toString() || '/placeholder.svg';
      
      // Get the linked record IDs
      const countryId = (record.get('HQ Country') as string[])?.[0];
      const stateId = (record.get('HQ State') as string[])?.[0];
      const cityId = (record.get('HQ City') as string[])?.[0];

      const company: PropertyCompany = {
        actualID: record.id,
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        logo: logoUrl,
        website: record.get('Company Website')?.toString() || '#',
        country: countryMap.get(countryId) || 'Unknown Country',
        state: stateMap.get(stateId) || 'Unknown State',
        location: cityMap.get(cityId) || 'Unknown City',
        introBlog: record.get('Intro Blog')?.toString(),
        blog: record.get('Blog')?.toString(),
        oneLiner:
          record.get('One liner')?.toString(),
        facebook: record.get('Facebook')?.toString(),
        linkedin: record.get('LinkedIn')?.toString(),
        twitter: record.get('X Link')?.toString(),
        employees: Number(record.get('Employees')) || undefined,
        yearFounded: Number(record.get('Year Founded')) || undefined,
        description: record.get('Intro Blog')?.toString(),
      images: [
          record.get('Image 1')?.toString() || '',
          record.get('Image 2')?.toString() || '',
          record.get('Image 3')?.toString() || '',
          record.get('Image 4')?.toString() || '',
          record.get('Image 5')?.toString() || '',
        ].filter(img => img && (img.startsWith('http') || img.startsWith('/'))),
        airbnbUrl: record.get('Airbnb Host URL')?.toString(),
        propertyCount: Number(record.get('A.Listings')) || undefined,
        totalReviews: Number(record.get('A.Reviews')) || undefined,
        rating: Number(record.get('A.Rating')) || undefined,
        otherStates: record
          .get('Other States')
          ?.toString()
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean),
        otherCities: record
          .get('Other Cities')
          ?.toString()
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean),
        isVerified: record.get('Is Verified?') === true,
        tags: record.get('Type')?.toString(),
      socialMedia: {
          facebook: record.get('Facebook')?.toString(),
          linkedin: record.get('LinkedIn')?.toString(),
          twitter: record.get('X Link')?.toString(),
        },
        keyFeatures: featureMap.get(record.id) // might be HTML, or plain text, etc.

      };

      companies.push(company);
    }

    // Update cache
    companiesCache = companies;
    cacheTimestamp = Date.now();
    
    return companies;
  } catch (error) {
    console.error('Error fetching data from Airtable:', error);
    if (companiesCache) {
      console.log('Returning cached data due to fetch error');
      return companiesCache;
    }
    throw new Error('Failed to fetch data and no cache available');
  }
});

// Add individual property getter with caching
export const getPropertyById = cache(async (id: string): Promise<PropertyCompany | undefined> => {
  const companies = await getPropertyCompanies();
  return companies.find(c => c.id === id);
});

// Add this function before getPropertyWithRelated
export const getRelatedProperties = cache(async (id: string): Promise<PropertyCompany[]> => {
  const companies = await getPropertyCompanies();
  const property = companies.find(c => c.id === id);
  
  if (!property) return [];
  
  return companies.filter(c => 
    c.id !== id && 
    (c.state === property.state || c.location === property.location)
  ).slice(0, 5);
});

// Add parallel data fetching
export async function getPropertyWithRelated(id: string) {
  const [property, relatedProperties] = await Promise.all([
    getPropertyById(id),
    getRelatedProperties(id)
  ]);
  
  return { property, relatedProperties };
}

// Add these functions to get location data
export async function getCountryData(countryName: string) {
  try {
    const cleanCountryName = decodeURIComponent(countryName)
      .replace(/-/g, ' ')  // Replace hyphens with spaces
      .replace(/(^|\s)\w/g, l => l.toUpperCase());  // Capitalize first letter of each word

    // Encode the country name for the API request
    const encodedCountryName = encodeURIComponent(cleanCountryName);

    const records = await fetchWithRetry(() => 
      base('Countries')
        .select({
          filterByFormula: `{Country Name} = '${encodedCountryName}'`
        })
        .all()
    );


    
    // Get the first record that has a Country Bio
    const bioRecord = records.find((record: Record<FieldSet>) => record.fields['Country Bio']);
    return bioRecord?.fields['Country Bio']?.toString() || null;
  } catch (error) {
    console.error('Error fetching country data:', error);
    return null; // Return null instead of throwing error
  }
}

export async function getStateData(stateName: string) {
  try {
    const cleanStateName = decodeURIComponent(stateName)
      .replace(/-/g, ' ')
      .replace(/(^|\s)\w/g, l => l.toUpperCase());

    const encodedStateName = encodeURIComponent(cleanStateName);

    const records = await fetchWithRetry(() => 
      base('States')
        .select({
          filterByFormula: `{State Name} = '${encodedStateName}'`
        })
        .all()
    );
    
    const bioRecord = records.find((record: Record<FieldSet>) => record.fields['State Bio']);
    return bioRecord?.fields['State Bio']?.toString() || null;
  } catch (error) {
    console.error('Error fetching state data:', error);
    return null;
  }
}

export async function getCityData(cityName: string) {
  try {

    const cleanCityName = decodeURIComponent(cityName)
      .replace(/-/g, ' ')  // Replace hyphens with spaces
      .replace(/(^|\s)\w/g, l => l.toUpperCase());  // Capitalize first letter of each word

   

    const records = await base('Cities')
      .select({
        filterByFormula: `{City Name} = '${cleanCityName}'`
      })
      .all();
    
    
    // Find the record that has a City Bio field
    const bioRecord = records.find((record: Record<FieldSet>) => record.fields['City Bio']);
    // console.log('Bio record found:', !!bioRecord);
    // console.log('Bio content:', bioRecord?.fields['City Bio']?.toString());

    const result = bioRecord?.fields['City Bio']?.toString();
    // console.log('Returning:', result);
    
    return result;
  } catch (error) {
    console.error('Error in getCityData:', error);
    return null;
  }
}
