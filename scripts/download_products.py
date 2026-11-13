import os
import json
import urllib.request
import io
from PIL import Image

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

FASHION_CATEGORIES = [
    'womens-dresses',
    'womens-shoes',
    'womens-jewellery',
    'womens-bags',
    'mens-shirts',
    'mens-shoes',
    'mens-watches',
    'sunglasses',
    'fragrances',
    'tops'
]

def fetch_json(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode('utf-8'))

def download_and_convert_webp(img_url, dest_path, max_size_kb=88, target_width=800):
    try:
        req = urllib.request.Request(img_url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
        
        img = Image.open(io.BytesIO(data))
        if img.mode in ('RGBA', 'P', 'LA'):
            # Convert with transparent background or white if necessary
            # For webp, RGBA is supported!
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
        else:
            img = img.convert('RGB')
        
        # Resize if width is larger than target_width
        w, h = img.size
        if w > target_width:
            new_h = int(h * (target_width / w))
            img = img.resize((target_width, new_h), Image.Resampling.LANCZOS)
        
        # Save as webp with quality adjustment to ensure < 90 KB
        quality = 82
        while quality >= 20:
            out_io = io.BytesIO()
            img.save(out_io, format='WEBP', quality=quality, method=4)
            size_kb = len(out_io.getvalue()) / 1024.0
            if size_kb <= max_size_kb:
                with open(dest_path, 'wb') as f:
                    f.write(out_io.getvalue())
                print(f"Saved {dest_path} ({size_kb:.1f} KB, q={quality})")
                return True
            quality -= 8
            
        # If still over, scale down dimensions
        w, h = img.size
        img = img.resize((int(w * 0.75), int(h * 0.75)), Image.Resampling.LANCZOS)
        out_io = io.BytesIO()
        img.save(out_io, format='WEBP', quality=50, method=4)
        size_kb = len(out_io.getvalue()) / 1024.0
        with open(dest_path, 'wb') as f:
            f.write(out_io.getvalue())
        print(f"Saved (downscaled) {dest_path} ({size_kb:.1f} KB)")
        return True
    except Exception as e:
        print(f"Failed to process {img_url}: {e}")
        return False

def main():
    print("Collecting fashion products from DummyJSON...")
    all_products = []
    seen_ids = set()
    
    for cat in FASHION_CATEGORIES:
        try:
            url = f"https://dummyjson.com/products/category/{cat}?limit=12"
            data = fetch_json(url)
            prods = data.get('products', [])
            print(f"Category '{cat}': found {len(prods)} products")
            for p in prods:
                if p['id'] not in seen_ids:
                    seen_ids.add(p['id'])
                    all_products.append(p)
        except Exception as e:
            print(f"Error fetching category {cat}: {e}")

    print(f"Total fashion products collected: {len(all_products)}")
    
    # Process images for products (at least 30)
    selected_products = all_products[:36]
    
    products_dir = os.path.join("assets", "images", "products")
    os.makedirs(products_dir, exist_ok=True)
    
    processed_products = []
    
    for i, prod in enumerate(selected_products):
        p_id = prod['id']
        filename = f"prod_{p_id}.webp"
        filepath = os.path.join(products_dir, filename)
        local_rel_path = f"assets/images/products/{filename}"
        
        # Pick best image: thumbnail or first in images
        img_url = prod.get('thumbnail') or (prod.get('images', [None])[0])
        if img_url:
            success = download_and_convert_webp(img_url, filepath, max_size_kb=88, target_width=700)
            if success:
                # Add local image path
                prod['local_image'] = local_rel_path
            else:
                prod['local_image'] = img_url
        else:
            prod['local_image'] = ""
            
        processed_products.append(prod)

    # Save curated fashion products json for offline resilience / baseline data
    with open("assets/js/products-data.json", "w", encoding="utf-8") as f:
        json.dump(processed_products, f, indent=2)
    print("Saved assets/js/products-data.json successfully!")

if __name__ == "__main__":
    main()
