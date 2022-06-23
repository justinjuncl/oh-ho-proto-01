import * as THREE from "three";
import React, { useState, useMemo, useEffect } from "react";
import { useStoreContext } from "leva";
import { Edges, useGLTF, useAnimations } from "@react-three/drei";

import { useStore } from "./Storage";
import { lerpColor, getColor } from "./utils"


const closestParent = (group) => {
    let g = group.parent;
    while (g && g.moduleType === undefined) {
        g = g.parent;
    }
    return g;
};

const GLTF_MODEL = 'smooth';

const getGltfFileName = (moduleType) => {
    moduleType = 'T';
    return process.env.PUBLIC_URL + `/${GLTF_MODEL}${moduleType}.gltf`;
}


const ModuleR = ({ moduleType, ...props }) => {
    const gltfFileName = getGltfFileName(moduleType);
    const { nodes, materials } = useGLTF(gltfFileName);

    const material = useMemo(() => {
        return materials.Material.clone();
    }, [materials]);

    return (
        <>
            {/* <mesh name="u_base" geometry={nodes.u_base.geometry} material={material} material-wireframe={true} position={[0, 0.5, 0]} /> */}
            <mesh name="u_base" geometry={nodes.u_base.geometry} material={material} material-wireframe={false} material-color={props.color} position={[0, 0.5, 0]} />
            <mesh name="u_pillar" geometry={nodes.u_pillar.geometry} material={material} position={[0, 1.5, 0]} />
            <mesh name="u_head" geometry={nodes.u_head.geometry} material={material} position={[0, 2.5, 0]}>
                {props.children}
            </mesh>
        </>
    );
};

const ModuleT_ = ({ moduleType, ...props }) => {
    const gltfFileName = getGltfFileName(moduleType);
    const { nodes, materials } = useGLTF(gltfFileName);

    const material = useMemo(() => {
        return materials.Material.clone();
    }, [materials]);

    return (
        <>
            {/* <mesh name="u_base" geometry={nodes.u_base.geometry} material={material} material-wireframe={true} position={[0, 0.5, 0]} /> */}
            <mesh name="u_base" geometry={nodes.u_base.geometry} material={material} material-wireframe={false} material-color={props.color} position={[0, 0.5, 0]} />
            <mesh name="u_pillar" geometry={nodes.u_pillar.geometry} material={material} position={[0, 1.5, 0]} />
            <mesh name="u_head" geometry={nodes.u_head.geometry} material={material} position={[0, 2.5, 0]}>
                {props.children}
            </mesh>
        </>
    );
};

const ModuleT = ({ moduleType, ...props }) => {
    const gltfFileName = getGltfFileName(moduleType);
    const { nodes } = useGLTF(gltfFileName);

    const material = useMemo(() => {
        return nodes.Torus.material.clone();
    }, [nodes.Torus.material]);

    return (
        <>
            <mesh name="Torus" geometry={nodes.Torus.geometry} material={material} material-color={props.color} castShadow receiveShadow />
            <mesh name="Torus_bottom_001" geometry={nodes.Torus_bottom_001.geometry} material={material} scale={0} castShadow receiveShadow />
            <mesh name="Torus_bottom_002" geometry={nodes.Torus_bottom_002.geometry} material={material} scale={0} castShadow receiveShadow />
            <mesh name="Torus_bottom_003" geometry={nodes.Torus_bottom_003.geometry} material={material} scale={0} castShadow receiveShadow />
            <mesh name="Torus_bottom_004" geometry={nodes.Torus_bottom_004.geometry} material={material} scale={0} castShadow receiveShadow />
            <mesh name="u_base" geometry={nodes.u_base.geometry} material={material} castShadow receiveShadow />
            <mesh name="u_head" geometry={nodes.u_head.geometry} material={material} castShadow receiveShadow>
                {props.children}
            </mesh>
        </>
    );
};

export const Module = ({ face, value, id, ...props }) => {
    const moduleType = props.moduleType;
    const gltfFileName = getGltfFileName(moduleType);

    const { nodes, animations } = useGLTF(gltfFileName);
    const { ref, actions, mixer } = useAnimations(animations);

    useEffect(() => {
        for (const name of Object.keys(actions)) {
            actions[name].play();
        }

    }, [actions]);

    useEffect(() => {
        for (const name of Object.keys(actions)) {
            actions[name].paused = false;
        }

        mixer.setTime(value * 0.99999);

        for (const name of Object.keys(actions)) {
            actions[name].paused = true;
        }
    }, [value, actions, mixer]);

    const [offset_pos_rot, normal_to_face] = useMemo(() => {
        let off = {};
        let nor = {};
        for (const [key, val] of Object.entries(nodes)) {
            if (key.includes('f_')) {
                off[key] = { position: val.position, rotation: val.rotation };
                nor[val.position.clone().normalize().toArray()] = key;
            }
        }
        return [off, nor];
    }, [nodes]);

    const selection = useStore(store => store.selection);
    const setSelection = useStore(store => store.setSelection);

    const store = useStoreContext();
    const startColor = store.get(moduleType + '_start');
    const endColor = store.get(moduleType + '_end');
    const highlightColor = store.get(moduleType + '_highlight');

    const name = 'Module_' + id;
    const offset = offset_pos_rot['f_' + face];

    const activated = selection?.object?.name === name;
    const [rnd] = useState(() => Math.random() * 0.8 + 0.2);
    const color = useMemo(() => activated ? getColor(highlightColor, rnd) : lerpColor(startColor, endColor, rnd), [activated, rnd, startColor, endColor, highlightColor]);

    const mesh = useMemo(() => {
        if (moduleType === 'T') {
            return <ModuleT color={color} {...props} />;
        } else {
            return <ModuleT color={color} {...props} />;
        }
    }, [moduleType, color, props]);

    return (
        <group
            ref={ref}
            name={name}
            moduleType={moduleType}
            face={face}
            value={value}
            position={offset.position}
            rotation={offset.rotation}

            onClick={(e) => {
                e.stopPropagation();
                if (!activated) {
                    setSelection({
                        object: closestParent(e.object),
                        face: normal_to_face[e.face.normal.toArray()]
                    });
                } else {
                    setSelection({});
                }
            }}
        >
            {mesh}
        </group>
    );
}

export const ModuleTree = ({ root }) => {
    return (
        <Module moduleType={root.moduleType} face={root.face} value={root.value} id={root.id}>
            {root.children.map(child => (
                <ModuleTree key={child.id} root={child} />
            ))}
        </Module>
    );
}

useGLTF.preload(process.env.PUBLIC_URL + '/basicR.gltf');
useGLTF.preload(process.env.PUBLIC_URL + '/basicT.gltf');

useGLTF.preload(process.env.PUBLIC_URL + '/smoothT.gltf');
useGLTF.preload(process.env.PUBLIC_URL + '/smoothR.gltf');
