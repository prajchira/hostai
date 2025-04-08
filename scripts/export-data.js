const Airtable = require('airtable');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Debug: Check if environment variables are loaded
console.log('API Key exists:', !!process.env.AIRTABLE_API_KEY);
console.log('Base ID exists:', !!process.env.AIRTABLE_BASE_ID);

if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID);

async function main() {
  try {
    // Fetch all location data first
    const countryRecords = await base('Countries').select().all();
    const stateRecords = await base('States').select().all();
    const cityRecords = await base('Cities').select().all();

    // Create maps for each location type
    const countryMap = new Map();
    const stateMap = new Map();
    const cityMap = new Map();

    countryRecords.forEach(record => {
      countryMap.set(record.id, record.get('Country Name'));
    });

    stateRecords.forEach(record => {
      stateMap.set(record.id, record.get('State Name'));
    });

    cityRecords.forEach(record => {
      cityMap.set(record.id, record.get('City Name'));
    });

    // Then fetch and process companies
    const records = await base('Marketplace').select({
      view: 'Grid view'
    }).all();

    const companies = records
      .map(record => {
        const name = record.get('Company Name')?.toString();
        if (!name) return null;

        // Get the linked record IDs
        const countryId = record.get('HQ Country')?.[0];
        const stateId = record.get('HQ State')?.[0];
        const cityId = record.get('HQ City')?.[0];

        return {
          actualID: record.id,
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          logo: record.get('Company Logo')?.toString() || '/placeholder.svg',
          website: record.get('Company Website')?.toString() || '#',
          country: countryMap.get(countryId) || 'Unknown Country',
          state: stateMap.get(stateId) || 'Unknown State',
          location: cityMap.get(cityId) || 'Unknown City',
          blog: record.get('Blog') || 'No description available',
          oneLiner: record.get('One liner') || 'No description available',
          facebook: record.get('Facebook'),
          linkedin: record.get('LinkedIn'),
          twitter: record.get('X Link'),
          employees: Number(record.get('Employees')) || undefined,
          yearFounded: Number(record.get('Year Founded')) || undefined,
          description: record.get('Intro Blog'),
          images: [
            record.get('Image 1'),
            record.get('Image 2'),
            record.get('Image 3'),
            record.get('Image 4'),
            record.get('Image 5'),
          ].filter(Boolean),
          airbnbUrl: record.get('Airbnb Host URL'),
          propertyCount: Number(record.get('A.Listings')) || undefined,
          totalReviews: Number(record.get('A.Reviews')) || undefined,
          rating: Number(record.get('A.Rating')) || undefined,
          otherStates: (record.get('Other States')?.toString() || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
          otherCities: (record.get('Other Cities')?.toString() || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
          isVerified: record.get('Is Verified?') === true,
          tags: record.get('Is Verified?') === true ? ['Verified'] : [],
          socialMedia: {
            facebook: record.get('Facebook'),
            linkedin: record.get('LinkedIn'),
            twitter: record.get('X Link'),
          }
        };
      })
      .filter(Boolean);

    const outputPath = path.join(__dirname, 'companies.json');
    fs.writeFileSync(outputPath, JSON.stringify(companies, null, 2));

    console.log(`Processed ${companies.length} companies`);
    console.log(`Saved to ${outputPath}`);
  } catch (error) {
    console.error('Error fetching data from Airtable:', error);
  }
}

main(); 