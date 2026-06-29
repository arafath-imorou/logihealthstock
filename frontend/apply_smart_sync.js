import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { execSync } from 'child_process';

const supabaseUrl = 'https://ampktfwcpopkomrsckjm.supabase.co';
const supabaseAnonKey = 'sb_publishable_FMDalRvzL6h5zW_4fTXt5g_I4dvctkD';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    // 1. Export database
    console.log("Step 1: Exporting current database states...");
    execSync('node dump_current_db.js', { stdio: 'inherit' });

    // 2. Generate operations JSON
    console.log("\nStep 2: Generating smart sync operations...");
    execSync('python build_smart_sync.py', { stdio: 'inherit' });

    // 3. Read operations
    const opsFile = 'smart_sync_operations.json';
    if (!fs.existsSync(opsFile)) {
      console.error("Error: smart_sync_operations.json not found.");
      return;
    }
    const ops = JSON.parse(fs.readFileSync(opsFile, 'utf-8'));

    // 4. Apply medication name updates
    console.log(`\nStep 3: Updating ${ops.update_meds.length} medication names...`);
    for (const item of ops.update_meds) {
      const { error } = await supabase
        .from('medicaments')
        .update({ nom: item.nom })
        .eq('id', item.id);
        
      if (error) {
        console.error(`  Error updating name for ${item.code} (${item.old_nom}):`, error.message);
      } else {
        console.log(`  Updated name for ${item.code}: '${item.old_nom}' -> '${item.nom}'`);
      }
    }

    // 5. Apply stock_magasin deletes
    const magDeleteIds = ops.stock_magasin.delete;
    if (magDeleteIds.length > 0) {
      console.log(`\nStep 4: Deleting ${magDeleteIds.length} obsolete stock rows in Magasin Central...`);
      // Delete in chunks of 50 to avoid URL length or payload limits if any
      const chunkSize = 50;
      for (let i = 0; i < magDeleteIds.length; i += chunkSize) {
        const chunk = magDeleteIds.slice(i, i + chunkSize);
        const { error } = await supabase
          .from('stock_magasin')
          .delete()
          .in('id', chunk);
        if (error) {
          console.error("  Error deleting magasin rows:", error.message);
        } else {
          console.log(`  Deleted chunk ${i / chunkSize + 1} of magasin rows.`);
        }
      }
    }

    // 6. Apply stock_magasin updates
    const magUpdates = ops.stock_magasin.update;
    if (magUpdates.length > 0) {
      console.log(`\nStep 5: Updating quantities for ${magUpdates.length} stock rows in Magasin Central...`);
      for (const item of magUpdates) {
        const { error } = await supabase
          .from('stock_magasin')
          .update({ quantite: item.quantite })
          .eq('id', item.id);
        if (error) {
          console.error(`  Error updating quantity for ${item.medicament_nom} (Lot: ${item.lot}):`, error.message);
        }
      }
      console.log("  Successfully updated Magasin Central quantities.");
    }

    // 7. Apply stock_magasin inserts
    const magInserts = ops.stock_magasin.insert;
    if (magInserts.length > 0) {
      console.log(`\nStep 6: Inserting ${magInserts.length} new stock rows in Magasin Central...`);
      const insertsPayload = magInserts.map(item => ({
        medicament_id: item.medicament_id,
        quantite: item.quantite,
        lot: item.lot,
        expiration: item.expiration,
        emplacement: item.emplacement
      }));

      // Insert in chunks of 50
      const chunkSize = 50;
      for (let i = 0; i < insertsPayload.length; i += chunkSize) {
        const chunk = insertsPayload.slice(i, i + chunkSize);
        const { error } = await supabase
          .from('stock_magasin')
          .insert(chunk);
        if (error) {
          console.error("  Error inserting magasin stock rows:", error.message);
        } else {
          console.log(`  Inserted chunk ${i / chunkSize + 1} of magasin stock rows.`);
        }
      }
    }

    // 8. Apply stock_pharmacie deletes
    const pharDeleteIds = ops.stock_pharmacie.delete;
    if (pharDeleteIds.length > 0) {
      console.log(`\nStep 7: Deleting ${pharDeleteIds.length} obsolete stock rows in Pharmacie...`);
      const chunkSize = 50;
      for (let i = 0; i < pharDeleteIds.length; i += chunkSize) {
        const chunk = pharDeleteIds.slice(i, i + chunkSize);
        const { error } = await supabase
          .from('stock_pharmacie')
          .delete()
          .in('id', chunk);
        if (error) {
          console.error("  Error deleting pharmacie rows:", error.message);
        } else {
          console.log(`  Deleted chunk ${i / chunkSize + 1} of pharmacie rows.`);
        }
      }
    }

    // 9. Apply stock_pharmacie updates
    const pharUpdates = ops.stock_pharmacie.update;
    if (pharUpdates.length > 0) {
      console.log(`\nStep 8: Updating quantities for ${pharUpdates.length} stock rows in Pharmacie...`);
      for (const item of pharUpdates) {
        const { error } = await supabase
          .from('stock_pharmacie')
          .update({ quantite: item.quantite })
          .eq('id', item.id);
        if (error) {
          console.error(`  Error updating quantity for ${item.medicament_nom} (Lot: ${item.lot}):`, error.message);
        }
      }
      console.log("  Successfully updated Pharmacie quantities.");
    }

    // 10. Apply stock_pharmacie inserts
    const pharInserts = ops.stock_pharmacie.insert;
    if (pharInserts.length > 0) {
      console.log(`\nStep 9: Inserting ${pharInserts.length} new stock rows in Pharmacie...`);
      const insertsPayload = pharInserts.map(item => ({
        medicament_id: item.medicament_id,
        quantite: item.quantite,
        lot: item.lot,
        expiration: item.expiration
      }));

      const chunkSize = 50;
      for (let i = 0; i < insertsPayload.length; i += chunkSize) {
        const chunk = insertsPayload.slice(i, i + chunkSize);
        const { error } = await supabase
          .from('stock_pharmacie')
          .insert(chunk);
        if (error) {
          console.error("  Error inserting pharmacie stock rows:", error.message);
        } else {
          console.log(`  Inserted chunk ${i / chunkSize + 1} of pharmacie stock rows.`);
        }
      }
    }

    console.log("\n================ SMART SYNCHRONIZATION COMPLETE ================");

  } catch (err) {
    console.error("Execution error:", err);
  } finally {
    // 11. Cleanup temporary files
    console.log("\nStep 10: Cleaning up temporary files...");
    const filesToCleanup = ['db_dump.json', 'smart_sync_operations.json'];
    for (const f of filesToCleanup) {
      if (fs.existsSync(f)) {
        try {
          fs.unlinkSync(f);
          console.log(`  Deleted temporary file: ${f}`);
        } catch (e) {
          console.error(`  Error deleting file ${f}:`, e.message);
        }
      }
    }
  }
}

run();
