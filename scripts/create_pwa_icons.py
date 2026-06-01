import struct
import zlib
import os

def create_png(size, filename):
    """Create a simple PNG with Azur brand colors"""
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
            # Blue gradient with center circle
            dist = ((x - size/2)**2 + (y - size/2)**2)**0.5
            max_dist = size / 2
            if dist < max_dist * 0.7:
                # Inner circle - azur blue
                r, g, b = 30, 64, 175
            elif dist < max_dist * 0.85:
                # Ring - cyan
                r, g, b = 6, 182, 212
            else:
                # Outer - transparent
                r, g, b = 15, 23, 42
            raw_data += bytes([r, g, b, 255])
    
    compressed = zlib.compress(raw_data, 9)
    idat = png_chunk(b'IDAT', compressed)
    iend = png_chunk(b'IEND', b'')
    
    with open(filename, 'wb') as f:
        f.write(signature + ihdr + idat + iend)

# Create icons
os.makedirs('C:/Users/Manu/azurant-app/public/assets', exist_ok=True)
create_png(192, 'C:/Users/Manu/azurant-app/public/assets/icon-192.png')
create_png(512, 'C:/Users/Manu/azurant-app/public/assets/icon-512.png')
create_png(512, 'C:/Users/Manu/azurant-app/public/assets/icon-maskable.png')
print("PWA icons created")