import { useState, useMemo, useEffect, useRef } from "react";
import { useStoreContext } from "leva";
import { useFrame } from "@react-three/fiber";
import { Edges, useGLTF } from "@react-three/drei";
import * as THREE from "three";

import { useStore, useNodeStore } from "Storage";
import { lerp, lerpColor } from "utils";

import MODULE_R from "assets/moduleR.gltf";
import MODULE_T from "assets/moduleT.gltf";

const getGltfFileName = {
    "T": MODULE_T,
    "R": MODULE_R
};

const getMesh = {
    "T": ModuleT,
    "R": ModuleR
}

export function useAnimations(clips, getTarget) {
    const ref = useRef();
    const [mixer] = useState(() => new THREE.AnimationMixer());
    const lazyActions = useRef({});
    const [actions] = useState(() => {
        const actions = {};
        clips.forEach((clip) =>
            Object.defineProperty(actions, clip.name, {
                enumerable: true,
                get() {
                    return (
                        lazyActions.current[clip.name] ||
                        (lazyActions.current[clip.name] = mixer.clipAction(clip, ref.current))
                    );
                },
            })
        );
        return actions;
    })

    useEffect(() => {
        const currentRoot = ref.current;
        return () => {
            lazyActions.current = {};
            Object.values(actions).forEach((action) => {
                if (currentRoot) {
                    mixer.uncacheAction(action, currentRoot);
                }
            })
        }
    }, [clips]);

    useEffect(() => {
        Object.values(actions).forEach((action) => {
            action.play();
        });
    }, [actions]);

    useFrame(() => {
        const target = getTarget();

        if (Math.abs(mixer.time - target) > 0.001) {
            Object.values(actions).forEach((action) => {
                action.paused = false;
            });

            mixer.setTime(lerp(mixer.time, target, 0.1));

            Object.values(actions).forEach((action) => {
                action.paused = true;
            });
        }
    });

    return ref;
}


const useColor = (selected, baseColor, selectedColor) => {
    const ref = useRef();
    const color = useMemo(() => new THREE.Color(baseColor), [baseColor]);

    useFrame(() => {
        if (selected)
            color.setHex(selectedColor);
        else
            color.setHex(baseColor);

        ref.current.material.color.lerp(color, 0.1);
    });

    return ref;
};


function ModuleR(props) {
    const gltfFileName = getGltfFileName["R"];
    const { nodes, materials: _materials } = useGLTF(gltfFileName);

    const [jointMaterial, baseMaterial] = useMemo(() => {
        return [_materials.jointMaterial.clone(), _materials.baseMaterial.clone()];
    }, [_materials]);

    const ref = useColor(props.selected, props.baseColor, props.selectedColor);

    return (
        <>
            <mesh name="joint" geometry={nodes.joint.geometry} material={jointMaterial} scale={0.31} />
            <mesh ref={ref} name="Torus" geometry={nodes.Torus.geometry} material={baseMaterial} />
            <mesh name="u_head" geometry={nodes.u_head.geometry} material={baseMaterial}>
                {props.children}
            </mesh>
        </>
    );
};

function ModuleT(props) {
    const gltfFileName = getGltfFileName["T"];
    const { nodes, materials: _materials } = useGLTF(gltfFileName);

    const [jointMaterial, baseMaterial] = useMemo(() => {
        return [_materials.jointMaterial.clone(), _materials.baseMaterial.clone()];
    }, [_materials]);

    const ref = useColor(props.selected, props.baseColor, props.selectedColor);

    return (
        <>
            <mesh name="joint" geometry={nodes.joint.geometry} material={jointMaterial} scale={0.31} />
            <mesh ref={ref} name="Torus_bottom_001" geometry={nodes.Torus_bottom_001.geometry} material={baseMaterial} scale={0} />
            <mesh name="Torus_bottom_002" geometry={nodes.Torus_bottom_002.geometry} material={baseMaterial} scale={0} />
            <mesh name="Torus_bottom_003" geometry={nodes.Torus_bottom_003.geometry} material={baseMaterial} scale={0} />
            <mesh name="Torus_bottom_004" geometry={nodes.Torus_bottom_004.geometry} material={baseMaterial} scale={0} />
            <mesh name="Torus_1" geometry={nodes.Torus_1.geometry} material={baseMaterial} position={[0, 2.88, 0]} />
            <mesh name="Torus_2" geometry={nodes.Torus_2.geometry} material={baseMaterial} position={[0, 2.62, 0]} scale={[1.05, 1, 1.05]} />
            <mesh name="Torus_3" geometry={nodes.Torus_3.geometry} material={baseMaterial} position={[0, 2.36, 0]} scale={[1.15, 1, 1.15]} />
            <mesh name="Torus_4" geometry={nodes.Torus_4.geometry} material={baseMaterial} position={[0, 2.09, 0]} scale={[1.25, 1, 1.25]} />
            <mesh name="Torus_5" geometry={nodes.Torus_5.geometry} material={baseMaterial} position={[0, 1.83, 0]} scale={[1.15, 1, 1.15]} />
            <mesh name="Torus_6" geometry={nodes.Torus_6.geometry} material={baseMaterial} position={[0, 1.57, 0]} scale={[1.05, 1, 1.05]} />
            <mesh name="Torus_7" geometry={nodes.Torus_7.geometry} material={baseMaterial} position={[0, 1.31, 0]} />
            <mesh name="Torus_8" geometry={nodes.Torus_8.geometry} material={baseMaterial} position={[0, 1.05, 0]} scale={[1.05, 1, 1.05]} />
            <mesh name="Torus_9" geometry={nodes.Torus_9.geometry} material={baseMaterial} position={[0, 0.79, 0]} scale={[1.15, 1, 1.15]} />
            <mesh name="Torus_10" geometry={nodes.Torus_10.geometry} material={baseMaterial} position={[0, 0.52, 0]} scale={[1.25, 1, 1.25]} />
            <mesh name="Torus_11" geometry={nodes.Torus_11.geometry} material={baseMaterial} position={[0, 0.26, 0]} scale={[1.15, 1, 1.15]} />
            <mesh name="Torus_12" geometry={nodes.Torus_12.geometry} material={baseMaterial} scale={[1.05, 1, 1.05]} />
            <mesh name="u_head" geometry={nodes.u_head.geometry} material={baseMaterial}>
                {props.children}
            </mesh>
        </>
    );
};

function Module({ moduleType, face, id, ...props }) {
    const gltfFileName = getGltfFileName[moduleType];
    const { nodes, animations } = useGLTF(gltfFileName);
    const ref = useAnimations(animations, () =>
        useNodeStore.getState().nodeData[id].value * 0.99999
    );

    const [offset_pos_rot, normal_to_face] = useMemo(() => {
        const offset_pos_rot = {};
        const normal_to_face = {};
        for (const [key, val] of Object.entries(nodes)) {
            if (key.includes("f_")) {
                offset_pos_rot[key] = { position: val.position, rotation: val.rotation };
                normal_to_face[val.position.clone().normalize().toArray()] = key;
            }
        }
        return [offset_pos_rot, normal_to_face];
    }, [nodes]);

    const selection = useStore(state => state.selection);
    const setSelection = useStore(state => state.setSelection);

    const store = useStoreContext();
    const startColor = store.get(moduleType + "_start");
    const endColor = store.get(moduleType + "_end");
    const highlightColor = store.get(moduleType + "_highlight");

    const name = "Module_" + id;
    const offset = offset_pos_rot["f_" + face];

    const selected = selection?.object?.name === name;

    const [rnd] = useState(() => Math.random() * 0.8 + 0.2);
    const baseColor = useMemo(() => lerpColor(startColor, endColor, rnd),
        [startColor, endColor, rnd]
    );
    const selectedColor = useMemo(() => lerpColor(baseColor, highlightColor, 0.8),
        [baseColor, highlightColor]
    );

    // const updateNodeData = useTreeStore(state => state.updateNodeData);
    // const removeNodeData = useTreeStore(state => state.removeNodeData);
    //
    // useEffect(() => {
    //     if (selected) {
    //         const newNode = { id, value, moduleType };
    //         updateNodeData(newNode);
    //         console.log(useTreeStore.getState().nodeData);
    //     } else {
    //         removeNodeData(id);
    //         console.log(useTreeStore.getState().nodeData);
    //     }
    // }, [selected, id, value, moduleType, updateNodeData, removeNodeData]);

    const Mesh = useMemo(() => getMesh[moduleType], [moduleType]);

    return (
        <group
            ref={ref}
            name={name}
            moduleType={moduleType}
            face={face}
            position={offset.position}
            rotation={offset.rotation}

            onClick={(e) => {
                e.stopPropagation();
                if (!selected) {
                    setSelection({
                        object: ref.current,
                        face: normal_to_face[e.face.normal.toArray()]
                    });
                } else {
                    setSelection({});
                }
            }}
        >
            <Mesh selected={selected} baseColor={baseColor} selectedColor={selectedColor} {...props} />
        </group>
    );
}

export const ModuleTree = ({ node }) => {
    return (
        <Module moduleType={node.moduleType} face={node.face} id={node.id}>
            {node.children.map(child => (
                <ModuleTree key={child.id} node={child} />
            ))}
        </Module>
    );
}

useGLTF.preload(MODULE_T);
useGLTF.preload(MODULE_R);
