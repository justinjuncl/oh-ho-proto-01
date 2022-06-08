import React, { useRef, useState, useMemo, useEffect, forwardRef } from "react";
import { useStoreContext } from "leva";
import { Edges, useGLTF, useAnimations } from "@react-three/drei";

import { useStore } from "./Storage";
import { hexToHSL } from "./utils"

const closestParent = (group) => {
    let g = group.parent;
    while (g && g.type !== "Group") {
        g = g.parent;
    }
    return g;
};

const traverse = (scene) => {
    const table = [];
    scene.traverse(c => {
        if (c.name.includes('Module')) {
            table.push({ id: c.id, parent_id: closestParent(c).id, face: c.face, moduleType: c.moduleType, value: c.value, children: [] });
        }
    });

    let node_map = {}, roots = [], node;

    for (let i = 0; i < table.length; i++) {
        node = table[i];
        node_map[node.id] = i;

        if (i === 0) {
            roots.push(node);
        } else {
            table[node_map[node.parent_id]].children.push(node);
        }

        delete node.parent_id;
    }

    let treeData = JSON.stringify(roots[0], null, 2);

    return treeData;
};

const getGltfFileName = (moduleType) => {
    return process.env.PUBLIC_URL + `/basic${moduleType}.gltf`;
}

const getColor = (color, val) => {
    const [hue] = hexToHSL(color);
    return "hsl(" + hue + ", " + Math.floor(100 * val) + "%, 50%)";
}

const lerpColor = (start, end, amount) => {
    const a = parseInt(start.replace(/^#/, ''), 16),
        b = parseInt(end.replace(/^#/, ''), 16),

        ar = (a & 0xFF0000) >> 16,
        ag = (a & 0x00FF00) >> 8,
        ab = (a & 0x0000FF),

        br = (b & 0xFF0000) >> 16,
        bg = (b & 0x00FF00) >> 8,
        bb = (b & 0x0000FF),

        rr = ar + amount * (br - ar),
        rg = ag + amount * (bg - ag),
        rb = ab + amount * (bb - ab);

    return (rr << 16) + (rg << 8) + (rb | 0);
}

const ModuleR = forwardRef(({ moduleType, ...props }, group) => {
    const gltfFileName = getGltfFileName(moduleType);
    const { nodes, materials } = useGLTF(gltfFileName);

    return (
        <group ref={group}>
            <mesh name="u_base" geometry={nodes.u_base.geometry} material={materials.Material} position={[0, 0.5, 0]} />
            <mesh name="u_pillar" geometry={nodes.u_pillar.geometry} material={materials.Material} position={[0, 1.5, 0]} />
            <mesh name="u_head" geometry={nodes.u_head.geometry} material={materials.Material} position={[0, 2.5, 0]}>
                {props.children}
            </mesh>
        </group>
    );
});

const ModuleT = forwardRef(({ moduleType, ...props }, group) => {
    const gltfFileName = getGltfFileName(moduleType);
    const { nodes, materials } = useGLTF(gltfFileName);

    return (
        <group ref={group}>
            <mesh name="u_base" geometry={nodes.u_base.geometry} material={materials.Material} position={[0, 0.5, 0]} />
            <mesh name="u_pillar" geometry={nodes.u_pillar.geometry} material={materials.Material} position={[0, 1.5, 0]} />
            <mesh name="u_head" geometry={nodes.u_head.geometry} material={materials.Material} position={[0, 2.5, 0]}>
                {props.children}
            </mesh>
        </group>
    );
});

export const Module = ({ face, value, id, ...props }) => {
    const group = useRef();

    const moduleType = props.moduleType;
    const gltfFileName = getGltfFileName(moduleType);

    const { nodes, animations } = useGLTF(gltfFileName);
    const { actions, mixer } = useAnimations(animations, group);

    useEffect(() => {
        for (const name of Object.keys(actions)) {
            actions[name].play();
        }
    }, [actions]);

    useEffect(() => {
        for (const name of Object.keys(actions)) {
            actions[name].paused = false;
        }
        mixer.setTime(value);
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

    const setSelection = useStore(state => state.setSelection);
    const store = useStoreContext();
    const startColor = store.get(moduleType + '_start');
    const endColor = store.get(moduleType + '_end');
    const highlightColor = store.get(moduleType + '_highlight');

    const [activated, setActivated] = useState(false);
    const [rnd] = useState(() => Math.random() * 0.8 + 0.2);
    const color = useMemo(() => activated ? getColor(highlightColor, rnd) : lerpColor(startColor, endColor, rnd), [activated, rnd, startColor, endColor, highlightColor]);

    const offset = offset_pos_rot['f_' + face];
    const name = 'Module_' + id;

    let mesh;
    if (moduleType === 'T') {
        mesh = <ModuleT ref={group} {...props} />;
    } else {
        mesh = <ModuleR ref={group} {...props} />;
    }

    return (
        <group
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
                setActivated((activated) => !activated);
            }}
            onPointerMissed={(e) => {
                if (e.button === 0) {
                    setActivated((activated) => false);
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
