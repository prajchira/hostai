// // const OpenAIApi = require('openai');
// // const AirtableApi = require('airtable');
// // const { fetchWithRetry } = require('../lib/data');


// // const openai = new OpenAIApi({
// //   apiKey: process.env.OPENAI_API_KEY,
// // });

// // const airtableBase = new AirtableApi({
// //   apiKey: process.env.AIRTABLE_API_KEY,
// // }).base(process.env.AIRTABLE_BASE_ID!);

// // async function generatePropertySummary(
// //   description: string,
// // ): Promise<string> {
// //   // Craft a prompt that highlights the focus on features, expertise, etc.
// //   const response = await openai.chat.completions.create({
// //     model: "gpt-4o",
// //     messages: [
// //       {
// //         "role": "developer",
// //         "content": [
// //           {
// //             "type": "text",
// //             "text": `
// //               You are a helpful assistant that summarizes property management descriptions and puts them into simple 5-6 bullet points regarding the key facts. 
// //               The description will be provided to you and you will need to summarize it into a list of key facts. This is so users can easily understand the benefits of a given property manager
// //               and not read through the entire description, which will save time. Make sure to use as many numbers and statistics as possible in the description. Also output it in HTML format
// //               An example of a good summary is (don't copy this exactly, make your own):
// //               <h3>Key Features</h3>
// //               <ul>
// //                 <li>Manages a diverse portfolio of luxury rentals across <strong>4 prime Southern California destinations</strong> (Palm Springs, Joshua Tree, San Diego, and Big Bear).</li>
// //                 <li>Offers <strong>100% full-service property management</strong>, covering guest communication and meticulous property upkeep.</li>
// //                 <li>Utilizes an <strong>advanced booking platform</strong> with direct-booking discounts for guests, maximizing occupancy and revenue.</li>
// //                 <li>Provides <strong>24/7 oversight</strong> to ensure smooth operations and exceptional guest experiences.</li>
// //                 <li>Tailors services for each property's location, helping owners achieve a <strong>stress-free and profitable</strong> investment.</li>
// //               </ul>
// //             `
// //           }
// //         ]
// //       },
// //       {
// //         "role": "user",
// //         "content": [
// //           {
// //             "type": "text",
// //             "text": `summarize this description: ${description}`
// //           }
// //         ]
// //       }
// //     ],
// //     store: true,
// //   })

// //   return response.choices[0]?.message?.content?.trim() || '';
// // }

// // async function updatePropertySummaries() {
// //   const records = await fetchWithRetry(() => 
// //     airtableBase('Marketplace').select({ view: 'Grid view' }).all()
// //   );

// //   for (const record of records) {
// //     const description = record.get('Intro Blog')?.toString();
// //     if (description) {
// //       const summary = await generatePropertySummary(description);
// //       // Update record with summary
// //       await airtableBase('Marketplace').update(record.id, {
// //         'Key Features': summary
// //       });
// //     }
// //   }
// // }

// // async function main() {
// //   try {
// //     // 1) Fetch all records from Marketplace table
// //     console.log('Fetching records...');
// //     const records = await airtableBase('Marketplace').select({ view: 'Grid view' }).all();
    
// //     // 2) Process each record
// //     for (const record of records) {
// //       const description = record.get('Intro Blog')?.toString();
// //       if (description) {
// //         console.log(`Processing ${record.get('Company Name')}...`);
        
// //         // 3) Generate summary using OpenAI
// //         const response = await openai.chat.completions.create({
// //           model: "gpt-4",
// //           messages: [
// //             {
// //               role: "system",
// //               content: "Create a 5-6 bullet point HTML summary of key features from property management descriptions. Include numbers and statistics where possible."
// //             },
// //             {
// //               role: "user",
// //               content: `Summarize this description: ${description}`
// //             }
// //           ]
// //         });

// //         const summary = response.choices[0]?.message?.content?.trim();

// //         // 4) Update Airtable with new summary
// //         if (summary) {
// //           await airtableBase('Marketplace').update(record.id, {
// //             'Key Features': summary
// //           });
// //           console.log(`Updated summary for ${record.get('Company Name')}`);
// //         }
// //       }
// //     }

// //     console.log('Successfully updated all summaries!');
// //   } catch (error) {
// //     console.error('Error:', error);
// //   }
// // }

// // async function testSingleSummary() {
// //   const testDescription = `
// //     We are a full-service property management company operating in San Diego since 2015. 
// //     We manage over 150 properties and maintain a 4.8-star rating across 500+ reviews. 
// //     Our team provides 24/7 support and handles everything from guest communication to maintenance.
// //   `;

// //   try {
// //     console.log('Testing summary generation...');
// //     const summary = await generatePropertySummary(testDescription);
// //     console.log('\nGenerated Summary:');
// //     console.log(summary);
// //   } catch (error) {
// //     console.error('Error:', error);
// //   }
// // }

// // // Run the test
// // testSingleSummary();

// // main(); 


// // summaries.ts


// const OpenAI = require('openai');
// const Airtable = require('airtable');
// const dotenv = require('dotenv');
// const path = require('path');
// // const { fetchWithRetry } = require('../lib/data');
// const { Record, FieldSet } = require('airtable');
// const fs = require('fs');

// // Load env variables first
// dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// // 1) Initialize OpenAI
// const client = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// // 2) Initialize Airtable
// const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
//   .base(process.env.AIRTABLE_BASE_ID!);



// // Type-safe reference to your "Marketplace" table
// const marketplaceTable = base('Marketplace');

// /**
//  * Generate a summary for a given description.
//  * @param description The text to summarize
//  * @returns A promise that resolves to the summarized text
//  */
// async function generatePropertySummary(description: string): Promise<string> {
//   const response = await client.responses.create({
//     model: "gpt-4o-2024-08-06", // or "gpt-3.5-turbo"
//     instructions: `You are a helpful assistant that summarizes property management descriptions and puts them into simple 5 bullet points regarding the key facts. 
//               The description will be provided to you and you will need to summarize it into a list of key facts. This is so users can easily understand the benefits of a given property manager
//               and not read through the entire description, which will save time. Make sure to use as many numbers and statistics as possible in the description. Ensure you have 5 lines like example below of the description. Also be as specific is possible, don't use lofty jargon and get to the point. Also output it in HTML format
//               An example of a good summary is (don't copy this exactly, make your own based on the information given in the description):
//               <h3>Key Summary</h3>
//               <ul>
//                 <li>Manages a diverse portfolio of luxury rentals across <strong>4 prime Southern California destinations</strong> (Palm Springs, Joshua Tree, San Diego, and Big Bear).</li>
//                 <li>Offers <strong>100% full-service property management</strong>, covering guest communication and meticulous property upkeep.</li>
//                 <li>Utilizes an <strong>advanced booking platform</strong> with direct-booking discounts for guests, maximizing occupancy and revenue.</li>
//                 <li>Provides <strong>24/7 oversight</strong> to ensure smooth operations and exceptional guest experiences.</li>
//                 <li>Tailors services for each property's location, helping owners achieve a <strong>stress-free and profitable</strong> investment.</li>
//               </ul>`,
//       input: description,
//   })
//   // Return the text if it exists
//   const summary = response.output_text ?? '';
//   console.log(summary.trim())

//   return summary.trim();
// }

// /**
//  * Update "Key Features" field for each record in the "Marketplace" table
//  */
// async function updatePropertySummaries(): Promise<void> {
//   const summaries = [];
//   const records = await marketplaceTable
//     .select({ view: 'Grid view' })
//     .all();

//   for (const record of records) {
//     const description = record.get('Blog');
//     console.log('Processing description:', description);
    
//     if (description) {
//       const summary = await generatePropertySummary(description);
//       summaries.push({
//         id: record.id,
//         companyName: record.get('Company Name'),
//         summary: summary
//       });
//     }
//   }

//   // Save to JSON file
//   fs.writeFileSync(
//     'scripts/summaries.json',
//     JSON.stringify(summaries, null, 2)
//   );
//   console.log('Saved summaries to summaries.json');
// }

// async function main() {
//   try {
//     // 1) Fetch all records from Marketplace table
//     console.log('Fetching records...');
//     // const records = await marketplaceTable
//     // //.select({ view: 'Grid view' })
//     //   .select({ 
//     //     view: 'Grid view',
//     //     maxRecords: 1  // Only get first record
//     //   })
//     //   .all();

//     // const record = records[0];
//     // const description = record.get('Intro Blog')?.toString();
    
//       const summary = await updatePropertySummaries();
//       console.log('\nGenerated Summary:');
//       console.log(summary);

//     console.log('Successfully updated all summaries!');
//   } catch (error) {
//     console.error('Error:', error);
//   }
// }

// main();
