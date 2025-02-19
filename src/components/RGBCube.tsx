import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { SavedColor } from "@/types/color";

interface RGBCubeProps {
  rgb: [number, number, number];
  savedColors: SavedColor[];
  selectedId: string;
}

export function RGBCube({ rgb, savedColors, selectedId }: RGBCubeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    points: Map<string, THREE.Mesh>;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setClearColor(0x1a1a1a); // Dark background
    containerRef.current.appendChild(renderer.domElement);

    // Create cube edges - shifted to align with positive octant
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    cubeGeometry.translate(0.5, 0.5, 0.5); // Center cube in positive octant
    const edges = new THREE.EdgesGeometry(cubeGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    scene.add(wireframe);

    // Add vertex labels
    const vertices = [
      { pos: [0, 0, 0], label: "Black" },
      { pos: [1, 0, 0], label: "Red" },
      { pos: [0, 1, 0], label: "Green" },
      { pos: [0, 0, 1], label: "Blue" },
      { pos: [1, 1, 0], label: "Yellow" },
      { pos: [1, 0, 1], label: "Magenta" },
      { pos: [0, 1, 1], label: "Cyan" },
      { pos: [1, 1, 1], label: "White" },
    ];

    // Create text sprites for labels
    vertices.forEach(({ pos, label }) => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.width = 128;
      canvas.height = 32;
      context.fillStyle = "#ffffff";
      context.font = "32px Inter";
      context.fillText(label, 0, 32);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      const [x, y, z] = pos;
      sprite.position.set(x, y, z);
      sprite.scale.set(0.3, 0.075, 1);
      scene.add(sprite);
    });

    // Add axes - positioned at origin
    const axesHelper = new THREE.AxesHelper(1.2);
    scene.add(axesHelper);

    // Setup camera and controls
    camera.position.set(1.5, 1.5, 1.5);
    camera.lookAt(0.5, 0.5, 0.5);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0.5, 0.5, 0.5); // Set orbit target to cube center

    // Store references
    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      points: new Map(),
    };

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Update points when savedColors change
  useEffect(() => {
    if (!sceneRef.current) return;
    const { scene, points } = sceneRef.current;

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

      // Convert RGB values (0-255) to cube space (0-1)
      const [r, g, b] = color.rgb;
      const position: [number, number, number] = [r / 255, g / 255, b / 255];

      let point = points.get(color.id);

      if (!point) {
        // Create new point
        const geometry = new THREE.SphereGeometry(0.03); // Slightly larger points
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color(position[0], position[1], position[2]),
          transparent: true,
        });
        point = new THREE.Mesh(geometry, material);
        scene.add(point);
        points.set(color.id, point);
      }

      // Update position and appearance
      point.position.set(position[0], position[1], position[2]);
      const material = point.material as THREE.MeshBasicMaterial;
      material.color.setRGB(position[0], position[1], position[2]);

      // Highlight selected point
      if (color.id === selectedId) {
        point.scale.set(1.5, 1.5, 1.5);
        material.opacity = 1;
      } else {
        point.scale.set(1, 1, 1);
        material.opacity = 0.7;
      }
    });
  }, [savedColors, selectedId]);

  return <div ref={containerRef} className="w-full h-full" />;
}
