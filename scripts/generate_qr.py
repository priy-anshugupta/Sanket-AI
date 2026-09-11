import sys
import urllib.parse
import urllib.request
import os

def generate_qr(url: str, output_path: str = "frontend/public/website_qr.png"):
    encoded_url = urllib.parse.quote(url, safe='')
    api_endpoint = f"https://quickchart.io/qr?text={encoded_url}&size=500&ecLevel=H&margin=2"
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    print(f"Generating high-resolution QR for: {url}")
    urllib.request.urlretrieve(api_endpoint, output_path)
    print(f"[OK] QR Code saved to: {output_path}")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000/worker"
    out = sys.argv[2] if len(sys.argv) > 2 else "frontend/public/website_qr.png"
    generate_qr(target, out)
