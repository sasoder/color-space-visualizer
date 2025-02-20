import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  ColorSpaceContainer,
  ColorSpaceVisualizerProps,
  createVertexLabel,
} from "./BaseColorSpaceVisualizer";
import { rgbToHsl } from "@/lib/color-utils";
export function HLSDiamond(props: ColorSpaceVisualizerProps) {
  return (
    <ColorSpaceContainer {...props}>
      <HLSDiamondContent {...props} />
    </ColorSpaceContainer>
  );
}

// Cone parameters for proper HLS mapping
const CONE_HEIGHT = 1.0; // Normalized height for each cone
const CONE_RADIUS = 0.5; // Normalized radius at widest point
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

      // Blue (0° + offset)
      {
        pos: [
          CENTER_X + CONE_RADIUS * Math.cos(0 + ROTATION_OFFSET),
          0.5,
          CENTER_Z + CONE_RADIUS * Math.sin(0 + ROTATION_OFFSET),
        ] as [number, number, number],
        label: "Blue",
      },

      // Green (60° + offset)
      {
        pos: [
          CENTER_X + CONE_RADIUS * Math.cos(Math.PI / 3 + ROTATION_OFFSET),
          0.5,
          CENTER_Z + CONE_RADIUS * Math.sin(Math.PI / 3 + ROTATION_OFFSET),
        ] as [number, number, number],
        label: "Green",
      },

      // Cyan (120° + offset)
      {
        pos: [
          CENTER_X +
            CONE_RADIUS * Math.cos((2 * Math.PI) / 3 + ROTATION_OFFSET),
          0.5,
          CENTER_Z +
            CONE_RADIUS * Math.sin((2 * Math.PI) / 3 + ROTATION_OFFSET),
        ] as [number, number, number],
        label: "Cyan",
      },

      // Red (180° + offset)
      {
        pos: [
          CENTER_X + CONE_RADIUS * Math.cos(Math.PI + ROTATION_OFFSET),
          0.5,
          CENTER_Z + CONE_RADIUS * Math.sin(Math.PI + ROTATION_OFFSET),
        ] as [number, number, number],
        label: "Red",
      },

      // Magenta (240° + offset)
      {
        pos: [
          CENTER_X +
            CONE_RADIUS * Math.cos((4 * Math.PI) / 3 + ROTATION_OFFSET),
          0.5,
          CENTER_Z +
            CONE_RADIUS * Math.sin((4 * Math.PI) / 3 + ROTATION_OFFSET),
        ] as [number, number, number],
        label: "Magenta",
      },

      // Yellow (300° + offset)
      {
        pos: [
          CENTER_X +
            CONE_RADIUS * Math.cos((5 * Math.PI) / 3 + ROTATION_OFFSET),
          0.5,
          CENTER_Z +
            CONE_RADIUS * Math.sin((5 * Math.PI) / 3 + ROTATION_OFFSET),
        ] as [number, number, number],
        label: "Yellow",
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

    // Set initial position
    const [h, l, s] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
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
      // Cleanup
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

  // Update current point position
  useEffect(() => {
    if (!sceneRef.current?.currentPoint) return;

    const [r, g, b] = rgb;
    const [h, l, s] = rgbToHsl(r, g, b);
    // Normalize HLS values to 0-1 range
    const [x, y, z] = hlsToCartesian(
      h / 360, // Normalize hue from 0-360 to 0-1
      l / 100, // Normalize lightness from 0-100 to 0-1
      s / 100 // Normalize saturation from 0-100 to 0-1
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

    // Remove points that are no longer in savedColors
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
      const [h, l, s] = rgbToHsl(r, g, b);
      // Normalize HLS values to 0-1 range
      const [x, y, z] = hlsToCartesian(
        h / 360, // Normalize hue from 0-360 to 0-1
        l / 100, // Normalize lightness from 0-100 to 0-1
        s / 100 // Normalize saturation from 0-100 to 0-1
      );

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

  // Create the geometry for a cone
  const coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, segments);
  const material = new THREE.LineBasicMaterial({
    color: 0x000000,
    linewidth: 1,
  });

  // Create edge geometry from the cone geometry
  const edgesGeometry = new THREE.EdgesGeometry(coneGeometry);

  // Top cone with edges
  const upperCone = new THREE.LineSegments(edgesGeometry.clone(), material);
  upperCone.position.set(CENTER_X, Y_POS_TOP, CENTER_Z);

  // Bottom cone with edges
  const lowerCone = new THREE.LineSegments(edgesGeometry.clone(), material);
  lowerCone.rotation.x = Math.PI;
  lowerCone.position.set(CENTER_X, Y_POS_BOTTOM, CENTER_Z);

  group.add(upperCone);
  group.add(lowerCone);
  scene.add(group);

  return group;
}
// Helper function to convert HLS coordinates to Cartesian coordinates
function hlsToCartesian(
  h: number, // 0-1 (from 0-360 degrees)
  l: number, // 0-1 (from 0-100%)
  s: number // 0-1 (from 0-100%)
): [number, number, number] {
  // Convert hue to angle (in radians)
  const angle = h * 2 * Math.PI + Math.PI / 6; // Add 30-degree offset to match the diamond orientation

  // Calculate the vertical position (y)
  // When l = 0, y should be at bottom (black)
  // When l = 1, y should be at top (white)
  // When l = 0.5, y should be at middle (maximum saturation possible)
  const y = Y_POS_BOTTOM + (Y_POS_TOP - Y_POS_BOTTOM) * l;

  // Calculate the maximum possible radius at this lightness level
  // The radius should be maximum at l = 0.5 and decrease linearly to 0 at l = 0 or l = 1
  const maxPossibleRadius = CONE_RADIUS * (1 - Math.abs(2 * l - 1));

  // Scale the radius by saturation
  const radius = maxPossibleRadius * s;

  // Calculate x and z coordinates based on hue angle and radius
  const x = CENTER_X + radius * Math.cos(angle);
  const z = CENTER_Z + radius * Math.sin(angle);

  return [x, y, z];
}
