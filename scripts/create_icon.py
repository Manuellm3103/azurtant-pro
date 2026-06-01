import struct
import zlib

def create_ico():
    # 32x32 icon - minimal valid ICO file
    width, height = 32, 32
    
    # Create 32x32 32-bit BGRA image (blue gradient with azur branding)
    pixels = []
    for y in range(height):
        row = []
        for x in range(width):
            # Blue gradient
            b = int(191 * (1 - y/height))  # Blue
            g = int(107 * (1 - y/height))  # Green  
            r = int(30 * (1 - y/height))   # Red
            a = 255
            row.extend([b, g, r, a])
        pixels.append(bytes(row))
    
    # AND mask (all zeros = fully visible)
    and_mask = bytes([0] * (width * height // 8))
    
    # Build ICO file
    # ICONDIR header
    header = struct.pack('<HHH', 0, 1, 1)  # Reserved, Type=1 (ICO), Count=1
    
    # ICONDIRENTRY
    entry = struct.pack('<BBBBHHII', 
        width, height, 0, 0, 1, 32, 
        40 + len(pixels) * len(pixels[0]) + len(and_mask),  # Size
        22  # Offset to image data
    )
    
    # BITMAPINFOHEADER
    bmp_header = struct.pack('<IIIHHIIIIII',
        40, width, height*2, 1, 32, 0, 
        len(pixels) * len(pixels[0]), 0, 0, 0, 0
    )
    
    # Flip image vertically (BMP stores bottom-up)
    image_data = b''.join(reversed(pixels))
    
    # Write ICO file
    with open('C:/Users/Manu/azurant-app/src-tauri/icons/icon.ico', 'wb') as f:
        f.write(header + entry + bmp_header + image_data + and_mask)
    
    print("Icon created: icon.ico")

create_ico()