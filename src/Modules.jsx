import { useState, useMemo, useCallback, useEffect, useRef, memo } from "react";
import { invalidate, useFrame } from "@react-three/fiber";
import { Edges, useGLTF } from "@react-three/drei";
import * as THREE from "three";

import { useStore, useNodeStore, useColorStore } from "Storage";
import { lerp, lerpColor, colorDist } from "utils";

import MODULE_K from "assets/moduleK.gltf";
import MODULE_R from "assets/moduleR.gltf";
import MODULE_T from "assets/moduleT.gltf";

const getGltfFileName = {
    "K": MODULE_K,
    "R": MODULE_R,
    "T": MODULE_T,
};

const getMesh = {
    "K": MeshK,
    "R": MeshR,
    "T": MeshT,
}

const getModule = {
    "K": ModuleK,
    "R": BaseModule,
    "T": BaseModule,
}

function useOffsetFromParent(parentModuleType, face) {
    const parentGltfFileName = getGltfFileName[parentModuleType];
    const { nodes: parentNodes } = useGLTF(parentGltfFileName);

    const offset = useMemo(() => {
        const offsetObject = parentNodes[`f_${face}`];
        return {
            position: offsetObject.position,
            rotation: offsetObject.rotation
        };
    }, [parentNodes, face]);

    return offset;
}

function useAnimations(moduleType, id, getTarget) {
    const gltfFileName = getGltfFileName[moduleType];
    const { animations: clips } = useGLTF(gltfFileName);

    const ref = useRef();
    const [mixer] = useState(() => new THREE.AnimationMixer());
    const actions = useMemo(() => {
        const actions = {};
        clips.forEach((clip) => {
            Object.defineProperty(actions, clip.name, {
                enumerable: true,
                get() {
                    if (ref.current) {
                        return (
                            mixer.clipAction(clip, ref.current)
                        );
                    }
                },
            })
        });
        return actions;
    }, [clips, mixer]);

    useEffect(() => {
        Object.values(actions).forEach((action) => {
            action.play();
        });
        const target = getTarget();

        mixer.setTime(lerp(mixer.time, target, 0.1));

        const currentRoot = ref.current;
        return () => mixer.uncacheRoot(currentRoot);
    }, [actions, getTarget, mixer]);

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

            invalidate();
        }
    });

    return ref;
}

function useColor(moduleType) {
    const color = useColorStore(state => state.color);
    const startColor = color[moduleType + "_start"];
    const endColor = color[moduleType + "_end"];
    const highlightColor = color[moduleType + "_highlight"];

    const rnd = useMemo(() => Math.random() * 0.8 + 0.2, []);
    const baseColor = useMemo(() =>
        lerpColor(startColor, endColor, rnd),
        [startColor, endColor, rnd]
    );
    const selectedColor = useMemo(() =>
        lerpColor(baseColor, highlightColor, 0.8),
        [baseColor, highlightColor]
    );

    return [baseColor, selectedColor];
}

function useAnimatedMaterialColor(moduleType, getIsSelected) {
    const ref = useRef();
    const [baseColor, selectedColor] = useColor(moduleType);
    const color = useMemo(() => new THREE.Color(baseColor), [baseColor]);

    useFrame(() => {
        const isSelected = getIsSelected();
        if (isSelected)
            color.setHex(selectedColor);
        else
            color.setHex(baseColor);

        if (colorDist(ref.current.material.color, color) > 10) {
            ref.current.material.color.lerp(color, 0.1);

            invalidate();
        }
    });

    invalidate();

    return ref;
}

function useOnGroupClick(ref) {
    const setSelection = useStore(state => state.setSelection);
    const onClick = useCallback(
        (e) => {
            e.stopPropagation();
            const isSelected = useStore.getState().selection?.object?.name === ref.current.name;
            if (!isSelected) {
                setSelection({
                    object: ref.current,
                });
            } else {
                setSelection({});
            }
            invalidate();
        },
        [setSelection, ref]
    );

    return onClick;
}

function MeshK(props) {
    const gltfFileName = getGltfFileName["K"];
    const { nodes, materials } = useGLTF(gltfFileName);

    return (
        <>
            <mesh geometry={nodes.joint_K.geometry} material={materials.jointMaterial}>
                {props.children}
            </mesh>
        </>
    );
}

function MeshR(props) {
    const gltfFileName = getGltfFileName["R"];
    const { nodes, materials: _materials } = useGLTF(gltfFileName);

    const [jointMaterial, baseMaterial] = useMemo(() => {
        return [_materials.jointMaterial.clone(), _materials.baseMaterial.clone()];
    }, [_materials]);

    const ref = useAnimatedMaterialColor(props.moduleType, () =>
        useStore.getState().selection?.object?.name === props.name
    );

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

function MeshT(props) {
    const gltfFileName = getGltfFileName["T"];
    const { nodes, materials: _materials } = useGLTF(gltfFileName);

    const [jointMaterial, baseMaterial] = useMemo(() => {
        return [_materials.jointMaterial.clone(), _materials.baseMaterial.clone()];
    }, [_materials]);

    const ref = useAnimatedMaterialColor(props.moduleType, () =>
        useStore.getState().selection?.object?.name === props.name
    );

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
}

function ModuleK({ moduleType, face, id, parentModuleType, ...props }) {
    const groupRef = useRef();

    const name = "Module_" + id;
    const offset = useOffsetFromParent(parentModuleType, face);
    const onClick = useOnGroupClick(groupRef);

    const Mesh = useMemo(() => getMesh[moduleType], [moduleType]);

    return (
        <group
            ref={groupRef}
            name={name}
            moduleType={moduleType}
            position={offset.position}
            rotation={offset.rotation}
            onClick={onClick}
        >
            <Mesh name={name} {...props} />
        </group>
    );
}

function BaseModule({ moduleType, face, id, parentModuleType, ...props }) {
    const groupRef = useAnimations(moduleType, id, () =>
        useNodeStore.getState().nodes[id].value * 0.99999
    );

    const name = "Module_" + id;
    const offset = useOffsetFromParent(parentModuleType, face);
    const onClick = useOnGroupClick(groupRef);

    const Mesh = useMemo(() => getMesh[moduleType], [moduleType]);

    return (
        <group
            ref={groupRef}
            name={name}
            moduleType={moduleType}
            position={offset.position}
            rotation={offset.rotation}
            onClick={onClick}
        >
            <Mesh name={name} moduleType={moduleType} {...props} />
        </group>
    );
}

export const ModuleTree = memo(({ node: { moduleType, face, id, children }, parentModuleType = "T" }) => {
    const Module = useMemo(() => getModule[moduleType], [moduleType]);

    return (
        <Module moduleType={moduleType} face={face} id={id} parentModuleType={parentModuleType}>
            {children.map(child => (
                <ModuleTree key={child.id} node={child} parentModuleType={moduleType} />
            ))}
        </Module>
    );
}, areEqual);

function _nodeEqual(nodeA, nodeB) {
    if (nodeA.id !== nodeB.id) return false;
    if (nodeA.face !== nodeB.face) return false;
    if (nodeA.moduleType !== nodeB.moduleType) return false;
    if (nodeA.children.length !== nodeB.children.length) return false;

    for (var i = 0; i < nodeA.children.length; ++i) {
        if (!_nodeEqual(nodeA.children[i], nodeB.children[i]))
            return false;
    }

    return true;
}

function areEqual(prevProps, nextProps) {
    return _nodeEqual(prevProps.node, nextProps.node);
}



useGLTF.preload(MODULE_K);
useGLTF.preload(MODULE_R);
useGLTF.preload(MODULE_T);
