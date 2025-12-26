# Desktop App Assets

This folder should contain the application icons for Electron builds:

## Required Icons

### Windows

- `icon.ico` - Windows application icon (256x256 or larger, multi-resolution recommended)

### macOS

- `icon.icns` - macOS application icon (1024x1024 recommended)

### Linux

- `icon.png` - PNG icon (512x512 or 1024x1024 recommended)

## Icon Generation

You can use tools like:

- [electron-icon-builder](https://github.com/nicholasalx/electron-icon-builder)
- [icon-gen](https://github.com/nicholasalx/icon-gen)
- Online converters

### Example using icon-gen:

```bash
# Install icon-gen globally
npm install -g icon-gen

# Generate all icon formats from a source PNG (1024x1024 recommended)
icon-gen -i source-icon.png -o ./assets
```

## Placeholder

For development, you can use a simple placeholder icon. The build process will work without icons, but the application will use default OS icons.
