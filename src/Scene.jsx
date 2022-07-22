import { Suspense, useMemo } from "react"
import { Canvas, invalidate } from "@react-three/fiber";
import { softShadows, OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { EffectComposer, Outline, Selection, Vignette } from "@react-three/postprocessing";

import { useStore, useTreeStore, useColorStore } from "Storage";
import { ModuleTree } from "Modules";
import { coerceTree } from "NodeEditor";

import BALL from "assets/ball.gltf";
import FOREST from "assets/forest.hdr";


softShadows();

export default function Ball(props) {
    const { nodes, materials } = useGLTF(BALL);

    return (
        <group {...props} dispose={null} scale={3} position={[0, 2, 0]}>
            <mesh geometry={nodes.Sphere.geometry} material={materials.palm_tree_bark} />
        </group>
    );
}


export const Scene = (props) => {
    const color = useColorStore(state => state.colorData);
    const background = color["background"];
    const axis = color["axis"];
    const grid = color["grid"];

    const tree = useTreeStore(state => state.treeData);
    const setSelection = useStore(state => state.setSelection);

    const memoizedNode = useMemo(() => coerceTree(tree), [tree]);

    return (
        <Canvas
            frameloop="demand"
            camera={{ position: [-5, 2, 10], fov: 60 }}
            shadows
            shadowMap
            colorManagement
            onPointerMissed={(e) => {
                if (e.button === 0) {
                    setSelection({});
                }
                invalidate();
            }}
        >
            {/* <EffectComposer> */}
            {/*     <Vignette */}
            {/*         offset={0.1} // vignette offset */}
            {/*         darkness={1} // vignette darkness */}
            {/*         eskil={false} // Eskil's vignette technique */}
            {/*     /> */}
            {/* </EffectComposer> */}

            <Suspense fallback={null} >
                <Environment background={false} near={1} far={1000} resolution={256} files={FOREST} />
                <color attach="background" args={[background]} />

                <group>
                    <Ball />
                    <group position={[0, 3.5, 0]} rotation={[0, 0, Math.PI]}>
                        <ModuleTree node={memoizedNode} />
                    </group>
                    <gridHelper args={[100, 20, axis, grid]} position={[0, 0, 0]} />
                </group>
                <OrbitControls />
            </Suspense>
        </Canvas >
    );
};
