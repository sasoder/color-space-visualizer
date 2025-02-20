import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  ColorSpaceContainer,
  ColorSpaceVisualizerProps,
  createVertexLabel,
} from "./BaseColorSpaceVisualizer";

interface RGBCubeContentProps extends ColorSpaceVisualizerProps {
  scene: THREE.Scene;
}

export function RGBCube(props: ColorSpaceVisualizerProps) {
  return (
    <ColorSpaceContainer {...props}>
      {({ scene }) => <RGBCubeContent {...props} scene={scene} />}
    </ColorSpaceContainer>
  );
}

function RGBCubeContent({
  rgb,
  savedColors,
  selectedId,
  scene,
}: RGBCubeContentProps) {
  const sceneRef = useRef<{
    points: Map<string, THREE.Mesh>;
    currentPoint?: THREE.Mesh;
    edgeLines?: THREE.LineSegments;
    cube?: THREE.Mesh;
  } | null>(null);

  // Initial setup
  useEffect(() => {
    // Create cube geometry and invisible mesh for raycasting
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    cubeGeometry.translate(0.5, 0.5, 0.5);
    const cubeMaterial = new THREE.MeshBasicMaterial({
      visible: false,
      side: THREE.BackSide,
    });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    scene.add(cube);

    // Create edges
    const edges = createEdges(scene);

    // Create vertex labels
    const vertices: Array<{ pos: [number, number, number]; label: string }> = [
      { pos: [0, 0, 0], label: "Black" },
      { pos: [1, 0, 0], label: "Red" },
      { pos: [0, 1, 0], label: "Green" },
      { pos: [0, 0, 1], label: "Blue" },
      { pos: [1, 1, 0], label: "Yellow" },
      { pos: [1, 0, 1], label: "Magenta" },
      { pos: [0, 1, 1], label: "Cyan" },
      { pos: [1, 1, 1], label: "White" },
    ];

    vertices.forEach(({ pos, label }) => {
      createVertexLabel(scene, pos, label);
    });

    // Create current point indicator
    const currentPointGeometry = new THREE.SphereGeometry(0.02);
    const currentPointMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.7,
    });
    const currentPoint = new THREE.Mesh(
      currentPointGeometry,
      currentPointMaterial
    );
    scene.add(currentPoint);

    // Store references
    sceneRef.current = {
      points: new Map(),
      currentPoint,
      ...edges,
      cube,
    };

    return () => {
      // Cleanup
      cube.geometry.dispose();
      cube.material.dispose();
      scene.remove(cube);
      edges.edgeLines?.geometry.dispose();
      edges.edgeLines?.material.dispose();
      scene.remove(edges.edgeLines!);
      currentPoint.geometry.dispose();
      currentPoint.material.dispose();
      scene.remove(currentPoint);
    };
  }, [scene]);

  // Update current point position
  useEffect(() => {
    if (!sceneRef.current?.currentPoint) return;
    const [r, g, b] = rgb;
    const position: [number, number, number] = [r / 255, g / 255, b / 255];
    sceneRef.current.currentPoint.position.set(
      position[0],
      position[1],
      position[2]
    );
    const material = sceneRef.current.currentPoint
      .material as THREE.MeshBasicMaterial;
    material.color.setRGB(position[0], position[1], position[2]);
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
      const position: [number, number, number] = [r / 255, g / 255, b / 255];

      let point = points.get(color.id);

      if (!point) {
        const geometry = new THREE.SphereGeometry(0.02);
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color(position[0], position[1], position[2]),
          transparent: true,
        });
        point = new THREE.Mesh(geometry, material);
        scene.add(point);
        points.set(color.id, point);
      }

      point.position.set(position[0], position[1], position[2]);
      const material = point.material as THREE.MeshBasicMaterial;
      material.color.setRGB(position[0], position[1], position[2]);

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

// Helper function to create edges
function createEdges(scene: THREE.Scene) {
  const material = new THREE.LineBasicMaterial({
    color: 0x000000,
    linewidth: 1,
  });

  // Create initial edge geometries
  const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
  const edgeLines = new THREE.LineSegments(edges, material);
  edgeLines.position.set(0.5, 0.5, 0.5);
  scene.add(edgeLines);

  return { edgeLines };
}
