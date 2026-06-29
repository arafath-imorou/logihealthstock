import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://ampktfwcpopkomrsckjm.supabase.co';
const supabaseAnonKey = 'sb_publishable_FMDalRvzL6h5zW_4fTXt5g_I4dvctkD';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Exporting database to db_dump.json...");
  const { data: meds, error: medsErr } = await supabase.from('medicaments').select('*');
  if (medsErr) {
    console.error("Error fetching meds:", medsErr.message);
    process.exit(1);
  }

  const { data: central, error: centralErr } = await supabase.from('stock_magasin').select('*');
  if (centralErr) {
    console.error("Error fetching stock_magasin:", centralErr.message);
    process.exit(1);
  }

  const { data: pharmacie, error: pharErr } = await supabase.from('stock_pharmacie').select('*');
  if (pharErr) {
    console.error("Error fetching stock_pharmacie:", pharErr.message);
    process.exit(1);
  }

  const dbData = {
    medicaments: meds,
    stock_magasin: central,
    stock_pharmacie: pharmacie
  };

  fs.writeFileSync('db_dump.json', JSON.stringify(dbData, null, 2), 'utf-8');
  console.log("Successfully exported Supabase data to db_dump.json");
}

run();
