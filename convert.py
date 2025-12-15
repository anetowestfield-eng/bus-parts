import re
import json

INPUT_FILE = 'Part-Numbers.csv'
OUTPUT_FILE = 'parts.json'

# --- CONFIGURATION ---
# Regex Patterns for Aggressive Matching
# \b = Word boundary (Start/End of a word)
# NF\w* = Matches "NF" followed by any letters/numbers/dashes (e.g., NF, NF-ALL, NF-123)
REGEX_NF = re.compile(r'\b(NEW FLYER|NF|N\.F\.)', re.IGNORECASE)
REGEX_GILLIG = re.compile(r'\b(GILLIG)', re.IGNORECASE)

UNIVERSAL_KEYWORDS = [
    'BOLT', 'NUT', 'WASHER', 'SCREW', 'RIVET', 'CLAMP', 'HOSE', 'FITTING', 
    'CONNECTOR', 'TERMINAL', 'WIRE', 'CABLE', 'FUSE', 'BULB', 'LAMP', 
    'PAINT', 'SEALANT', 'ADHESIVE', 'TAPE', 'OIL', 'FLUID', 'GREASE', 
    'CLEANER', 'BATTERY', 'RELAY', 'SWITCH', 'GROMMET', 'BEARING', 'BUSHING'
]

def get_category_and_brand(full_text):
    # 1. Check for Brands using Regex
    # This catches "NF", "NF-ALL", "NF/BUS", etc.
    has_nf = bool(REGEX_NF.search(full_text))
    has_gillig = bool(REGEX_GILLIG.search(full_text))
    
    # 2. PRIORITY RULE: If it has BOTH, it is Universal (Multi-Brand)
    if has_nf and has_gillig:
        return 'Universal', 'Multi-Brand'

    # 3. Specific Brands
    if has_nf: return 'New Flyer', 'New Flyer'
    if has_gillig: return 'Gillig', 'Gillig'
    
    # 4. Universal Hardware Keywords
    text_upper = full_text.upper()
    for word in UNIVERSAL_KEYWORDS:
        if word in text_upper: return 'Universal', 'Generic'

    # 5. Fallback: Extract OEM brand if possible
    brand_pattern = re.compile(r'OEM ONLY,?\s*([^,]+)')
    brand_match = brand_pattern.search(text_upper)
    extracted_brand = brand_match.group(1).strip() if brand_match else "Genuine"
    
    # Clean up common junk in brand names
    extracted_brand = extracted_brand.replace('INC', '').replace('.', '').strip().title()
    
    return 'Misc', extracted_brand

def generate_short_desc(full_desc):
    parts = full_desc.split(',')
    short = parts[0].strip()
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

    print("Processing with updated NF/Gillig logic...")
    
    for line in lines[2:]:
        if line.startswith('BRO'):
            tokens = line.split()
            if len(tokens) < 2: continue

            p_num = tokens[1]
            
            # Reconstruct description from buffer + current line
            full_text = " ".join(buffer + [" ".join(tokens[2:])])
            
            # Remove Bin from Description
            bin_match = bin_pattern.search(full_text)
            if bin_match:
                full_text = full_text.replace(bin_match.group(1), "")

            clean_desc = full_text.replace('OEM ONLY', '').strip(', .')
            
            # Determine Category and Brand logic
            cat, brand = get_category_and_brand(full_text)
            
            short_desc = generate_short_desc(clean_desc)

            parts_db.append({
                "brand": brand,
                "category": cat,
                "shortDescription": short_desc,
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