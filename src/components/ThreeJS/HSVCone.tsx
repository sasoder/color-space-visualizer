import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  ColorSpaceContainer,
  ColorSpaceVisualizerProps,
  createVertexLabel,
} from "./BaseColorSpaceVisualizer";
import { rgbToHsv } from "@/lib/color-utils";

interface HSVConeContentProps extends ColorSpaceVisualizerProps {
  scene: THREE.Scene;
}

export function HSVCone(props: ColorSpaceVisualizerProps) {
  return (
    <ColorSpaceContainer {...props}>
      {({ scene }) => <HSVConeContent {...props} scene={scene} />}
    </ColorSpaceContainer>
  );
}

// Cone parameters for proper HSV mapping
const CONE_HEIGHT = 1.0; // Normalized height
const CONE_RADIUS = 0.62; // Normalized radius at base
const CENTER_X = 0.5; // Center X position
const CENTER_Z = 0.5; // Center Z position
const Y_POS_BOTTOM = 0.0; // Bottom of cone (black)
const Y_POS_TOP = 1.0; // Top of cone
const Y_OFFSET = -0.2; // Offset

function HSVConeContent({
  rgb,
  savedColors,
  selectedId,
  scene,
}: HSVConeContentProps) {
  const sceneRef = useRef<{
    points: Map<string, THREE.Mesh>;
    currentPoint?: THREE.Mesh;
    cone?: THREE.Group;
  } | null>(null);

  // Initial setup
  useEffect(() => {
    // Create cone geometry
    const cone = createConeGeometry(scene);

    // Add rotation offset to align vertices with desired orientation
    const ROTATION_OFFSET = Math.PI / 6; // 90 degree offset for counterclockwise rotation

    // Create vertex labels with proper positioning
    const vertices = [
      // Black - Bottom tip of cone
      {
        pos: [0.5, Y_POS_BOTTOM + Y_OFFSET, 0.5] as [number, number, number],
        label: "Black",
      },
      // Primary and Secondary Colors at maximum value
      // Red (0°)
      {
        pos: [
          CENTER_X + CONE_RADIUS * Math.cos(-0 - ROTATION_OFFSET),
          Y_POS_TOP + Y_OFFSET,
          CENTER_Z + CONE_RADIUS * Math.sin(-0 - ROTATION_OFFSET),
        ] as [number, number, number],
        label: "Red",
      },
      // Yellow (60°)
      {
        pos: [
          CENTER_X + CONE_RADIUS * Math.cos(-Math.PI / 3 - ROTATION_OFFSET),
          Y_POS_TOP + Y_OFFSET,
          CENTER_Z + CONE_RADIUS * Math.sin(-Math.PI / 3 - ROTATION_OFFSET),
        ] as [number, number, number],
        label: "Yellow",
      },
      // Green (120°)
      {
        pos: [
          CENTER_X +
            CONE_RADIUS * Math.cos((-2 * Math.PI) / 3 - ROTATION_OFFSET),
          Y_POS_TOP + Y_OFFSET,
          CENTER_Z +
            CONE_RADIUS * Math.sin((-2 * Math.PI) / 3 - ROTATION_OFFSET),
        ] as [number, number, number],
        label: "Green",
      },
      // Cyan (180°)
      {
        pos: [
          CENTER_X + CONE_RADIUS * Math.cos(-Math.PI - ROTATION_OFFSET),
          Y_POS_TOP + Y_OFFSET,
          CENTER_Z + CONE_RADIUS * Math.sin(-Math.PI - ROTATION_OFFSET),
        ] as [number, number, number],
        label: "Cyan",
      },
      // Blue (240°)
      {
        pos: [
          CENTER_X +
            CONE_RADIUS * Math.cos((-4 * Math.PI) / 3 - ROTATION_OFFSET),
          Y_POS_TOP + Y_OFFSET,
          CENTER_Z +
            CONE_RADIUS * Math.sin((-4 * Math.PI) / 3 - ROTATION_OFFSET),
        ] as [number, number, number],
        label: "Blue",
      },
      // Magenta (300°)
      {
        pos: [
          CENTER_X +
            CONE_RADIUS * Math.cos((-5 * Math.PI) / 3 - ROTATION_OFFSET),
          Y_POS_TOP + Y_OFFSET,
          CENTER_Z +
            CONE_RADIUS * Math.sin((-5 * Math.PI) / 3 - ROTATION_OFFSET),
        ] as [number, number, number],
        label: "Magenta",
      },
      // White - Center top of cone
      {
        pos: [0.5, Y_POS_TOP + Y_OFFSET, 0.5] as [number, number, number],
        label: "White",
      },
    ];

    vertices.forEach(({ pos, label }) => {
      createVertexLabel(scene, pos, label);
    });

    // Store references for later cleanup/updating
    sceneRef.current = {
      points: new Map(),
      cone,
    };

    return () => {
      // Cleanup cone geometry
      cone.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          child.material.dispose();
        }
      });
      scene.remove(cone);
    };
  }, [scene]);

  // Create and update current point
  useEffect(() => {
    if (!sceneRef.current) return;

    // Create current point if it doesn't exist
    if (!sceneRef.current.currentPoint) {
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
      scene.add(currentPoint);
      sceneRef.current.currentPoint = currentPoint;
    }

    // Update position and color
    const [r, g, b] = rgb;
    const [h, s, v] = rgbToHsv(r, g, b);
    const [x, y, z] = hsvToCartesian(
      h / 360, // Normalize hue from 0-360 to 0-1
      s / 100, // Normalize saturation from 0-100 to 0-1
      v / 100 // Normalize value from 0-100 to 0-1
    );

    sceneRef.current.currentPoint.position.set(x, y, z);
    const material = sceneRef.current.currentPoint
      .material as THREE.MeshBasicMaterial;
    material.color.setRGB(r / 255, g / 255, b / 255);

    return () => {
      if (sceneRef.current?.currentPoint) {
        const material = sceneRef.current.currentPoint.material;
        if (Array.isArray(material)) {
          material.forEach((m) => m.dispose());
        } else {
          material.dispose();
        }
        sceneRef.current.currentPoint.geometry.dispose();
        scene.remove(sceneRef.current.currentPoint);
        sceneRef.current.currentPoint = undefined;
      }
    };
  }, [rgb, scene]);

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
      const [h, s, v] = rgbToHsv(r, g, b);
      const [x, y, z] = hsvToCartesian(h / 360, s / 100, v / 100);

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

// Helper function to create a cone geometry
function createConeGeometry(scene: THREE.Scene): THREE.Group {
  const group = new THREE.Group();
  const segments = 6; // More segments for smoother circular base
  const coneHeight = CONE_HEIGHT;
  const coneRadius = CONE_RADIUS;

  // Create geometry for the cone
  const coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, segments);
  const material = new THREE.LineBasicMaterial({
    color: 0x000000,
    linewidth: 1,
  });

  // Create edge geometry from the cone geometry
  const edgesGeometry = new THREE.EdgesGeometry(coneGeometry);
  const cone = new THREE.LineSegments(edgesGeometry, material);

  // Position the cone with its base at the top (white) and tip at the bottom (black)
  cone.rotation.x = Math.PI; // Rotate 180 degrees to point downward
  cone.rotation.y = -Math.PI / 3; // Increased counterclockwise rotation
  cone.position.set(CENTER_X, Y_POS_TOP + Y_OFFSET - 0.5, CENTER_Z);

  group.add(cone);
  scene.add(group);

  return group;
}

// Helper function to convert HSV coordinates to Cartesian coordinates
function hsvToCartesian(
  h: number, // 0-1 (representing hue from 0-360°)
  s: number, // 0-1 (representing saturation from 0-100%)
  v: number // 0-1 (representing value from 0-100%)
): [number, number, number] {
  // Convert normalized hue to radians (negative angle for counterclockwise rotation)
  const angle = -h * 2 * Math.PI - Math.PI / 6;

  // Value determines the height (y-coordinate)
  const y = Y_POS_BOTTOM + Y_OFFSET + (Y_POS_TOP - Y_POS_BOTTOM) * v;

  // Saturation determines the distance from the center axis
  // Scale by value to create the cone shape
  const radius = CONE_RADIUS * s * v;

  // Calculate x and z coordinates based on hue angle and radius
  const x = CENTER_X + radius * Math.cos(angle);
  const z = CENTER_Z + radius * Math.sin(angle);

  return [x, y, z];
}
