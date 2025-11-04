# Analog Journal - User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Core Concepts](#core-concepts)
3. [Camera Management](#camera-management)
4. [Film Management](#film-management)
5. [Frame Management](#frame-management)
6. [Data Backup & Import](#data-backup--import)
7. [Tips & Tricks](#tips--tricks)

---

## Introduction

**Analog Journal** is an application for managing analog films and photographs. It helps you track:
- Which films you're using
- Which cameras you own
- Details of each individual frame
- Exposure settings, lenses, notes, and locations

All data is stored locally on your device and you don't need an internet connection for basic features.

---

## Core Concepts

### Data Hierarchy

```
Camera
    └── Film (loaded in camera)
        └── Frame 1
        └── Frame 2
        └── Frame 3...
```

### Film States

- **Active Film** - Film is loaded in a camera and ready for shooting
- **Developed Film** - Film has been shot and developed (archived)
- **Undeveloped Film** - Film is waiting to be shot or developed

---

## Camera Management

### Adding a Camera

1. Click **"Cameras"** in the bottom navigation
2. Click the **+** button in the bottom right
3. Fill in the information:
   - **Name** - Model name (e.g., "Nikon F3")
   - **Brand** - Manufacturer (e.g., "Nikon")
   - **Type** - Camera format (35mm, Medium Format, Large Format)
   - **Notes** - Optional notes

### Loading Film into Camera

1. Open camera details by clicking on the card
2. Click **"Load Film"**
3. Select a film from the list of available films
4. Film is now attached to the camera

### Unloading Film

- Film automatically unloads when you mark it as developed
- Or you can unload the film in camera detail with **"Unload Film"** button

### Deleting a Camera

1. Open **"Cameras"**
2. Click the trash icon on the camera card
3. If the camera has loaded film, you'll be warned
4. The film will be preserved, only unloaded from the camera

---

## Film Management

### Adding a Film

1. On the home screen, click **"Add Film"**
2. Fill in basic information:
   - **Name** - Film identification (e.g., "Trip to Prague")
   - **Type** - Film type (Color Negative, B&W, Slide)
   - **Brand** - Manufacturer (Kodak, Fuji, Ilford...)
   - **ISO** - Film sensitivity (100, 200, 400, 800...)
   - **Total Frames** - Number of exposures on the film (24, 36...)
   - **Notes** - Optional notes

### Film Detail

In the film detail you'll find:
- **Film Information** - Type, brand, ISO, frame count
- **Frame List** - All captured frames
- **Add Frame Button** - Add a new frame (only if not developed)
- **Mark as Developed Button** - Mark the film as developed

### Marking Film as Developed

1. Open film detail
2. Click the **green button** with checkmark icon in the bottom left
3. Click again to show the full text
4. Confirm the action in the dialog

**What happens:**
- Film unloads from camera (if loaded)
- Cannot add more frames
- Film moves to archived films section

### Reverting Film to Undeveloped

If you accidentally marked a film as developed:

1. Open the developed film detail
2. Click the **red button** with undo icon
3. Confirm the action in the dialog

**What happens:**
- Film returns to "undeveloped" state
- You can add frames again
- You can load the film back into a camera

### Deleting a Film

1. On the home screen, find the film
2. Click the trash icon
3. Confirm deletion
4. **Warning:** This will also delete all frames on the film!

---

## Frame Management

### Adding a Frame

1. Open film detail
2. Click the **blue + button** in the bottom right
3. Fill in information through dialog windows

### Frame Parameters

#### Required
- **Frame Number** - Automatically suggested number

#### Optional
- **Aperture** - f/1.4, f/2, f/2.8, f/4, f/5.6, f/8, f/11, f/16, f/22 or Custom
- **Shutter Speed** - 1/8000 to 30s or Custom
- **Lens** - Text description (e.g., "50mm f/1.8")
- **Scene Type** - Portrait, Landscape, Street, Macro, Architecture, Other
- **Location** - Place where photo was taken with GPS support
- **Notes** - Additional information

### GPS and Maps

When entering location, you can:

1. **Use Current Location** - Click "Use Current Location" button
2. **Select on Map** - Click on the map to select a place
3. **Enter Manually** - Type the place name

**System Automatically:**
- Requests GPS permission (first use)
- Shows your current location on the map
- Converts GPS coordinates to address (reverse geocoding)
- Saves both coordinates and text address

**Map Providers:**
- **Google Maps** - If you have API key set up (28,000 free loads per month)
- **OpenStreetMap** - Default fallback without API key

### Editing a Frame

1. Open frame detail
2. Click the **"Edit"** button
3. Select what you want to edit:
   - Aperture
   - Shutter Speed
   - Lens
   - Scene Type
   - Location
   - Notes

### Deleting a Frame

1. Open frame detail
2. Click the trash icon
3. Confirm deletion

---

## Data Backup & Import

### Exporting Data

1. Open **Settings** (gear icon)
2. In the "Data Management" section, click **"Export Data"**
3. A JSON file with all data will download
4. Save this file as a backup

**What gets exported:**
- All films
- All frames
- All cameras
- Timestamps and metadata

### Importing Data

1. Open **Settings**
2. Click **"Import Data"**
3. Select a JSON file from previous export
4. System will:
   - Check for duplicates (by ID)
   - Import only new data
   - Show statistics (how many added/skipped)

**Note:** Import does not overwrite existing data!

### Clearing All Data

1. Open **Settings**
2. Click **"Clear All Data"**
3. **First confirmation** - Warning
4. **Second confirmation** - Final check
5. All data will be permanently deleted

**Warning:** This action is irreversible! Always export before doing this.

---

## Tips & Tricks

### Gestures

- **Swipe Back** - Swipe from left to right to go back to previous page
- Works on all subpages except the home screen

### Quick Actions

- **Expandable FAB** - Click circular buttons to show text
- **Auto-collapse** - Button automatically collapses after 5 seconds
- **Skip → Continue** - When filling optional fields, button text changes

### Efficient Workflow

1. **Start with Cameras** - First add your cameras
2. **Add Film** - Create a new film and load it into a camera
3. **Shoot** - After each shot, add a record to the app
4. **Development** - After shooting the film, mark it as developed
5. **Backup** - Regularly export your data

### Custom Values

- When selecting aperture or shutter speed, you can use **"Custom"**
- Enter any value (e.g., f/1.2, 1/3000s)
- Useful for special lenses or non-standard settings

### Organization

- **Film Naming** - Use descriptive names (date, location, project)
- **Notes** - Add notes to films and frames for better context
- **Statistics** - In Settings, see total count of films, frames, and cameras

### Offline Usage

- App works fully offline
- Data is stored locally on your device (IndexedDB)
- GPS and maps require internet only for initial loading
- Reverse geocoding requires internet; if it fails, coordinates are saved

### Compatibility

- **Desktop** - Fully supported (Chrome, Firefox, Safari, Edge)
- **Mobile** - Responsive design, touch controls
- **Tablets** - Optimized for touchscreens

---

## Common Issues

### GPS not working
- Check if you've granted location access to the app
- GPS requires HTTPS connection (or localhost)
- On mobile, check system permissions

### Data disappeared
- Data is stored on your device - clearing browser/app data deletes app data
- Export backups regularly!
- Data is specific to each domain (localhost ≠ production)

### Import not working
- Check if the file is valid JSON
- File must be created by Analog Journal export
- Check browser console for error messages

### Cannot delete film
- Films with loaded cameras can be deleted
- A warning is shown, but deletion is possible
- Camera automatically unloads

---

## Support

If you have questions or suggestions for improvement:
- Open an issue on GitHub
- Contact the developer via email
- Visit the project documentation

**Version:** 1.0.0  
**Last Updated:** November 2025
