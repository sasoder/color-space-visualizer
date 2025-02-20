import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  ColorSpaceContainer,
  ColorSpaceVisualizerProps,
  createVertexLabel,
} from "./BaseColorSpaceVisualizer";
import { rgbToHls } from "@/lib/color-utils";

export function HLSDiamond(props: ColorSpaceVisualizerProps) {
  return (
    <ColorSpaceContainer {...props}>
      <HLSDiamondContent {...props} />
    </ColorSpaceContainer>
  );
}

// Cone parameters for proper HLS mapping
const CONE_HEIGHT = 1.0; // Normalized height for each cone
const CONE_RADIUS = 0.62; // Normalized radius at widest point
const CENTER_X = 0.5; // Center X position
const CENTER_Z = 0.5; // Center Z position
const Y_POS_TOP = 1.0; // Top of upper cone
const Y_POS_BOTTOM = 0.0; // Bottom of lower cone

function HLSDiamondContent({
  rgb,
  savedColors,
  selectedId,
  scene,
}: ColorSpaceVisualizerProps & { scene: THREE.Scene }) {
  const sceneRef = useRef<{
    points: Map<string, THREE.Mesh>;
    currentPoint?: THREE.Mesh;
    diamond?: THREE.Group;
  } | null>(null);

  // Initial setup
  useEffect(() => {
    // Create diamond geometry (a double cone) with correct placement.
    const diamond = createDiamondGeometry(scene);

    // Create vertex labels
    // Use a 30° offset so that the vertices line up with the following mapping:
    // Blue: 30°, Cyan: 90°, Green: 150°, Yellow: 210°, Red: 270°, Magenta: 330°.
    const ROTATION_OFFSET = Math.PI / 6; // 30 degrees offset

    // Calculated vertex positions
    const vertices = [
      // Black - Bottom tip of lower cone
      {
        pos: [0.5, Y_POS_BOTTOM - 0.55, 0.5] as [number, number, number],
        label: "Black",
      },

      // White - Top tip of upper cone
      {
        pos: [0.5, Y_POS_TOP + 0.55, 0.5] as [number, number, number],
        label: "White",
      },

      // Blue (should appear at 30°)
      {
        pos: [
          CENTER_X + CONE_RADIUS * Math.cos(0 + ROTATION_OFFSET),
          0.5,
          CENTER_Z + CONE_RADIUS * Math.sin(0 + ROTATION_OFFSET),
        ] as [number, number, number],
        label: "Blue",
      },

      // Cyan (should appear at 90°)
      {
        pos: [
          CENTER_X + CONE_RADIUS * Math.cos(Math.PI / 3 + ROTATION_OFFSET),
          0.5,
          CENTER_Z + CONE_RADIUS * Math.sin(Math.PI / 3 + ROTATION_OFFSET),
        ] as [number, number, number],
        label: "Cyan",
      },
      // Green (should appear at 150°)
      {
        pos: [
          CENTER_X +
            CONE_RADIUS * Math.cos((2 * Math.PI) / 3 + ROTATION_OFFSET),
          0.5,
          CENTER_Z +
            CONE_RADIUS * Math.sin((2 * Math.PI) / 3 + ROTATION_OFFSET),
        ] as [number, number, number],
        label: "Green",
      },
      // Yellow (should appear at 210°)
      {
        pos: [
          CENTER_X + CONE_RADIUS * Math.cos(Math.PI + ROTATION_OFFSET),
          0.5,
          CENTER_Z + CONE_RADIUS * Math.sin(Math.PI + ROTATION_OFFSET),
        ] as [number, number, number],
        label: "Yellow",
      },
      // Red (should appear at 270°)
      {
        pos: [
          CENTER_X +
            CONE_RADIUS * Math.cos((4 * Math.PI) / 3 + ROTATION_OFFSET),
          0.5,
          CENTER_Z +
            CONE_RADIUS * Math.sin((4 * Math.PI) / 3 + ROTATION_OFFSET),
        ] as [number, number, number],
        label: "Red",
      },

      // Magenta (should appear at 330°)
      {
        pos: [
          CENTER_X +
            CONE_RADIUS * Math.cos((5 * Math.PI) / 3 + ROTATION_OFFSET),
          0.5,
          CENTER_Z +
            CONE_RADIUS * Math.sin((5 * Math.PI) / 3 + ROTATION_OFFSET),
        ] as [number, number, number],
        label: "Magenta",
      },
    ];

    vertices.forEach(({ pos, label }) => {
      createVertexLabel(scene, pos, label);
    });

    // Create current point indicator
    const currentPointGeometry = new THREE.SphereGeometry(0.02);
    const currentPointMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255),
      transparent: true,
      opacity: 0.7,
    });
    const currentPoint = new THREE.Mesh(
      currentPointGeometry,
      currentPointMaterial
    );

    // Set initial position using the hlsToCartesian mapping.
    const [h, l, s] = rgbToHls(rgb[0], rgb[1], rgb[2]);
    const [x, y, z] = hlsToCartesian(h / 360, l / 100, s / 100);
    currentPoint.position.set(x, y, z);

    scene.add(currentPoint);

    // Store references for later cleanup/updating
    sceneRef.current = {
      points: new Map(),
      currentPoint,
      diamond,
    };

    return () => {
      // Cleanup diamond geometry
      diamond.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
      scene.remove(diamond);
      currentPoint.geometry.dispose();
      currentPoint.material.dispose();
      scene.remove(currentPoint);
    };
  }, [scene, rgb]);

  // Update current point position when rgb changes
  useEffect(() => {
    if (!sceneRef.current?.currentPoint) return;

    const [r, g, b] = rgb;
    const [h, l, s] = rgbToHls(r, g, b);
    const [x, y, z] = hlsToCartesian(
      h / 360, // Normalize hue from 0-360 to 0-1
      l / 100, // Normalize lightness
      s / 100 // Normalize saturation
    );

    sceneRef.current.currentPoint.position.set(x, y, z);
    const material = sceneRef.current.currentPoint
      .material as THREE.MeshBasicMaterial;
    material.color.setRGB(r / 255, g / 255, b / 255);
  }, [rgb]);

  // Update saved points
  useEffect(() => {
    if (!sceneRef.current) return;
    const points = sceneRef.current.points;

    // Remove points that no longer exist
    for (const [id, point] of points.entries()) {
      if (!savedColors.find((c) => c.id === id)) {
        scene.remove(point);
        points.delete(id);
      }
    }

    // Update or add points for each saved color
    savedColors.forEach((color) => {
      if (color.type !== "point") return;

      const [r, g, b] = color.rgb;
      const [h, l, s] = rgbToHls(r, g, b);
      const [x, y, z] = hlsToCartesian(h / 360, l / 100, s / 100);

      let point = points.get(color.id);

      if (!point) {
        const geometry = new THREE.SphereGeometry(0.02);
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color(r / 255, g / 255, b / 255),
          transparent: true,
        });
        point = new THREE.Mesh(geometry, material);
        scene.add(point);
        points.set(color.id, point);
      }

      point.position.set(x, y, z);
      const material = point.material as THREE.MeshBasicMaterial;
      material.color.setRGB(r / 255, g / 255, b / 255);

      if (color.id === selectedId) {
        point.scale.set(1.5, 1.5, 1.5);
        material.opacity = 1;
      } else {
        point.scale.set(1, 1, 1);
        material.opacity = 0.7;
      }
    });
  }, [savedColors, selectedId, scene]);

  return null;
}

// Helper function to create a double cone geometry (the HLS diamond)
function createDiamondGeometry(scene: THREE.Scene): THREE.Group {
  const group = new THREE.Group();
  const segments = 6;
  const coneHeight = CONE_HEIGHT;
  const coneRadius = CONE_RADIUS;

  // Create geometry for a cone
  const coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, segments);
  const material = new THREE.LineBasicMaterial({
    color: 0x000000,
    linewidth: 1,
  });

  // Create edge geometry from the cone geometry
  const edgesGeometry = new THREE.EdgesGeometry(coneGeometry);

  // Top cone (upper half)
  const upperCone = new THREE.LineSegments(edgesGeometry.clone(), material);
  upperCone.position.set(CENTER_X, Y_POS_TOP, CENTER_Z);

  // Bottom cone (inverted lower half)
  const lowerCone = new THREE.LineSegments(edgesGeometry.clone(), material);
  lowerCone.rotation.x = Math.PI;
  lowerCone.position.set(CENTER_X, Y_POS_BOTTOM, CENTER_Z);

  group.add(upperCone);
  group.add(lowerCone);
  scene.add(group);

  return group;
}

// Helper function to convert HLS coordinates to Cartesian coordinates.
// Now the mapping uses the formula:
//    angle (in degrees) = 270° - (hue in degrees)
// so that:
//    Red (0°) maps to 270°, Yellow (60°) maps to 210°,
//    Green (120°) maps to 150°, Cyan (180°) maps to 90°,
//    Blue (240°) maps to 30°, and Magenta (300°) maps to 330°.
// Lightness is mapped linearly to y (with 0 = black at bottom, 1 = white at top)
// and saturation is mapped radially with a maximum at l = 0.5 (the middle plane).
function hlsToCartesian(
  h: number, // 0-1 (representing hue from 0-360°)
  l: number, // 0-1 (representing lightness from 0-100%)
  s: number // 0-1 (representing saturation from 0-100%)
): [number, number, number] {
  // Convert normalized hue to degrees:
  const hueDegrees = h * 360;
  // Adjust the angle so that red (0°) goes to 270°,
  // yellow (60°) to 210°, green (120°) to 150°, etc.
  const angleDegrees = 270 - hueDegrees;
  const angle = angleDegrees * (Math.PI / 180);

  // Map lightness linearly to the vertical position between Y_POS_BOTTOM and Y_POS_TOP.
  const y = Y_POS_BOTTOM + (Y_POS_TOP - Y_POS_BOTTOM) * l;

  // Compute effective saturation.
  // This makes sure that full saturation is only achieved when l is 0.5.
  // When l is near 0 or 1 the effective saturation is reduced.
  const effectiveS = s * (1 - Math.abs(l - 0.5) * 2);

  // The maximum (horizontal) radius is achieved at l = 0.5.
  // Colors with lower or higher lightness will have decreased chroma.
  const radius = CONE_RADIUS * effectiveS;

  // Compute x and z coordinates using the angle.
  const x = CENTER_X + radius * Math.cos(angle);
  const z = CENTER_Z + radius * Math.sin(angle);

  return [x, y, z];
}
