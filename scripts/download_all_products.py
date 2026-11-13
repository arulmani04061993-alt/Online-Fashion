import urllib.request
import json
import os
import io
from PIL import Image

headers = {'User-Agent': 'Mozilla/5.0'}
req = urllib.request.Request('https://dummyjson.com/products?limit=100', headers=headers)
with urllib.request.urlopen(req, timeout=15) as resp:
    products = json.loads(resp.read().decode('utf-8'))['products']

os.makedirs('assets/images/products', exist_ok=True)
count = 0
for p in products:
    pid = p['id']
    dest = os.path.join('assets', 'images', 'products', f'prod_{pid}.webp')
    if not os.path.exists(dest):
        img_url = p.get('thumbnail') or (p.get('images', [None])[0])
        if img_url:
            try:
                r = urllib.request.Request(img_url, headers=headers)
                with urllib.request.urlopen(r, timeout=10) as imgr:
                    img = Image.open(io.BytesIO(imgr.read())).convert('RGB')
                    if img.width > 600:
                        img = img.resize((600, int(img.height * (600 / img.width))), Image.Resampling.LANCZOS)
                    img.save(dest, format='WEBP', quality=80)
                    count += 1
                    if count % 10 == 0:
                        print(f"Downloaded and optimized {count} images...")
            except Exception as e:
                print(f"Error for prod {pid}: {e}")

print(f"Finished. Total newly downloaded & converted: {count}")

