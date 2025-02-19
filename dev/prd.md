#### **Modern Interactive Color Space Visualization**

**Overview:**  
Create a modern, interactive web application to explore RGB, HLS, and HSV color spaces using Three.js and ShadcnUI components.

### **Layout:**

- A clean, minimal interface with a dark theme and modern design, featuring subtle rainbow-colored highlights.
- Three interactive 3D visualization panels arranged horizontally, each equally sized and independently rotatable.
- A control panel (bottom or side) with ShadcnUI components for user interactions.

### **3D Visualizations:**

#### **1. RGB Cube**

- A 3D cube where each axis represents R, G, and B values (0-255).
- Cube edges are white lines (hidden edges appear as dotted lines).
- Users can select regions within the cube using transparent selection planes.
- Coordinate axes with labels, including key points (red, green, blue, magenta, yellow, cyan, black, white).

#### **2. HLS Double-Cone**

- A low-polygon double-cone:
  - Hue (0-360°) rotates around the vertical axis.
  - Lightness (0-100%) runs vertically.
  - Saturation (0-100%) is the distance from the vertical axis.
- Grid lines:
  - Circular: every 30° hue.
  - Vertical: every 10% lightness.
- Labels for key vertices (black, white, and extreme saturation values).

#### **3. HSV Cone**

- A single cone representation:
  - Hue (0-360°) rotates around the vertical axis.
  - Saturation (0-100%) is the distance from the center.
  - Value (0-100%) runs vertically.
- Grid lines:
  - Circular: every 30° hue.
  - Vertical: every 10% value.
- Labels for key vertices (black, white, and extreme saturation values).

### **Interactive Features:**

- Independent camera controls for rotating and zooming each 3D view.
- Click on a point, volume, or region to highlight its equivalent across all three views.
- Selection tools for choosing both specific values and value ranges.
  - Ability to "save" these in state, so that the color picker/range sliders only affect a selected "object". This should be in a selectable list view, so that you can update/remove them at any point

### **Controls (ShadcnUI Components):**

- Sliders for adjusting color values in any space.
- Toggle buttons for showing/hiding grid lines and axes.
- Reset camera button for each view.
- Color picker input that updates all visualizations in real-time.

### **Technical Requirements:**

- Three.js for 3D rendering.
- ShadcnUI for UI elements.
- Reactive state management for synchronized updates.
- Built-in color space conversion utilities.

### **Styling:**

- Dark theme for background, subtle rainbow accents.
- Grid lines in dark gray, labels in light gray
- UI elements styled with ShadcnUI’s modern aesthetic.
- Font: Clean sans-serif (Inter).
