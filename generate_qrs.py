"""
generate_qrs.py
Generates 5 customer QR tokens for the Nexa Bank Staff Portal prototype.
Each QR encodes a JSON payload matching verificationService.js expectations.
Output → sample_qrs/  (overwriting old PNGs)
"""

import json, os, qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers.pil import RoundedModuleDrawer
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "sample_qrs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

TOKENS = [
    {
        "filename": "customer_8821_withdraw.png",
        "label": "Customer #8821 — Withdrawal",
        "payload": {
            "token": "VALID_HMAC_SIG_8821_WITHDRAW",
            "token_id": "TXN-2026-008821",
            "customer_display_name": "Customer #8821",
            "transaction_type": "withdraw",
            "amount": 100000,
            "account_balance": 285000,
            "queue_position": 1
        },
        "color": "#12355B"
    },
    {
        "filename": "customer_3277_transfer.png",
        "label": "Customer #3277 — Transfer",
        "payload": {
            "token": "VALID_HMAC_SIG_3277_TRANSFER",
            "token_id": "TXN-2026-003277",
            "customer_display_name": "Customer #3277",
            "transaction_type": "transfer",
            "amount": 50000,
            "account_balance": 192500,
            "queue_position": 2
        },
        "color": "#0D6E4A"
    },
    {
        "filename": "customer_1104_deposit.png",
        "label": "Customer #1104 — Deposit",
        "payload": {
            "token": "VALID_HMAC_SIG_1104_DEPOSIT",
            "token_id": "TXN-2026-001104",
            "customer_display_name": "Customer #1104",
            "transaction_type": "deposit",
            "amount": 25000,
            "account_balance": 48000,
            "queue_position": 3
        },
        "color": "#1D4ED8"
    },
    {
        "filename": "customer_5590_withdraw_insufficient.png",
        "label": "Customer #5590 — Insufficient Funds",
        "payload": {
            "token": "VALID_HMAC_SIG_5590_WITHDRAW",
            "token_id": "TXN-2026-005590",
            "customer_display_name": "Customer #5590",
            "transaction_type": "withdraw",
            "amount": 150000,
            "account_balance": 75000,
            "queue_position": 4
        },
        "color": "#EA580C"
    },
    {
        "filename": "customer_7412_document.png",
        "label": "Customer #7412 — Document Collection",
        "payload": {
            "token": "VALID_HMAC_SIG_7412_DOCUMENT",
            "token_id": "TXN-2026-007412",
            "customer_display_name": "Customer #7412",
            "transaction_type": "document_collection",
            "amount": 0,
            "account_balance": 134000,
            "queue_position": 5
        },
        "color": "#7C3AED"
    },
]

def add_label_banner(img: Image.Image, label: str, token_id: str, color: str) -> Image.Image:
    """Adds a coloured header and footer label below the QR code."""
    qr_w, qr_h = img.size
    banner_h = 70
    footer_h = 50
    total_h = banner_h + qr_h + footer_h

    canvas = Image.new("RGB", (qr_w, total_h), "white")

    # Header banner
    header = Image.new("RGB", (qr_w, banner_h), color)
    canvas.paste(header, (0, 0))

    # QR body
    canvas.paste(img, (0, banner_h))

    # Footer strip
    footer = Image.new("RGB", (qr_w, footer_h), "#F8FAFC")
    canvas.paste(footer, (0, banner_h + qr_h))

    draw = ImageDraw.Draw(canvas)

    try:
        font_large = ImageFont.truetype("arial.ttf", 15)
        font_small = ImageFont.truetype("arial.ttf", 11)
    except OSError:
        font_large = ImageFont.load_default()
        font_small = font_large

    # Header text
    draw.text((qr_w // 2, banner_h // 2 - 10), "NEXA BANK · SECURE TOKEN", fill="white",
              font=font_large, anchor="mm")
    draw.text((qr_w // 2, banner_h // 2 + 12), label, fill="#E0F2FE",
              font=font_small, anchor="mm")

    # Footer text
    draw.text((qr_w // 2, banner_h + qr_h + footer_h // 2 - 6), token_id, fill="#475569",
              font=font_small, anchor="mm")
    draw.text((qr_w // 2, banner_h + qr_h + footer_h // 2 + 9), "Scan at bank terminal only · One-time use",
              fill="#94A3B8", font=font_small, anchor="mm")

    return canvas


for t in TOKENS:
    payload_str = json.dumps(t["payload"])

    qr = qrcode.QRCode(
        version=3,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=2,
    )
    qr.add_data(payload_str)
    qr.make(fit=True)

    # Use styled PIL image with rounded dots
    try:
        img = qr.make_image(
            image_factory=StyledPilImage,
            module_drawer=RoundedModuleDrawer()
        ).convert("RGB")
    except Exception:
        img = qr.make_image(fill_color="black", back_color="white").convert("RGB")

    # Resize to consistent 400×400 QR area
    img = img.resize((400, 400), Image.LANCZOS)

    # Add header + footer labels
    final = add_label_banner(img, t["label"], t["payload"]["token_id"], t["color"])

    out_path = os.path.join(OUTPUT_DIR, t["filename"])
    final.save(out_path, "PNG", dpi=(300, 300))
    print(f"[OK] {t['filename']}  ({t['payload']['token_id']})")

print(f"\nAll 5 QR codes saved to: {OUTPUT_DIR}")
