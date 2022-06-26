import { Suspense } from "react"
import { Canvas } from "@react-three/fiber";
import { softShadows, OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { EffectComposer, Outline, Selection, Vignette } from "@react-three/postprocessing";

import { LevaStoreProvider } from "leva";

import { useStore, useTreeStore } from "./Storage";
import { ModuleTree } from "./Modules";

softShadows();

export default function Ball({ ...props }) {
    const { nodes, materials } = useGLTF(process.env.PUBLIC_URL + '/ball_palm.gltf')

    return (
        <group {...props} dispose={null} scale={3} position={[0, 2, 0]}>
            <mesh geometry={nodes.Sphere.geometry} material={materials.palm_tree_bark} />
        </group>
    )
}


export const Scene = ({ storeColor, ...props }) => {
    const background = storeColor.get('background');
    const axis = storeColor.get('axis');
    const grid = storeColor.get('grid');

    const tree = useTreeStore(store => store.treeData);
    const setSelection = useStore(store => store.setSelection);

    return (
        <Canvas
            camera={{ position: [-5, 2, 10], fov: 60 }}
            shadows
            shadowMap
            colorManagement
            onPointerMissed={(e) => {
                if (e.button === 0) {
                    setSelection({});
                }
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
                <Environment background={false} near={1} far={1000} resolution={256} files={process.env.PUBLIC_URL + "/forest.hdr"} />
                {/* <Environment background={false} near={1} far={1000} resolution={256} preset="forest" /> */}
                <LevaStoreProvider store={storeColor}>
                    <color attach="background" args={[background]} />

                    <group>
                        <Ball />
                        <group position={[0, 3.5, 0]} rotation={[0, 0, Math.PI]}>
                            <ModuleTree root={tree} />
                        </group>
                        <gridHelper args={[100, 20, axis, grid]} position={[0, 0, 0]} />
                    </group>
                    <OrbitControls />
                </LevaStoreProvider>
            </Suspense>
        </Canvas >
    );
};

useGLTF.preload('/ball.gltf')
