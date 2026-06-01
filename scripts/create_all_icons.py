import struct
import zlib
import os

def create_ico_with_sizes(sizes=[16, 32, 48, 256]):
    images = []
    
    for size in sizes:
        # Create 32-bit BGRA image with blue gradient
        pixels = []
        for y in range(size):
            row = []
            for x in range(size):
                # Azur brand blue gradient
                b = int(189 * (1 - y/size) + 6 * (y/size))
                g = int(107 * (1 - y/size) + 182 * (y/size))
                r = int(30 * (1 - y/size) + 214 * (y/size))
                a = 255
                row.extend([b, g, r, a])
            pixels.append(bytes(row))
        
        and_mask_row_size = ((size + 31) // 32) * 4
        and_mask = bytes(and_mask_row_size * size)
        
        # BITMAPINFOHEADER (40 bytes)
        bmp_header = struct.pack('<IIIHHIIIIII',
            40, size, size * 2, 1, 32, 0, 
            size * size * 4, 0, 0, 0, 0
        )
        
        image_data = b''.join(reversed(pixels)) + and_mask
        
        images.append({
            'size': size,
            'data': bmp_header + image_data
        })
    
    # ICONDIR header
    num_images = len(images)
    header = struct.pack('<HHH', 0, 1, num_images)
    
    # Calculate offsets
    data_offset = 6 + 16 * num_images  # Header + entries
    
    entries = b''
    image_data = b''
    
    for img in images:
        size = img['size']
        data = img['data']
        
        entry = struct.pack('<BBBBHHII', 
            size if size < 256 else 0,
            size if size < 256 else 0,
            0, 0, 1, 32, len(data), data_offset
        )
        entries += entry
        data_offset += len(data)
        image_data += data
    
    # Write ICO file
    ico_path = 'C:/Users/Manu/azurant-app/src-tauri/icons/icon.ico'
    with open(ico_path, 'wb') as f:
        f.write(header + entries + image_data)
    
    print(f"Created {ico_path} with {num_images} sizes: {sizes}")
    return ico_path

def create_png(size):
    # Simple solid color PNG with Azur branding
    def png_chunk(chunk_type, data):
        chunk_len = struct.pack('>I', len(data))
        chunk_crc = struct.pack('>I', zlib.crc32(chunk_type + data) & 0xffffffff)
        return chunk_len + chunk_type + data + chunk_crc
    
    # PNG signature
    signature = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)  # 8-bit RGBA
    ihdr = png_chunk(b'IHDR', ihdr_data)
    
    # IDAT chunk (compressed image data)
    raw_data = b''
    for y in range(size):
        raw_data += b'\x00'  # Filter type: None
        for x in range(size):
            # Blue gradient with clamping
            r = min(255, 30 + x*5)
            g = min(255, 107 + y*3)
            b = min(255, 189 - y*2)
            raw_data += bytes([r, g, b, 255])
    
    compressed = zlib.compress(raw_data, 9)
    idat = png_chunk(b'IDAT', compressed)
    
    # IEND chunk
    iend = png_chunk(b'IEND', b'')
    
    return signature + ihdr + idat + iend

# Create icons directory
icons_dir = 'C:/Users/Manu/azurant-app/src-tauri/icons'
os.makedirs(icons_dir, exist_ok=True)

# Create ICO
create_ico_with_sizes([16, 32, 48, 256])

# Create PNG files for various sizes
for size in [32, 128, 256]:
    png_data = create_png(size)
    png_path = f'{icons_dir}/{size}x{size}.png'
    with open(png_path, 'wb') as f:
        f.write(png_data)
    print(f"Created {png_path}")

# Create icon.icns placeholder (macOS) - just a copy of 256x256 png for now
png_path = f'{icons_dir}/icon.icns'
with open(png_path, 'wb') as f:
    f.write(create_png(256))
print(f"Created {png_path}")

print("\nAll icons created successfully!")