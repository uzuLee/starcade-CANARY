import os
import re

# Pricing strategy
pricing = {
    # profileEffects
    'Birthday': {'isUnlockable': False},
    'Confetti': {'price': 3000},
    'CRT': {'price': 1000},
    'CRToff': {'price': 1000},
    'CRTon': {'price': 1000},
    'Defeat': {'isUnlockable': False},
    'Explosion': {'price': 10000},
    'Fireworks': {'price': 10000},
    'GiantSkull': {'price': 7500},
    'Laughing': {'price': 2000},
    'Money': {'price': 15000},
    'Rain': {'price': 4000},
    'ScreenShake': {'price': 5000},
    'Snow': {'price': 4000},
    'Sparkle': {'price': 2500},
    'Stars': {'price': 4000},
    'SunFlame': {'price': 12000},
    'Toast': {'isUnlockable': False},
    'Wiggle': {'price': 1500},
    'Wind': {'price': 4000},
    # cardDecorations
    'None': {'isUnlockable': False},
}

# Base directory
base_dir = 'E:/projectFiles/programming/.gemini-cli/starcade-backend/src'
cosmetic_dirs = ['profileEffects', 'profileDecorations', 'cardEffects', 'cardDecorations']

# Process each file
for cos_dir in cosmetic_dirs:
    full_cos_dir = os.path.join(base_dir, cos_dir)
    if not os.path.isdir(full_cos_dir):
        continue
    
    for item_dir in os.listdir(full_cos_dir):
        item_id = item_dir
        index_file_path = os.path.join(full_cos_dir, item_dir, 'index.js')
        
        if os.path.isfile(index_file_path):
            with open(index_file_path, 'r+', encoding='utf-8') as f:
                content = f.read()

                # Skip if already modified
                if 'price:' in content or 'isUnlockable:' in content:
                    # print(f"Skipping {item_id}, already has price/unlockable property.")
                    continue

                lines = content.split('\n')
                new_lines = []
                inserted = False

                for i, line in enumerate(lines):
                    new_lines.append(line)
                    if not inserted and '};' in line and i == len(lines) - 2:
                        # Find the last property line to add a comma
                        for j in range(i - 1, -1, -1):
                            if ':' in new_lines[j]:
                                if not new_lines[j].strip().endswith(','):
                                    new_lines[j] += ','
                                break
                        
                        prop_to_add = ''
                        if item_id in pricing:
                            if 'price' in pricing[item_id]:
                                prop_to_add = f"  price: {pricing[item_id]['price']}"
                            else:
                                prop_to_add = f"  isUnlockable: {str(pricing[item_id]['isUnlockable']).lower()}"
                        else: # Default price
                            prop_to_add = "  price: 5000"
                        
                        new_lines.insert(i, prop_to_add)
                        inserted = True

                # Fallback for files with different structure
                if not inserted:
                    last_brace_index = content.rfind('}')
                    if last_brace_index != -1:
                        temp_content = content[:last_brace_index].rstrip()
                        if not temp_content.endswith(','):
                            temp_content += ','
                        
                        prop_to_add = ''
                        if item_id in pricing:
                            if 'price' in pricing[item_id]:
                                prop_to_add = f"\n  price: {pricing[item_id]['price']}"
                            else:
                                prop_to_add = f"\n  isUnlockable: {str(pricing[item_id]['isUnlockable']).lower()}"
                        else: # Default price
                            prop_to_add = "\n  price: 5000"
                        
                        new_content_str = temp_content + prop_to_add + content[last_brace_index:]
                    else:
                        new_content_str = content # No change
                else:
                    new_content_str = '\n'.join(new_lines)


                f.seek(0)
                f.write(new_content_str)
                f.truncate()
                print(f"Updated {item_id} in {cos_dir}")
