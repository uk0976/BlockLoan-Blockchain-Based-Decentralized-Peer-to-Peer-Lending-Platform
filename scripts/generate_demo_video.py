import os
import sys
from PIL import Image, ImageDraw, ImageFont
import imageio

SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), '..', 'docs', 'screenshots')
OUTPUT_GIF = os.path.join(os.path.dirname(__file__), '..', 'docs', 'demo-walkthrough.gif')

stages = [
    {
        "file": "01_landing_page.png",
        "title": "Stage 1: Platform Overview & Protocol Metrics",
        "subtitle": "Decentralized P2P lending without banking intermediaries; 100% non-custodial."
    },
    {
        "file": "02_demo_mode_activated.png",
        "title": "Stage 2: Web3 Wallet & Demo Role Activation",
        "subtitle": "Connect MetaMask or switch between Borrower (0x7099...) and Lender (0x3C44...) personas."
    },
    {
        "file": "03_marketplace.png",
        "title": "Stage 3: Decentralized Credit Marketplace",
        "subtitle": "Transparent browseable debt agreements filtered by OPEN, ACTIVE, and COMPLETED states."
    },
    {
        "file": "04_create_loan_form.png",
        "title": "Stage 4: Borrower Creates On-Chain Loan Request",
        "subtitle": "Enters principal, 8.5% APR, 30 days tenure with dynamic mathematical yield calculations."
    },
    {
        "file": "05_borrower_dashboard.png",
        "title": "Stage 5: Borrower Debt Servicing & Repayment",
        "subtitle": "Monitor active loans, total repaid volume, and execute partial or full debt settlement."
    },
    {
        "file": "06_lender_dashboard.png",
        "title": "Stage 6: Lender Portfolio & Yield Tracking",
        "subtitle": "Track capital deployed, collected interest returns, and settled loan history."
    },
    {
        "file": "07_admin_dashboard.png",
        "title": "Stage 7: Protocol Admin & Smart Contract Audit",
        "subtitle": "Live telemetry: Total volume, 100% repayment rate, and runtime EVM bytecode verification."
    },
    {
        "file": "08_fastapi_swagger_docs.png",
        "title": "Stage 8: FastAPI REST Service & Web3.py Indexer",
        "subtitle": "Interactive OpenAPI documentation providing read-only event querying and off-chain caching."
    }
]

def add_hud_overlay(img, title, subtitle, step_num, total_steps):
    img = img.convert('RGB')
    width, height = img.size
    
    # Resize to standard 1280x800 for optimal file size and presentation quality
    target_width = 1280
    target_height = int(height * (target_width / width))
    img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
    
    draw = ImageDraw.Draw(img)
    
    # 1. Top HUD banner
    banner_height = 70
    overlay = Image.new('RGBA', (target_width, banner_height), (11, 14, 23, 230))
    img.paste(overlay, (0, 0), overlay)
    
    # 2. Progress bar
    progress_ratio = step_num / total_steps
    draw.rectangle([0, 0, target_width, 4], fill=(30, 41, 59))
    draw.rectangle([0, 0, int(target_width * progress_ratio), 4], fill=(20, 184, 166))
    
    # 3. Badges and Text
    badge_text = f"STEP {step_num}/{total_steps}"
    draw.rectangle([20, 14, 110, 40], fill=(20, 184, 166))
    draw.text((28, 20), badge_text, fill=(11, 14, 23))
    
    draw.text((125, 14), title, fill=(255, 255, 255))
    draw.text((125, 38), subtitle, fill=(148, 163, 184))
    
    # Bottom watermark badge
    bottom_y = target_height - 35
    watermark_overlay = Image.new('RGBA', (320, 30), (11, 14, 23, 200))
    img.paste(watermark_overlay, (20, bottom_y), watermark_overlay)
    draw.text((30, bottom_y + 8), "BlockLoan • Automated Video Walkthrough", fill=(45, 212, 191))
    
    return img

def build_demo_video():
    print("Generating demo walkthrough frames...")
    frames = []
    durations = []
    
    total = len(stages)
    for idx, stage in enumerate(stages):
        filepath = os.path.join(SCREENSHOT_DIR, stage["file"])
        if not os.path.exists(filepath):
            print(f"Skipping missing file: {filepath}")
            continue
            
        base_img = Image.open(filepath)
        processed = add_hud_overlay(base_img, stage["title"], stage["subtitle"], idx + 1, total)
        
        # Hold frame for 3.5 seconds
        frames.append(processed)
        durations.append(3.5)
        
    print(f"Compiling {len(frames)} frames into {OUTPUT_GIF}...")
    # Convert duration to milliseconds for imageio
    durations_ms = [int(d * 1000) for d in durations]
    imageio.mimsave(OUTPUT_GIF, frames, duration=durations_ms, loop=0)
    print(f"[OK] Demo video walkthrough successfully generated at {OUTPUT_GIF} (Size: {os.path.getsize(OUTPUT_GIF) / 1024 / 1024:.2f} MB)")

if __name__ == "__main__":
    build_demo_video()
