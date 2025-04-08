// // prompted-notes.ts

// import OpenAI from 'openai';
// import Airtable from 'airtable';

// import { fetchWithRetry } from './data';

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const base = new Airtable({
//   apiKey: process.env.AIRTABLE_API_KEY,
// }).base(process.env.AIRTABLE_BASE_ID!);



// export async function generatePropertySummary(
//   description: string,
// ): Promise<string> {
//   // Craft a prompt that highlights the focus on features, expertise, etc.
//   const response = await openai.chat.completions.create({
//     model: "gpt-4o",
//     messages: [
//       {
//         "role": "developer",
//         "content": [
//           {
//             "type": "text",
//             "text": `
//               You are a helpful assistant that summarizes property management descriptions and puts them into simple 5-6 bullet points regarding the key facts. 
//               The description will be provided to you and you will need to summarize it into a list of key facts. This is so users can easily understand the benefits of a given property manager
//               and not read through the entire description, which will save time. Make sure to use as many numbers and statistics as possible in the description. Also output it in HTML format
//               An example of a good summary is (don't copy this exactly, make your own):
//               <h3>Key Features</h3>
//               <ul>
//                 <li>Manages a diverse portfolio of luxury rentals across <strong>4 prime Southern California destinations</strong> (Palm Springs, Joshua Tree, San Diego, and Big Bear).</li>
//                 <li>Offers <strong>100% full-service property management</strong>, covering guest communication and meticulous property upkeep.</li>
//                 <li>Utilizes an <strong>advanced booking platform</strong> with direct-booking discounts for guests, maximizing occupancy and revenue.</li>
//                 <li>Provides <strong>24/7 oversight</strong> to ensure smooth operations and exceptional guest experiences.</li>
//                 <li>Tailors services for each property's location, helping owners achieve a <strong>stress-free and profitable</strong> investment.</li>
//               </ul>
//             `
//           }
//         ]
//       },
//       {
//         "role": "user",
//         "content": [
//           {
//             "type": "text",
//             "text": `summarize this description: ${description}`
//           }
//         ]
//       }
//     ],
//     store: true,
//   })

//   return response.choices[0]?.message?.content?.trim() || '';
//   }

// export async function updatePropertySummaries() {
//   const records = await fetchWithRetry(() => 
//     base('Marketplace').select({ view: 'Grid view' }).all()
//   );

//   for (const record of records) {
//     const description = record.get('Intro Blog')?.toString();
//     if (description) {
//       const summary = await generatePropertySummary(description);
//       // Update record with summary
//       await base('Marketplace').update(record.id, {
//         'Key Features': summary
//       });
//     }
//   }
// }
