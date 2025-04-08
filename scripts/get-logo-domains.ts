// const Airtable = require('airtable');
// const fs = require('fs');
// const path = require('path');

// const base = new Airtable({
//   apiKey: process.env.AIRTABLE_API_KEY,
// }).base(process.env.AIRTABLE_BASE_ID!);

// async function main() {
//   try {
//     // 1) Fetch all records from your “Marketplace” table
//     const records = await base('Marketplace').select({ view: 'Grid view' }).all();

//     // 2) Extract domains
//     const domains = new Set<string>();
//     for (const record of records) {
//       const logoUrl = record.get('Company Logo')?.toString();
//       if (logoUrl?.startsWith('http')) {
//         try {
//           const hostname = new URL(logoUrl).hostname;
//           domains.add(hostname.toLowerCase());
//         } catch (err) {
//           console.warn(`Skipping invalid URL: ${logoUrl}`);
//         }
//       }
//     }

//     // Sort the domains for consistency
//     const uniqueDomains = [...domains].sort();

//     // 3) Write them to a JSON file that you can import or copy/paste
//     const outputPath = path.join(__dirname, 'logoDomains.json');
//     fs.writeFileSync(outputPath, JSON.stringify(uniqueDomains, null, 2), 'utf8');

//     console.log(`Found ${uniqueDomains.length} domains:`);
//     console.log(uniqueDomains);
//     console.log(`\nSaved them to ${outputPath}.`);
//     console.log('Now copy these into your next.config.js or import them directly.');
//   } catch (error) {
//     console.error('Error fetching data from Airtable:', error);
//   }
// }

// main();
