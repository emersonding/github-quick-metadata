#!/bin/bash

# Convert SVG icon to PNG at different sizes
# Requires rsvg-convert (librsvg2-bin on Ubuntu, librsvg on macOS via brew)

SVG_FILE="../assets/icon.svg"
OUTPUT_DIR="../assets"

# Check if rsvg-convert is available
if ! command -v rsvg-convert &> /dev/null; then
    echo "rsvg-convert not found. Please install:"
    echo "  macOS: brew install librsvg"
    echo "  Ubuntu/Debian: sudo apt-get install librsvg2-bin"
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Convert to different sizes
sizes=(16 32 48 128)

for size in "${sizes[@]}"; do
    echo "Creating ${size}x${size} PNG..."
    rsvg-convert -w $size -h $size "$SVG_FILE" -o "$OUTPUT_DIR/icon${size}.png"
done

echo "Icon conversion complete!"
echo "Generated icons in $OUTPUT_DIR:"
ls -lh "$OUTPUT_DIR"/icon*.png
