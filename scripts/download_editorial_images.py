import os
import urllib.request
import io
from PIL import Image

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def download_and_optimize(url, dest_path, max_size_kb=88, target_w=1000):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
        img = Image.open(io.BytesIO(data))
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        w, h = img.size
        if w > target_w:
            new_h = int(h * (target_w / w))
            img = img.resize((target_w, new_h), Image.Resampling.LANCZOS)
        
        quality = 80
        while quality >= 20:
            buf = io.BytesIO()
            img.save(buf, format='WEBP', quality=quality, method=4)
            size_kb = len(buf.getvalue()) / 1024.0
            if size_kb <= max_size_kb:
                with open(dest_path, 'wb') as f:
                    f.write(buf.getvalue())
                print(f"Saved {dest_path}: {size_kb:.1f} KB (quality {quality})")
                return True
            quality -= 8
            
        # fallback downscale
        img = img.resize((int(img.width * 0.7), int(img.height * 0.7)), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format='WEBP', quality=45, method=4)
        with open(dest_path, 'wb') as f:
            f.write(buf.getvalue())
        print(f"Saved (downscaled) {dest_path}: {len(buf.getvalue())/1024.0:.1f} KB")
        return True
    except Exception as e:
        print(f"Error downloading {dest_path} from {url}: {e}")
        return False

# High quality Unsplash fashion photos (direct photo URLs)
IMAGES = {
    # Hero slider slides
    "assets/images/hero/hero-slide-1.webp": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&auto=format&fit=crop&q=80",
    "assets/images/hero/hero-slide-2.webp": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&auto=format&fit=crop&q=80",
    "assets/images/hero/hero-slide-3.webp": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1000&auto=format&fit=crop&q=80",
    
    # Categories
    "assets/images/categories/cat-women-dresses.webp": "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80",
    "assets/images/categories/cat-men-shirts.webp": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
    "assets/images/categories/cat-shoes.webp": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80",
    "assets/images/categories/cat-accessories.webp": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
    "assets/images/categories/cat-bags.webp": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80",
    "assets/images/categories/cat-fragrances.webp": "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=800&auto=format&fit=crop&q=80",

    # Promotional Banners / Special Offers
    "assets/images/banners/offer-banner-1.webp": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&auto=format&fit=crop&q=80",
    "assets/images/banners/offer-banner-2.webp": "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&auto=format&fit=crop&q=80",
    "assets/images/banners/offer-banner-3.webp": "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=900&auto=format&fit=crop&q=80",

    # Customer Testimonials (avatars)
    "assets/images/testimonials/avatar-1.webp": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    "assets/images/testimonials/avatar-2.webp": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    "assets/images/testimonials/avatar-3.webp": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80"
}

def main():
    print("Downloading editorial & category images...")
    for path, url in IMAGES.items():
        os.makedirs(os.path.dirname(path), exist_ok=True)
        download_and_optimize(url, path, max_size_kb=88)

if __name__ == "__main__":
    main()
