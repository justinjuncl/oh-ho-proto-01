import React, { useState, useMemo, useEffect } from "react";
import { useStoreContext } from "leva";
import { Edges, useGLTF, useAnimations } from "@react-three/drei";

import { useStore } from "Storage";
import { lerpColor, getColor } from "utils"

import MODULE_R from "assets/moduleR.gltf";
import MODULE_T from "assets/moduleT.gltf";


const closestParent = (group) => {
    let g = group.parent;
    while (g && g.moduleType === undefined) {
        g = g.parent;
    }
    return g;
};

const getGltfFileName = (moduleType) => {
    if (moduleType === 'T') {
        return MODULE_T;
    }
    return MODULE_R;
}

const ModuleR = ({ moduleType, ...props }) => {
    const gltfFileName = getGltfFileName(moduleType);
    const { nodes, materials: _materials } = useGLTF(gltfFileName);

    const [jointMaterial, baseMaterial] = useMemo(() => {
        return [_materials.Material.clone(), _materials.YG.clone()];
    }, [_materials]);

    return (
        <>
            <mesh name="joint" geometry={nodes.joint.geometry} material={jointMaterial} scale={0.31} />
            <mesh name="Torus" geometry={nodes.Torus.geometry} material={baseMaterial} material-color={props.color} />
            <mesh name="u_head" geometry={nodes.u_head.geometry} material={baseMaterial}>
                {props.children}
            </mesh>
        </>
    );
};

const ModuleT = ({ moduleType, ...props }) => {
    const gltfFileName = getGltfFileName(moduleType);
    const { nodes, materials: _materials } = useGLTF(gltfFileName);

    const [jointMaterial, baseMaterial] = useMemo(() => {
        return [_materials.Material.clone(), _materials.YG.clone()];
    }, [_materials]);

    return (
        <>
            <mesh name="joint" geometry={nodes.joint.geometry} material={jointMaterial} scale={0.31} />
            <mesh name="Torus" geometry={nodes.Torus.geometry} material={baseMaterial} material-color={props.color} />
            <mesh name="Torus_bottom_001" geometry={nodes.Torus_bottom_001.geometry} material={baseMaterial} rotation={[-Math.PI, 0, -Math.PI]} scale={0} />
            <mesh name="Torus_bottom_002" geometry={nodes.Torus_bottom_002.geometry} material={baseMaterial} rotation={[-Math.PI, 0, -Math.PI]} scale={0} />
            <mesh name="Torus_bottom_003" geometry={nodes.Torus_bottom_003.geometry} material={baseMaterial} rotation={[-Math.PI, 0, -Math.PI]} scale={0} />
            <mesh name="Torus_bottom_004" geometry={nodes.Torus_bottom_004.geometry} material={baseMaterial} rotation={[-Math.PI, 0, -Math.PI]} scale={0} />
            <mesh name="u_head" geometry={nodes.u_head.geometry} material={baseMaterial}>
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
            return <ModuleR color={color} {...props} />;
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

useGLTF.preload(MODULE_T);
useGLTF.preload(MODULE_R);
