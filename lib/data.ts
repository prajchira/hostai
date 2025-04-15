import Airtable from "airtable";
import { promises as fs } from "fs";
import path from "path";
import { cache } from "react";
import "react-virtualized/styles.css";
import { Record, FieldSet } from "airtable";
import summaries from "../scripts/summaries.json";
import { formatUrlPath } from "./utils";

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
export async function fetchWithRetry(
    fn: () => Promise<any>,
    retries = 3,
    delay = 1000
) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise((resolve) =>
                setTimeout(resolve, delay * (i + 1))
            );
        }
    }
}

export const getPropertyCompanies = cache(
    async (): Promise<PropertyCompany[]> => {
        // Return cached data if valid
        if (
            companiesCache &&
            cacheTimestamp &&
            Date.now() - cacheTimestamp < CACHE_DURATION
        ) {
            return companiesCache;
        }

        try {
            // Fetch location data with retry logic
            const [countryRecords, stateRecords, cityRecords] =
                await Promise.all([
                    fetchWithRetry(() => base("Countries").select().all()),
                    fetchWithRetry(() => base("States").select().all()),
                    fetchWithRetry(() => base("Cities").select().all()),
                ]);

            // Create maps for each location type
            const countryMap = new Map();
            const stateMap = new Map();
            const cityMap = new Map();

            countryRecords.forEach((record: Record<FieldSet>) => {
                countryMap.set(record.id, record.get("Country Name"));
            });

            stateRecords.forEach((record: Record<FieldSet>) => {
                stateMap.set(record.id, record.get("State Name"));
            });

            cityRecords.forEach((record: Record<FieldSet>) => {
                cityMap.set(record.id, record.get("City Name"));
            });

            // Fetch company records with retry
            const records = await fetchWithRetry(() =>
                base("Marketplace").select({ view: "Grid view" }).all()
            );

            const companies: PropertyCompany[] = [];

            const featureMap = new Map<string, string>();
            summaries.forEach((item) => {
                // item.id must match your record's "actualID" or "id"
                featureMap.set(item.id, item.summary);
            });

            for (const record of records) {
                const name = record.get("Company Name")?.toString();
                if (!name) continue;

                // Get the logo URL properly from Airtable attachment
                const logoUrl =
                    record.get("Company Logo")?.toString() ||
                    "/placeholder.svg";

                // Get the linked record IDs
                const countryId = (record.get("HQ Country") as string[])?.[0];
                const stateId = (record.get("HQ State") as string[])?.[0];
                const cityId = (record.get("HQ City") as string[])?.[0];

                const company: PropertyCompany = {
                    actualID: record.id,
                    id: name.toLowerCase().replace(/\s+/g, "-"),
                    name,
                    logo: logoUrl,
                    website: record.get("Company Website")?.toString() || "#",
                    country: countryMap.get(countryId) || "Unknown Country",
                    state: stateMap.get(stateId) || "Unknown State",
                    location: cityMap.get(cityId) || "Unknown City",
                    introBlog: record.get("Intro Blog")?.toString(),
                    blog: record.get("Blog")?.toString(),
                    oneLiner: record.get("One liner")?.toString(),
                    facebook: record.get("Facebook")?.toString(),
                    linkedin: record.get("LinkedIn")?.toString(),
                    twitter: record.get("X Link")?.toString(),
                    employees: Number(record.get("Employees")) || undefined,
                    yearFounded:
                        Number(record.get("Year Founded")) || undefined,
                    description: record.get("Intro Blog")?.toString(),
                    images: [
                        record.get("Image 1")?.toString() || "",
                        record.get("Image 2")?.toString() || "",
                        record.get("Image 3")?.toString() || "",
                        record.get("Image 4")?.toString() || "",
                        record.get("Image 5")?.toString() || "",
                    ].filter(
                        (img) =>
                            img &&
                            (img.startsWith("http") || img.startsWith("/"))
                    ),
                    airbnbUrl: record.get("Airbnb Host URL")?.toString(),
                    propertyCount:
                        Number(record.get("A.Listings")) || undefined,
                    totalReviews: Number(record.get("A.Reviews")) || undefined,
                    rating: Number(record.get("A.Rating")) || undefined,
                    otherStates: record
                        .get("Other States")
                        ?.toString()
                        .split(",")
                        .map((s: string) => s.trim())
                        .filter(Boolean),
                    otherCities: record
                        .get("Other Cities")
                        ?.toString()
                        .split(",")
                        .map((s: string) => s.trim())
                        .filter(Boolean),
                    isVerified: record.get("Is Verified?") === true,
                    tags: record.get("Type")?.toString(),
                    socialMedia: {
                        facebook: record.get("Facebook")?.toString(),
                        linkedin: record.get("LinkedIn")?.toString(),
                        twitter: record.get("X Link")?.toString(),
                    },
                    keyFeatures: featureMap.get(record.id), // might be HTML, or plain text, etc.
                };

                companies.push(company);
            }

            // Update cache
            companiesCache = companies;
            cacheTimestamp = Date.now();

            return companies;
        } catch (error) {
            console.error("Error fetching data from Airtable:", error);
            if (companiesCache) {
                console.log("Returning cached data due to fetch error");
                return companiesCache;
            }
            throw new Error("Failed to fetch data and no cache available");
        }
    }
);

// Add individual property getter with caching
export const getPropertyById = cache(async (id: string): Promise<PropertyCompany | undefined> => {
    try {
        // Fetch single record directly instead of filtering
        const records = await fetchWithRetry(() =>
            base("Marketplace")
                .select({
                    filterByFormula: `RECORD_ID() = '${id}'`,
                    maxRecords: 1
                })
                .all()
        );

        if (!records || records.length === 0) return undefined;
        const record = records[0];  // Get first record from array

        // Get the linked record IDs
        const countryId = (record.get("HQ Country") as string[])?.[0];
        const stateId = (record.get("HQ State") as string[])?.[0];
        const cityId = (record.get("HQ City") as string[])?.[0];

        // Parallel fetch location names only if needed
        const [countryName, stateName, cityName] = await Promise.all([
            countryId ? fetchLocationName("Countries", countryId, "Country Name") : Promise.resolve("Unknown Country"),
            stateId ? fetchLocationName("States", stateId, "State Name") : Promise.resolve("Unknown State"),
            cityId ? fetchLocationName("Cities", cityId, "City Name") : Promise.resolve("Unknown City")
        ]);

        const name = record.get("Company Name")?.toString();
        if (!name) return undefined;

        // Get feature summary
        const featureSummary = summaries.find(item => item.id === record.id)?.summary;

        // Return formatted property data
        return {
            actualID: record.id,
            id: name.toLowerCase().replace(/\s+/g, "-"),
            name,
            logo: record.get("Company Logo")?.toString() || "/placeholder.svg",
            website: record.get("Company Website")?.toString() || "#",
            country: countryName,
            state: stateName,
            location: cityName,
            introBlog: record.get("Intro Blog")?.toString(),
            blog: record.get("Blog")?.toString(),
            oneLiner: record.get("One liner")?.toString(),
            facebook: record.get("Facebook")?.toString(),
            linkedin: record.get("LinkedIn")?.toString(),
            twitter: record.get("X Link")?.toString(),
            employees: Number(record.get("Employees")) || undefined,
            yearFounded: Number(record.get("Year Founded")) || undefined,
            description: record.get("Intro Blog")?.toString(),
            images: [
                record.get("Image 1")?.toString() || "",
                record.get("Image 2")?.toString() || "",
                record.get("Image 3")?.toString() || "",
                record.get("Image 4")?.toString() || "",
                record.get("Image 5")?.toString() || "",
            ].filter(img => img && (img.startsWith("http") || img.startsWith("/"))),
            airbnbUrl: record.get("Airbnb Host URL")?.toString(),
            propertyCount: Number(record.get("A.Listings")) || undefined,
            totalReviews: Number(record.get("A.Reviews")) || undefined,
            rating: Number(record.get("A.Rating")) || undefined,
            otherStates: record.get("Other States")?.toString().split(",").map((s: string) => s.trim()).filter(Boolean),
            otherCities: record.get("Other Cities")?.toString().split(",").map((s: string) => s.trim()).filter(Boolean),
            isVerified: record.get("Is Verified?") === true,
            tags: record.get("Type")?.toString(),
            socialMedia: {
                facebook: record.get("Facebook")?.toString(),
                linkedin: record.get("LinkedIn")?.toString(),
                twitter: record.get("X Link")?.toString(),
            },
            keyFeatures: featureSummary,
        };
    } catch (error) {
        console.error("Error fetching property:", error);
        return undefined;
    }
});

// Add this function before getPropertyWithRelated
export const getRelatedProperties = cache(async (id: string): Promise<PropertyCompany[]> => {
  try {
    // First get the main property's state and city directly
    const mainRecord = await fetchWithRetry(() =>
        base("Marketplace")
            .select({
                filterByFormula: `RECORD_ID() = '${id}'`,
                maxRecords: 1
            })
            .all()
    );

    if (!mainRecord || mainRecord.length === 0) return [];

    const stateId = (mainRecord[0].get("HQ State") as string[])?.[0];
    const cityId = (mainRecord[0].get("HQ City") as string[])?.[0];

    if (!stateId && !cityId) return [];

    // Build the filter formula for related properties
    const filterFormula = `AND(
        RECORD_ID() != '${id}',
        OR(
            {HQ State} = '${stateId}',
            {HQ City} = '${cityId}'
        )
    )`;

    // Fetch related records
    const relatedRecords = await fetchWithRetry(() =>
        base("Marketplace")
            .select({
                filterByFormula: filterFormula,
                maxRecords: 5
            })
            .all()
    );

    // Convert records to PropertyCompany objects
    const relatedProperties = await Promise.all(
        relatedRecords.map(async (record: Record<FieldSet>) => {
            const countryId = (record.get("HQ Country") as string[])?.[0];
            const stateId = (record.get("HQ State") as string[])?.[0];
            const cityId = (record.get("HQ City") as string[])?.[0];

            const [countryName, stateName, cityName] = await Promise.all([
                countryId
                    ? fetchLocationName("Countries", countryId, "Country Name")
                    : Promise.resolve("Unknown Country"),
                stateId
                    ? fetchLocationName("States", stateId, "State Name")
                    : Promise.resolve("Unknown State"),
                cityId
                    ? fetchLocationName("Cities", cityId, "City Name")
                    : Promise.resolve("Unknown City"),
            ]);

            const name = record.get("Company Name")?.toString();
            if (!name) return null;

            const featureSummary = summaries.find(
                (item) => item.id === record.id
            )?.summary;

            return {
                actualID: record.id,
                id: name.toLowerCase().replace(/\s+/g, "-"),
                name,
                logo: record.get("Company Logo")?.toString() || "/placeholder.svg",
                website: record.get("Company Website")?.toString() || "#",
                country: countryName,
                state: stateName,
                location: cityName,
                introBlog: record.get("Intro Blog")?.toString(),
                blog: record.get("Blog")?.toString(),
                oneLiner: record.get("One liner")?.toString(),
                facebook: record.get("Facebook")?.toString(),
                linkedin: record.get("LinkedIn")?.toString(),
                twitter: record.get("X Link")?.toString(),
                employees: Number(record.get("Employees")) || undefined,
                yearFounded: Number(record.get("Year Founded")) || undefined,
                description: record.get("Intro Blog")?.toString(),
                images: [
                    record.get("Image 1")?.toString() || "",
                    record.get("Image 2")?.toString() || "",
                    record.get("Image 3")?.toString() || "",
                    record.get("Image 4")?.toString() || "",
                    record.get("Image 5")?.toString() || "",
                ].filter(img => img && (img.startsWith("http") || img.startsWith("/"))),
                airbnbUrl: record.get("Airbnb Host URL")?.toString(),
                propertyCount: Number(record.get("A.Listings")) || undefined,
                totalReviews: Number(record.get("A.Reviews")) || undefined,
                rating: Number(record.get("A.Rating")) || undefined,
                otherStates: record.get("Other States")?.toString().split(",").map((s: string) => s.trim()).filter(Boolean),
                otherCities: record.get("Other Cities")?.toString().split(",").map((s: string) => s.trim()).filter(Boolean),
                isVerified: record.get("Is Verified?") === true,
                tags: record.get("Type")?.toString(),
                socialMedia: {
                    facebook: record.get("Facebook")?.toString(),
                    linkedin: record.get("LinkedIn")?.toString(),
                    twitter: record.get("X Link")?.toString(),
                },
                keyFeatures: featureSummary,
            };
        })
    );

    return relatedProperties.filter((p): p is PropertyCompany => p !== null);
} catch (error) {
    console.error("Error fetching related properties:", error);
    return [];
}
});

// Add parallel data fetching
export const getPropertyWithRelated = cache(async (id: string) => {
    const [property, relatedProperties] = await Promise.all([
        getPropertyById(id),
        getRelatedProperties(id),
    ]);

    return { property, relatedProperties };
});

// Add a more comprehensive cache for all location data
const locationCache = new Map<string, {
  id: string;
  name: string;
  table: string;
}[]>();

// Prefetch and cache all location data at once
async function prefetchLocations(table: string) {
  if (locationCache.has(table)) return;
  
  // Fix the field name construction
  const fieldName = table === 'Countries' ? 'Country Name' :
                   table === 'States' ? 'State Name' :
                   'City Name';
  
  const records = await fetchWithRetry(() => 
    base(table)
      .select({
        fields: [fieldName]
      })
      .all()
  );
  
  locationCache.set(table, records.map((record: Record<FieldSet>) => ({
    id: record.id,
    name: record.get(fieldName)?.toString() || `Unknown ${table.slice(0, -1)}`,
    table
  })));
}

// Add this helper function to check if a location exists
async function checkLocationExists(name: string, type: 'Countries' | 'States' | 'Cities'): Promise<string | null> {
  try {
    // Get the correct field name based on type
    const fieldName = type === 'Countries' ? 'Country Name' :
                     type === 'States' ? 'State Name' :
                     'City Name';

    const records = await fetchWithRetry(() =>
      base(type)
        .select({
          filterByFormula: `{${fieldName}} = '${name}'`,
          fields: [fieldName]
        })
        .all()
    );
    
    return records[0]?.get(fieldName)?.toString() || null;
  } catch (error) {
    console.error(`Error checking ${type} name:`, error);
    return null;
  }
}

// Add a list of special location names that should preserve dashes
const PRESERVE_DASHES = new Set([
  'emilia-romagna',
]);

async function normalizeLocationName(name: string, type: 'Countries' | 'States' | 'Cities'): Promise<string> {
  const decoded = decodeURIComponent(name).toLowerCase();
  
  // Check if this is a special case that should preserve dashes
  if (PRESERVE_DASHES.has(decoded)) {
    return decoded
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('-');
  }

  // Handle apostrophes first
  const apostropheFixed = decoded
    .replace(/['']/g, "'") // Normalize different types of apostrophes
    .replace(/-/g, ' '); // Replace dashes with spaces
    

  // Try exact match first
  const exactMatch = await checkLocationExists(apostropheFixed, type);
  if (exactMatch) return exactMatch;

  // If no match, format consistently
  return apostropheFixed
    .split(' ')
    .map(word => {
      if (word.includes("'")) {
        // Special handling for words with apostrophes (e.g., d'Alene, O'Brien)
        return word.split("'")
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join("'");
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// Add a cache for linked records
const linkedRecordCache = new Map<string, Record<FieldSet>>();

// Optimize property transformation with batch fetching
async function transformProperties(records: Record<FieldSet>[]) {
  console.time('Property Transform Total');
  
  // 1. First collect all unique location IDs
  console.time('Collect IDs');
  const locationIds = {
    Countries: new Set<string>(),
    States: new Set<string>(),
    Cities: new Set<string>()
  };

  records.forEach(record => {
    const countryId = (record.get('HQ Country') as string[])?.[0];
    const stateId = (record.get('HQ State') as string[])?.[0];
    const cityId = (record.get('HQ City') as string[])?.[0];
    
    if (countryId) locationIds.Countries.add(countryId);
    if (stateId) locationIds.States.add(stateId);
    if (cityId) locationIds.Cities.add(cityId);
  });
  console.timeEnd('Collect IDs');

  // 2. Batch fetch all locations in parallel
  console.time('Batch Location Fetch');
  await Promise.all([
    prefetchLocations('Countries'),
    prefetchLocations('States'),
    prefetchLocations('Cities')
  ]);
  console.timeEnd('Batch Location Fetch');

  // 3. Transform records using cached data
  console.time('Transform Records');
  const properties = records.map(record => {
    const countryId = (record.get('HQ Country') as string[])?.[0];
    const stateId = (record.get('HQ State') as string[])?.[0];
    const cityId = (record.get('HQ City') as string[])?.[0];

    // Use cached location data
    const countryName = locationCache.get('Countries')?.find(c => c.id === countryId)?.name || 'Unknown Country';
    const stateName = locationCache.get('States')?.find(s => s.id === stateId)?.name || 'Unknown State';
    const cityName = locationCache.get('Cities')?.find(c => c.id === cityId)?.name || 'Unknown City';

    return {
      actualID: record.id,
      id: record.get('Company Name')?.toString()?.toLowerCase().replace(/\s+/g, '-') || '',
      name: record.get('Company Name')?.toString() || '',
      logo: record.get('Company Logo')?.toString() || '/placeholder.svg',
      website: record.get('Company Website')?.toString() || '#',
      country: countryName,
      state: stateName,
      location: cityName,
      description: record.get('Intro Blog')?.toString(),
      oneLiner: record.get('One liner')?.toString(),
      propertyCount: Number(record.get('A.Listings')) || undefined,
      rating: Number(record.get('A.Rating')) || undefined,
      isVerified: record.get('Is Verified?') === true,
      totalReviews: Number(record.get('A.Reviews')) || undefined,
    };
  });
  console.timeEnd('Transform Records');

  console.timeEnd('Property Transform Total');
  return properties;
}

// Update the data fetching functions to use the new transformer
export const getCountryData = cache(async (country: string) => {
  console.time('getCountryData Total');
  
  const formattedCountry = await normalizeLocationName(country, 'Countries');

  const [countryRecords, propertyRecords] = await Promise.all([
    fetchWithRetry(() =>
      base('Countries')
        .select({
          filterByFormula: `{Country Name} = '${formattedCountry}'`,
          fields: ['Country Bio']
        })
        .all()
    ),
    fetchWithRetry(() =>
      base('Marketplace')
        .select({
          filterByFormula: `{HQ Country} = '${formattedCountry}'`,
          fields: [
            'Company Name', 'Company Logo', 'Company Website',
            'HQ Country', 'HQ State', 'HQ City',
            'Intro Blog', 'One liner', 'A.Listings',
            'A.Rating', 'Is Verified?', 'A.Reviews'
          ]
        })
        .all()
    )
  ]);

  const properties = await transformProperties(propertyRecords);

  console.timeEnd('getCountryData Total');
  return {
    records: properties,
    countryBio: countryRecords[0]?.get('Country Bio')?.toString()
  };
});

export const getStateData = cache(async (state: string, country: string) => {
  console.time('getStateData Total');
  
  const formattedState = await normalizeLocationName(state, 'States');
  const formattedCountry = await normalizeLocationName(country, 'Countries');

  // Prefetch all location data in parallel if not already cached
  console.time('Location Prefetch');
  await Promise.all([
    prefetchLocations('Countries'),
    prefetchLocations('States'),
    prefetchLocations('Cities')
  ]);
  console.timeEnd('Location Prefetch');

  console.time('Data Fetching');
  const [stateRecords, propertyRecords] = await Promise.all([
    fetchWithRetry(() =>
      base('States')
        .select({
          filterByFormula: `{State Name} = '${formattedState}'`,
          fields: ['State Bio']
        })
        .all()
    ),
    fetchWithRetry(() =>
      base('Marketplace')
        .select({
          filterByFormula: `AND({HQ State} = '${formattedState}', {HQ Country} = '${formattedCountry}')`
        })
        .all()
    )
  ]);
  console.timeEnd('Data Fetching');

  console.time('Property Transformation');
  const properties = propertyRecords.map((record: Record<FieldSet>) => {
    const countryId = (record.get('HQ Country') as string[])?.[0];
    const stateId = (record.get('HQ State') as string[])?.[0];
    const cityId = (record.get('HQ City') as string[])?.[0];

    // Use cached location data
    const countryName = locationCache.get('Countries')?.find(c => c.id === countryId)?.name || 'Unknown Country';
    const stateName = locationCache.get('States')?.find(s => s.id === stateId)?.name || 'Unknown State';
    const cityName = locationCache.get('Cities')?.find(c => c.id === cityId)?.name || 'Unknown City';
    
    return {
      actualID: record.id,
      id: record.get('Company Name')?.toString()?.toLowerCase().replace(/\s+/g, '-') || '',
      name: record.get('Company Name')?.toString() || '',
      logo: record.get('Company Logo')?.toString() || '/placeholder.svg',
      website: record.get('Company Website')?.toString() || '#',
      country: countryName,
      state: stateName,
      location: cityName,
      description: record.get('Intro Blog')?.toString(),
      oneLiner: record.get('One liner')?.toString(),
      propertyCount: Number(record.get('A.Listings')) || undefined,
      rating: Number(record.get('A.Rating')) || undefined,
      isVerified: record.get('Is Verified?') === true,
      totalReviews: Number(record.get('A.Reviews')) || undefined,
    };
  });
  console.timeEnd('Property Transformation');

  console.timeEnd('getStateData Total');
  return {
    records: properties,
    stateBio: stateRecords[0]?.get('State Bio')?.toString()
  };
});

export const getCityData = cache(async (city: string, state: string, country: string) => {
  console.time('getCityData Total');
  
  const formattedCity = await normalizeLocationName(city, 'Cities');
  const formattedState = await normalizeLocationName(state, 'States');
  const formattedCountry = await normalizeLocationName(country, 'Countries');

  // Use existing location cache
  console.time('Location Prefetch');
  await Promise.all([
    prefetchLocations('Countries'),
    prefetchLocations('States'),
    prefetchLocations('Cities')
  ]);
  console.timeEnd('Location Prefetch');

  console.time('Data Fetching');
  const [cityRecords, propertyRecords] = await Promise.all([
    fetchWithRetry(() =>
      base('Cities')
        .select({
          filterByFormula: `{City Name} = '${formattedCity}'`,
          fields: ['City Bio']
        })
        .all()
    ),
    fetchWithRetry(() =>
      base('Marketplace')
        .select({
          filterByFormula: `AND({HQ City} = '${formattedCity}', {HQ State} = '${formattedState}', {HQ Country} = '${formattedCountry}')`
        })
        .all()
    )
  ]);
  console.timeEnd('Data Fetching');

  console.time('Property Transformation');
  const properties = propertyRecords.map((record: Record<FieldSet>) => {
    const countryId = (record.get('HQ Country') as string[])?.[0];
    const stateId = (record.get('HQ State') as string[])?.[0];
    const cityId = (record.get('HQ City') as string[])?.[0];

    // Use cached location data
    const countryName = locationCache.get('Countries')?.find(c => c.id === countryId)?.name || 'Unknown Country';
    const stateName = locationCache.get('States')?.find(s => s.id === stateId)?.name || 'Unknown State';
    const cityName = locationCache.get('Cities')?.find(c => c.id === cityId)?.name || 'Unknown City';
    
    return {
      actualID: record.id,
      id: record.get('Company Name')?.toString()?.toLowerCase().replace(/\s+/g, '-') || '',
      name: record.get('Company Name')?.toString() || '',
      logo: record.get('Company Logo')?.toString() || '/placeholder.svg',
      website: record.get('Company Website')?.toString() || '#',
      country: countryName,
      state: stateName,
      location: cityName,
      description: record.get('Intro Blog')?.toString(),
      oneLiner: record.get('One liner')?.toString(),
      propertyCount: Number(record.get('A.Listings')) || undefined,
      rating: Number(record.get('A.Rating')) || undefined,
      isVerified: record.get('Is Verified?') === true,
      totalReviews: Number(record.get('A.Reviews')) || undefined,
    };
  });
  console.timeEnd('Property Transformation');

  console.timeEnd('getCityData Total');
  return {
    records: properties,
    cityBio: cityRecords[0]?.get('City Bio')?.toString()
  };
});

// Function to fetch a single property company record directly from Airtable by actualID
export const fetchPropertyCompanyById = cache(
    async (actualId: string): Promise<PropertyCompany | null> => {
        try {
            // Fetch the single record directly using Airtable's get method
            const record = await fetchWithRetry(() =>
                base("Marketplace").find(actualId)
            );

            if (!record) return null;

            const name = record.get("Company Name")?.toString();
            if (!name) return null;

            // Get the logo URL properly from Airtable attachment
            const logoUrl =
                record.get("Company Logo")?.toString() || "/placeholder.svg";

            // Get the linked record IDs
            const countryId = (record.get("HQ Country") as string[])?.[0];
            const stateId = (record.get("HQ State") as string[])?.[0];
            const cityId = (record.get("HQ City") as string[])?.[0];

            // Get feature summary
            const featureSummary = summaries.find(
                (item) => item.id === record.id
            )?.summary;

            // Fetch location names only if we have the IDs
            const [countryName, stateName, cityName] = await Promise.all([
                countryId
                    ? fetchLocationName("Countries", countryId, "Country Name")
                    : Promise.resolve("Unknown Country"),
                stateId
                    ? fetchLocationName("States", stateId, "State Name")
                    : Promise.resolve("Unknown State"),
                cityId
                    ? fetchLocationName("Cities", cityId, "City Name")
                    : Promise.resolve("Unknown City"),
            ]);

            const company: PropertyCompany = {
                actualID: record.id,
                id: name.toLowerCase().replace(/\s+/g, "-"),
                name,
                logo: logoUrl,
                website: record.get("Company Website")?.toString() || "#",
                country: countryName,
                state: stateName,
                location: cityName,
                introBlog: record.get("Intro Blog")?.toString(),
                blog: record.get("Blog")?.toString(),
                oneLiner: record.get("One liner")?.toString(),
                facebook: record.get("Facebook")?.toString(),
                linkedin: record.get("LinkedIn")?.toString(),
                twitter: record.get("X Link")?.toString(),
                employees: Number(record.get("Employees")) || undefined,
                yearFounded: Number(record.get("Year Founded")) || undefined,
                description: record.get("Intro Blog")?.toString(),
                images: [
                    record.get("Image 1")?.toString() || "",
                    record.get("Image 2")?.toString() || "",
                    record.get("Image 3")?.toString() || "",
                    record.get("Image 4")?.toString() || "",
                    record.get("Image 5")?.toString() || "",
                ].filter(
                    (img) =>
                        img && (img.startsWith("http") || img.startsWith("/"))
                ),
                airbnbUrl: record.get("Airbnb Host URL")?.toString(),
                propertyCount: Number(record.get("A.Listings")) || undefined,
                totalReviews: Number(record.get("A.Reviews")) || undefined,
                rating: Number(record.get("A.Rating")) || undefined,
                otherStates: record
                    .get("Other States")
                    ?.toString()
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                otherCities: record
                    .get("Other Cities")
                    ?.toString()
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                isVerified: record.get("Is Verified?") === true,
                tags: record.get("Type")?.toString(),
                socialMedia: {
                    facebook: record.get("Facebook")?.toString(),
                    linkedin: record.get("LinkedIn")?.toString(),
                    twitter: record.get("X Link")?.toString(),
                },
                keyFeatures: featureSummary,
            };

            return company;
        } catch (error) {
            console.error("Error fetching property by ID:", error);
            return null;
        }
    }
);

// Add location name cache
const locationNameCache = new Map<string, string>();

async function fetchLocationName(
    tableName: string,
    recordId: string,
    fieldName: string
): Promise<string> {
    const cacheKey = `${tableName}-${recordId}`;
    if (locationNameCache.has(cacheKey)) {
        return locationNameCache.get(cacheKey)!;
    }

    try {
        const record = await fetchWithRetry(() => base(tableName).find(recordId));
        const name = record.get(fieldName)?.toString() || `Unknown ${tableName.slice(0, -1)}`;
        locationNameCache.set(cacheKey, name);
        return name;
    } catch (error) {
        console.error(`Error fetching ${tableName} record:`, error);
        return `Unknown ${tableName.slice(0, -1)}`;
    }
}

// Add these optimized functions
export const getLocationData = cache(async (country?: string, state?: string, city?: string) => {
  const formatLocation = (name: string) => {
    // First decode the URL-safe string
    const decoded = decodeURIComponent(name);
    console.log('decoded:', decoded);
    
    // Replace dashes with spaces and capitalize each word
    return decoded
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Format and log each step for debugging
  const formattedCountry = country ? formatLocation(country) : '';
  const formattedState = state ? formatLocation(state) : '';
  const formattedCity = city ? formatLocation(city) : '';
  
  console.log('formattedCountry', formattedCountry);
  console.log('formattedState', formattedState);
  console.log('formattedCity', formattedCity);

  const formula = city 
    ? `AND({HQ Country} = '${formattedCountry}', {HQ State} = '${formattedState}', {HQ City} = '${formattedCity}')`
    : state
    ? `AND({HQ Country} = '${formattedCountry}', {HQ State} = '${formattedState}')`
    : `{HQ Country} = '${formattedCountry}'`;

  const records = await fetchWithRetry(() => 
    base('Marketplace')
      .select({
        filterByFormula: formula
      })
      .all()
  );

  console.log('Records found:', records.length);
  return records;
});

// Add this helper function for static paths
export async function getLocationPaths() {
  try {
    const records = await fetchWithRetry(() =>
      base('Marketplace')
        .select({
          fields: ['HQ Country', 'HQ State', 'HQ City'],
          maxRecords: 100 // Limit to first 100 records for static generation
        })
        .all()
    );

    const paths = new Set<string>();
    
    for (const record of records) {
      const countryId = (record.get('HQ Country') as string[])?.[0];
      const stateId = (record.get('HQ State') as string[])?.[0];
      const cityId = (record.get('HQ City') as string[])?.[0];

      if (!countryId || !stateId || !cityId) continue;

      // Get location names from cache or fetch them
      const [country, state, city] = await Promise.all([
        fetchLocationName('Countries', countryId, 'Country Name'),
        fetchLocationName('States', stateId, 'State Name'),
        fetchLocationName('Cities', cityId, 'City Name')
      ]);

      // Create URL-safe path
      const path = {
        country: formatUrlPath(country),
        state: formatUrlPath(state),
        city: formatUrlPath(city)
      };

      paths.add(JSON.stringify(path));
    }

    return Array.from(paths).map(p => JSON.parse(p));
  } catch (error) {
    console.error('Error generating static paths:', error);
    return [];
  }
}

export async function getFilteredCompanies(filters: {
  stars?: [number, number];
  propertyCount?: [number, number];
  totalReviews?: [number, number];
  country?: string;
  state?: string;
  city?: string;
}) {
  const { stars, propertyCount, totalReviews, country, state, city } = filters;
  
  const conditions = [];
  
  // Add location filters
  if (city) {
    conditions.push(`SEARCH('${city.toLowerCase()}', LOWER({HQ City}))`);
  }
  else if (state) {
    conditions.push(`SEARCH('${state.toLowerCase()}', LOWER({HQ State}))`);
  }
  else if (country) {
    conditions.push(`SEARCH('${country.toLowerCase()}', LOWER({HQ Country}))`);
  }
  
  // Add range filters
  if (stars) {
    conditions.push(`AND({A.Rating} >= ${stars[0]}, {A.Rating} <= ${stars[1]})`);
  }
  
  if (propertyCount) {
    conditions.push(`AND({A.Listings} >= ${propertyCount[0]}, {A.Listings} <= ${propertyCount[1]})`);
  }
  
  if (totalReviews) {
    conditions.push(`AND({A.Reviews} >= ${totalReviews[0]}, {A.Reviews} <= ${totalReviews[1]})`);
  }

  const filterFormula = conditions.length > 0 
    ? `AND(${conditions.join(', ')})`
    : '';

  const records = await fetchWithRetry(() =>
    base('Marketplace')
      .select({
        filterByFormula: filterFormula
      })
      .all()
  );

  return await transformProperties(records);
}
