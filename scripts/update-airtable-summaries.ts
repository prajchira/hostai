const Airtable = require('airtable');
const dotenv = require('dotenv');
const path = require('path');
// const { fetchWithRetry } = require('../lib/data');
const fs = require('fs');
const { Record: AirtableRecord } = require('airtable');

const summaries = require('../scripts/summaries.json');

// Load env variables first
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

interface SummaryItem {
  id: string;
  summary: string;
}

interface UpdateItem {
  id: string;
  fields: {
    Summary: string;
  };
}

async function updateAirtableSummaries() {
  try {

    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID!);
    // Read all records to get their IDs
    const records = await base('Marketplace').select().all();
    
    // Create a map of summaries
    const summaryMap = new Map(
      summaries.map((item: SummaryItem) => [item.id, item.summary])
    );

    // Update records in batches of 10 (Airtable limit)
    const updates = records.map((record: typeof AirtableRecord) => ({
        id: record.id,
        fields: {
          Summary: summaryMap.get(record.get('actualID') as string) || '',
        },
      }));

    // Process in batches of 10
    for (let i = 0; i < updates.length; i += 10) {
      const batch = updates.slice(i, i + 10);
      console.log('Got the updates');
      
      // Log each update in the batch
      batch.forEach((update: UpdateItem) => {
        console.log('Update:', {
          id: update.id,
          summary: update.fields.Summary.slice(0, 100) + '...' // Show first 100 chars
        });
      });
      
      await base('Marketplace').update(batch);
      console.log(`Updated records ${i + 1} to ${Math.min(i + 10, updates.length)}`);
    }

    console.log('Successfully updated all summaries');
  } catch (error) {
    console.error('Error updating summaries:', error);
  }
}

// Run the update
updateAirtableSummaries(); 