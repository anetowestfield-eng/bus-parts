import re
import json

INPUT_FILE = 'Part-Numbers.csv'
OUTPUT_FILE = 'parts.json'

# --- CONFIGURATION ---
BRAND_KEYWORDS = {
    'New Flyer': ['NEW FLYER', ' NF ', 'NF BUS', 'N.F.'],
    'Gillig': ['GILLIG']
}

UNIVERSAL_KEYWORDS = [
    'BOLT', 'NUT', 'WASHER', 'SCREW', 'RIVET', 'CLAMP', 'HOSE', 'FITTING', 
    'CONNECTOR', 'TERMINAL', 'WIRE', 'CABLE', 'FUSE', 'BULB', 'LAMP', 
    'PAINT', 'SEALANT', 'ADHESIVE', 'TAPE', 'OIL', 'FLUID', 'GREASE', 
    'CLEANER', 'BATTERY', 'RELAY', 'SWITCH', 'GROMMET', 'BEARING'
]

def get_category(brand, description):
    desc_upper = description.upper()
    brand_upper = brand.upper()

    if 'NEW FLYER' in brand_upper or 'NF' in brand_upper: return 'New Flyer'
    if 'GILLIG' in brand_upper: return 'Gillig'
    
    for word in UNIVERSAL_KEYWORDS:
        if word in desc_upper: return 'Universal'

    return 'Misc'

def generate_short_desc(full_desc):
    # Split by comma to get phrases
    parts = full_desc.split(',')
    
    # Take the first part (e.g. "LAMP")
    short = parts[0].strip()
    
    # If the first part is very short (< 15 chars) and there's a second part, add it
    # Example: "LAMP" -> "LAMP, MINIATURE"
    if len(short) < 15 and len(parts) > 1:
        short += f", {parts[1].strip()}"
        
    return short

def convert():
    print(f"Reading {INPUT_FILE}...")
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8', errors='ignore') as f:
            lines = [l.strip().strip('"') for l in f.readlines() if l.strip()]
    except FileNotFoundError:
        print("Error: File not found.")
        return

    parts_db = []
    buffer = []
    
    bin_pattern = re.compile(r'([A-Z]-\d{3}-\d{3}-\d{2}-\d{2})')
    brand_pattern = re.compile(r'OEM ONLY,?\s*([^,]+)')

    print("Processing...")
    
    for line in lines[2:]:
        if line.startswith('BRO'):
            tokens = line.split()
            if len(tokens) < 2: continue

            p_num = tokens[1]
            
            # Reconstruct description
            full_text = " ".join(buffer + [" ".join(tokens[2:])])
            
            # Remove Bin from Description (but we won't save it to a field anymore)
            bin_match = bin_pattern.search(full_text)
            if bin_match:
                full_text = full_text.replace(bin_match.group(1), "")

            # Extract Brand
            found_brand = "Genuine"
            brand_match = brand_pattern.search(full_text)
            if brand_match:
                found_brand = brand_match.group(1).strip().replace('.', '').title()
            
            # Override Brand if NF/Gillig
            full_text_upper = full_text.upper()
            if any(k in full_text_upper for k in BRAND_KEYWORDS['New Flyer']):
                found_brand = "New Flyer"
            elif any(k in full_text_upper for k in BRAND_KEYWORDS['Gillig']):
                found_brand = "Gillig"

            clean_desc = full_text.replace('OEM ONLY', '').strip(', .')
            
            # Generate Short Description
            short_desc = generate_short_desc(clean_desc)

            parts_db.append({
                "brand": found_brand,
                "category": get_category(found_brand, clean_desc),
                "shortDescription": short_desc, # New Field
                "description": clean_desc,
                "partNumber": p_num
            })
            buffer = []
        else:
            buffer.append(line)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(parts_db, f, indent=2)
    
    print(f"DONE. Categorized {len(parts_db)} parts.")

if __name__ == "__main__":
    convert()