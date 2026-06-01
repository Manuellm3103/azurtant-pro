import struct
import os

def create_proper_ico():
    """Create a proper 32x32 ICO file with correct format"""
    
    # Create 32x32 BGRA pixel data (blue gradient)
    width = 32
    height = 32
    bpp = 32
    
    pixel_data = b''
    for y in range(height):
        for x in range(width):
            # BGRA format - Azur blue (#1E40AF)
            b = 175  # Blue
            g = 64   # Green
            r = 30   # Red
            a = 255  # Alpha
            pixel_data += bytes([b, g, r, a])
    
    # Create BITMAPINFOHEADER (40 bytes)
    bmp_header = struct.pack('<IIIHHIIIIII',
        40,           # biSize
        width,        # biWidth
        height * 2,   # biHeight (doubled for AND mask)
        1,            # biPlanes
        bpp,          # biBitCount
        0,            # biCompression (BI_RGB)
        len(pixel_data),  # biSizeImage
        0, 0, 0, 0    # resolution and colors
    )
    
    # Create AND mask (1 bit per pixel, rows padded to 4 bytes)
    row_bytes = (width + 31) // 32 * 4  # Each row is 4 bytes (32 pixels, 1-bit = 4 bytes)
    and_mask = bytes(row_bytes * height)  # All zeros = all visible
    
    # Calculate total image size
    image_size = len(bmp_header) + len(pixel_data) + len(and_mask)
    
    # Create ICONDIR header (6 bytes)
    icon_dir = struct.pack('<HHH', 0, 1, 1)  # Reserved=0, Type=1 (ICO), Count=1
    
    # Create ICONDIRENTRY (16 bytes)
    icon_entry = struct.pack('<BBBBHHII',
        width,     # bWidth (0 means 256)
        height,    # bHeight
        0,         # bColorCount
        0,         # bReserved
        1,         # wPlanes
        bpp,       # wBitCount
        image_size,  # dwBytesInRes
        22         # dwImageOffset (6 header + 16 entry)
    )
    
    # Write ICO file
    ico_path = 'C:/Users/Manu/azurant-app/src-tauri/icons/icon.ico'
    with open(ico_path, 'wb') as f:
        f.write(icon_dir)
        f.write(icon_entry)
        f.write(bmp_header)
        f.write(pixel_data)
        f.write(and_mask)
    
    print(f"Created proper ICO: {ico_path}")
    print(f"  - Size: {width}x{height}")
    print(f"  - Image size: {image_size} bytes")
    print(f"  - Total file size: {os.path.getsize(ico_path)} bytes")
    
    return ico_path

create_proper_ico()