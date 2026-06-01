import struct
import zlib
import os

def create_png(size):
    def png_chunk(chunk_type, data):
        chunk_len = struct.pack('>I', len(data))
        chunk_crc = struct.pack('>I', zlib.crc32(chunk_type + data) & 0xffffffff)
        return chunk_len + chunk_type + data + chunk_crc
    
    signature = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    ihdr = png_chunk(b'IHDR', ihdr_data)
    
    raw_data = b''
    for y in range(size):
        raw_data += b'\x00'
        for x in range(size):
            # Solid azur blue
            raw_data += b'\x1e\x6b\xbd\xff'
    
    compressed = zlib.compress(raw_data, 9)
    idat = png_chunk(b'IDAT', compressed)
    iend = png_chunk(b'IEND', b'')
    
    return signature + ihdr + idat + iend

icons_dir = 'C:/Users/Manu/azurant-app/src-tauri/icons'
os.makedirs(icons_dir, exist_ok=True)

# Create ICO with just 32x32
ico_data = b''
for size in [32]:
    png = create_png(size)
    bmp_header = struct.pack('<IIIHHIIIIII', 40, size, size*2, 1, 32, 0, size*size*4, 0, 0, 0, 0)
    ico_data += struct.pack('<BBBBHHII', size, size, 0, 0, 1, 32, 40 + len(png), 6 + 16)
    ico_data += bmp_header + png

header = struct.pack('<HHH', 0, 1, 1)
with open(f'{icons_dir}/icon.ico', 'wb') as f:
    f.write(header + ico_data)
print(f"Created icon.ico")

for size in [32, 128, 256]:
    with open(f'{icons_dir}/{size}x{size}.png', 'wb') as f:
        f.write(create_png(size))
    print(f"Created {size}x{size}.png")

# Create icns placeholder
with open(f'{icons_dir}/icon.icns', 'wb') as f:
    f.write(create_png(256))
print(f"Created icon.icns")

print("\nDone!")