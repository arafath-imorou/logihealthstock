import openpyxl
import json
import re
import os

# Load Supabase data
db_dump_path = "db_dump.json"
if not os.path.exists(db_dump_path):
    print(f"Error: {db_dump_path} not found.")
    exit(1)

with open(db_dump_path, "r", encoding="utf-8") as f:
    db = json.load(f)

meds = db["medicaments"]
current_magasin_stocks = db["stock_magasin"]
current_pharmacie_stocks = db["stock_pharmacie"]

def normalize(name):
    if not name: return ""
    name = name.lower()
    replacements = {'é':'e', 'è':'e', 'ê':'e', 'ë':'e', 'à':'a', 'â':'a', 'ä':'a', 'î':'i', 'ï':'i', 'ô':'o', 'ö':'o', 'û':'u', 'ü':'u', 'ç':'c'}
    for k, v in replacements.items():
        name = name.replace(k, v)
    name = re.sub(r'[^a-z0-9]', ' ', name)
    return ' '.join(name.split())

EXPLICIT_OVERRIDES = {
    # Amoxicilline
    'amoxicilline 500mg cp': 'MED-008',
    'amoxicilline 250ml sirop': 'MED-009',
    'amoxicilline sirop 125ml': 'MED-007',
    
    # Ampicilline
    'ampicilline 1g inj': 'MED-010',
    'ampicilline 500mg inj': 'MED-011',
    
    # Ceftriaxone
    'ceftriaxone 1g': 'MED-023',
    
    # Ciprofloxacine
    'ciprofloxacine inj': 'MED-027',
    'ciprofloxacine cp': 'MED-026',
    
    # Cloxacilline
    'cloxacilline cp 250mg': 'MED-028',
    
    # Coartem / Coarterm
    'coarterm cp blisterde 6': 'MED-032',
    'coarterm cp blisterde 12': 'MED-029',
    'coartem cp blister de 18': 'MED-030',
    'coartem cp blister de 24': 'MED-031',
    
    # Cotrimoxazole
    'cotrimozal sirop': 'MED-033',
    'cotrimozal cp': 'MED-034',
    
    # Diazepam
    'diazepam cp': 'MED-105',
    'diazepam inj': 'MED-106',
    
    # Diclofenac
    'diclofenac cp': 'MED-038',
    'diclofenac inj': 'MED-037',
    
    # Gentamycine
    'gentamycine inj 2ml': 'MED-046',
    'gentamycine collyre oph': 'MED-047',
    
    # Glucose
    'glucose 10%500ml': 'MED-107',
    'glucose 10%250ml': 'MED-108',
    'glucose 5% 500ml': 'MED-109',
    
    # Mebendazole
    'mebendazole 100mg cp': 'MED-057',
    'mebendazole sirop': 'MED-058',
    
    # Metoclopramide
    'metoclopramide 10mg cp': 'MED-061',
    'metoclopramide 10mg inj': 'MED-113',
    
    # Metronidazole
    'metronidazole inj': 'MED-114',
    'metronidazole sirop': 'MED-115',
    'metronidazole cp': 'MED-116',
    'metronidazole vaginal': 'MED-117',
    
    # Paracetamol
    'paracetamol 125 ml sirop': 'MED-119',
    'paracetamol inj 1g': 'MED-120',
    'paracetamol 500mg': 'MED-077',
    
    # Quinine
    'quinine 600mg inj': 'MED-087',
    
    # Seringue
    'seringue 10cc': 'MED-091',
    'seringue 5cc': 'MED-125',
    
    # Vitamine B complex
    'vitamine b/c inj 10ml': 'MED-094',
    
    # Potassium
    'potassium chlorure inj': 'MED-081',
    'potassium permagannate': 'MED-082',
    
    # MIILD
    'miild 2 places': 'MED-158',
    
    # Butylscopolamine
    'butylscopolamine cp 10mg': 'MED-015',
    'butylscopolamine inj 2ml': 'MED-014',
    
    # Restriva
    'restriva inj': 'MED-059',
    
    # Aluminium
    'aluminium hydroxide cp': 'MED-006',
    
    # Carnet
    'carnet soin': 'MED-018',
    
    # Noscapine
    'noscaoine cp': 'MED-071',
    
    # Nystatine
    'nystatine cp': 'MED-072',
    
    # Ocytocine
    'ocytocine inj': 'MED-073',
    
    # Calcium
    'calcium inj': 'MED-016',
}

# Map DB meds by normalized name/code/id
meds_by_id = {m["id"]: m for m in meds}
meds_by_code = {m["code"].upper(): m for m in meds}

def find_best_match(excel_name):
    excel_norm = normalize(excel_name)
    excel_norm_stripped = excel_name.lower().strip()
    
    # Check overrides
    if excel_norm_stripped in EXPLICIT_OVERRIDES:
        code = EXPLICIT_OVERRIDES[excel_norm_stripped]
        return meds_by_code[code]
    if excel_norm in EXPLICIT_OVERRIDES:
        code = EXPLICIT_OVERRIDES[excel_norm]
        return meds_by_code[code]
        
    excel_words = set(excel_norm.split())
    best_med = None
    best_score = -1
    
    for m in meds:
        full_db_name = f"{m['nom']} {m['dosage'] or ''} {m['forme'] or ''}"
        db_norm = normalize(full_db_name)
        db_words = set(db_norm.split())
        
        common = excel_words.intersection(db_words)
        if not common: continue
        
        score = len(common)
        if m['dosage'] and normalize(m['dosage']) in excel_norm:
            score += 2
        if m['forme'] and normalize(m['forme']) in excel_norm:
            score += 1
            
        score -= 0.1 * abs(len(excel_words) - len(db_words))
        
        if score > best_score:
            best_score = score
            best_med = m
            
    return best_med

# Load Excel data
excel_path = "../Stock magasin et détail.xlsx"
wb = openpyxl.load_workbook(excel_path)
sheet = wb['Stock Pharmacie']

operations = {
    "update_meds": [],
    "stock_magasin": {
        "insert": [],
        "update": [],
        "delete": []
    },
    "stock_pharmacie": {
        "insert": [],
        "update": [],
        "delete": []
    }
}

# Keep track of product IDs processed from Excel
excel_processed_med_ids = set()

# Index current database stocks by medicament_id
db_magasin_by_med = {}
for s in current_magasin_stocks:
    med_id = s["medicament_id"]
    if med_id not in db_magasin_by_med:
        db_magasin_by_med[med_id] = []
    db_magasin_by_med[med_id].append(s)

db_pharmacie_by_med = {}
for s in current_pharmacie_stocks:
    med_id = s["medicament_id"]
    if med_id not in db_pharmacie_by_med:
        db_pharmacie_by_med[med_id] = []
    db_pharmacie_by_med[med_id].append(s)

unmatched = []

for row_idx, row in enumerate(sheet.iter_rows(values_only=True)):
    if row_idx == 0: continue
    med_name = row[0]
    qty_pharma = row[1]
    qty_magasin = row[2]
    
    if not med_name: continue
    if qty_pharma is None and qty_magasin is None: continue
    
    qty_pharma = int(qty_pharma) if qty_pharma is not None else 0
    qty_magasin = int(qty_magasin) if qty_magasin is not None else 0
    
    best_med = find_best_match(med_name)
    if not best_med:
        unmatched.append((row_idx + 1, med_name))
        continue
        
    med_id = best_med["id"]
    excel_processed_med_ids.add(med_id)
    excel_name_cleaned = med_name.strip()
    
    # 1. Update medication name in DB to match Excel name exactly
    if best_med["nom"] != excel_name_cleaned:
        operations["update_meds"].append({
            "id": med_id,
            "nom": excel_name_cleaned,
            "old_nom": best_med["nom"],
            "code": best_med["code"]
        })
    
    # 2. Sync Stock Magasin Central
    existing_mag_rows = db_magasin_by_med.get(med_id, [])
    if qty_magasin > 0:
        if existing_mag_rows:
            # We take the first row and update its quantity
            first_row = existing_mag_rows[0]
            operations["stock_magasin"]["update"].append({
                "id": first_row["id"],
                "quantite": qty_magasin,
                "lot": first_row["lot"],
                "expiration": first_row["expiration"],
                "medicament_nom": excel_name_cleaned
            })
            # Any additional rows for this product in stock_magasin are deleted
            for extra_row in existing_mag_rows[1:]:
                operations["stock_magasin"]["delete"].append(extra_row["id"])
        else:
            # Insert new row with default lot/exp
            operations["stock_magasin"]["insert"].append({
                "medicament_id": med_id,
                "quantite": qty_magasin,
                "lot": "LOT-INITIAL",
                "expiration": "2029-12-31",
                "emplacement": "Rayon principal",
                "medicament_nom": excel_name_cleaned
            })
    else:
        # If Excel central stock is 0, delete all existing central stock rows for this product
        for row in existing_mag_rows:
            operations["stock_magasin"]["delete"].append(row["id"])
            
    # 3. Sync Stock Pharmacie
    existing_phar_rows = db_pharmacie_by_med.get(med_id, [])
    if qty_pharma > 0:
        if existing_phar_rows:
            # Take the first row and update quantity
            first_row = existing_phar_rows[0]
            operations["stock_pharmacie"]["update"].append({
                "id": first_row["id"],
                "quantite": qty_pharma,
                "lot": first_row["lot"],
                "expiration": first_row["expiration"],
                "medicament_nom": excel_name_cleaned
            })
            # Delete extra rows
            for extra_row in existing_phar_rows[1:]:
                operations["stock_pharmacie"]["delete"].append(extra_row["id"])
        else:
            # Insert new row with default lot/exp
            operations["stock_pharmacie"]["insert"].append({
                "medicament_id": med_id,
                "quantite": qty_pharma,
                "lot": "LOT-INITIAL",
                "expiration": "2029-12-31",
                "medicament_nom": excel_name_cleaned
            })
    else:
        # If Excel pharmacy stock is 0, delete all existing pharmacy stock rows for this product
        for row in existing_phar_rows:
            operations["stock_pharmacie"]["delete"].append(row["id"])

# Delete any stock rows in DB for products that are NOT present in the Excel sheet
for med_id, rows in db_magasin_by_med.items():
    if med_id not in excel_processed_med_ids:
        for row in rows:
            operations["stock_magasin"]["delete"].append(row["id"])

for med_id, rows in db_pharmacie_by_med.items():
    if med_id not in excel_processed_med_ids:
        for row in rows:
            operations["stock_pharmacie"]["delete"].append(row["id"])

# Save operations to JSON
with open("smart_sync_operations.json", "w", encoding="utf-8") as f:
    json.dump(operations, f, indent=2, ensure_ascii=False)

print("Generated smart_sync_operations.json:")
print(f"  Medication name updates: {len(operations['update_meds'])}")
print(f"  Magasin central - Inserts: {len(operations['stock_magasin']['insert'])}, Updates: {len(operations['stock_magasin']['update'])}, Deletes: {len(operations['stock_magasin']['delete'])}")
print(f"  Pharmacie - Inserts: {len(operations['stock_pharmacie']['insert'])}, Updates: {len(operations['stock_pharmacie']['update'])}, Deletes: {len(operations['stock_pharmacie']['delete'])}")

if unmatched:
    print(f"\nWARNING: {len(unmatched)} unmatched Excel rows:")
    for idx, name in unmatched:
        print(f"  Row {idx}: '{name}'")
