import { Suspense } from "react"
import { Canvas } from "@react-three/fiber";
import { softShadows, OrbitControls } from "@react-three/drei";
import { EffectComposer, Outline, Selection, Vignette } from "@react-three/postprocessing";

import { LevaStoreProvider } from "leva";

import { useStore, useTreeStore } from "./Storage";
import { ModuleTree } from "./Modules";

softShadows();


export const Scene = ({ storeColor, ...props }) => {
    const background = storeColor.get('background');
    const axis = storeColor.get('axix');
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
                <LevaStoreProvider store={storeColor}>
                    <color attach="background" args={[background]} />

                    <ambientLight intensity={0.8}
                    />
                    <pointLight position={[20, 20, 0]} intensity={1.3}
                    />
                    <directionalLight
                        position={[0, 20, 0]}
                        intensity={1.5}
                        castShadow
                        shadow-mapSize-width={1024}
                        shadow-mapSize-height={1024}
                        shadow-camera-far={50}
                        shadow-camera-left={-10}
                        shadow-camera-right={10}
                        shadow-camera-top={10}
                        shadow-camera-bottom={-10}
                    />

                    <group>
                        {/* <group position={[0, 0.5, 0]} rotation={[0, 0, Math.PI]}> */}
                        <group>
                            <ModuleTree root={tree} />
                        </group>
                        <gridHelper args={[100, 20, axis, grid]} position={[0, 0, 0]} />
                    </group>
                    <OrbitControls />
                </LevaStoreProvider>
            </Suspense>
        </Canvas>
    );
};

