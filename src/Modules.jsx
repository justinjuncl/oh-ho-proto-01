import React, { useRef, useState, useMemo, useEffect } from "react";
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

function ModuleT({ face, value, color, setActivated, ...props }) {
    const group = useRef();
    const { nodes, materials, animations } = useGLTF(process.env.PUBLIC_URL + '/basicT.gltf');
    const { actions, mixer } = useAnimations(animations, group);

    const setSelection = useStore(state => state.setSelection);

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

    const offset = offset_pos_rot['f_' + face];

    return (
        <group ref={group} dispose={null} position={offset.position} rotation={offset.rotation}
            onClick={(e) => {
                e.stopPropagation();
                setActivated((activated) => !activated);
                setSelection({
                    object: closestParent(e.object),
                    face: normal_to_face[e.face.normal.toArray()]
                })
            }}
        >
            <mesh name="u_base" geometry={nodes.u_base.geometry} material={materials.Material} position={[0, 0.5, 0]} />
            <mesh name="u_pillar" geometry={nodes.u_pillar.geometry} material={materials.Material} position={[0, 1.5, 0]} />
            <mesh name="u_head" geometry={nodes.u_head.geometry} material={materials.Material} position={[0, 2.5, 0]}>
                <group name="f_0" position={[0, 0.5, 0]} />
                <group name="f_1" position={[0.5, 0, 0]} rotation={[Math.PI, 0, -Math.PI / 2]} />
                <group name="f_2" position={[0, 0, -0.5]} rotation={[-Math.PI / 2, -Math.PI / 2, 0]} />
                <group name="f_3" position={[-0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
                <group name="f_4" position={[0, 0, 0.5]} rotation={[Math.PI / 2, Math.PI / 2, 0]} />
                {props.children}
            </mesh>
        </group>
    );
}

function ModuleR({ face, value, color, setActivated, ...props }) {
    const group = useRef();
    const { nodes, materials, animations } = useGLTF(process.env.PUBLIC_URL + '/basicR.gltf');
    const { actions, mixer } = useAnimations(animations, group);

    const setSelection = useStore(state => state.setSelection);

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

    const offset = offset_pos_rot['f_' + face];

    return (
        <group ref={group} dispose={null} position={offset.position} rotation={offset.rotation}
            onClick={(e) => {
                e.stopPropagation();
                setActivated((activated) => !activated);
                setSelection({
                    object: closestParent(e.object),
                    face: normal_to_face[e.face.normal.toArray()]
                })
            }}
        >
            <mesh name="u_base" geometry={nodes.u_base.geometry} material={materials.Material} position={[0, 0.5, 0]} />
            <mesh name="u_pillar" geometry={nodes.u_pillar.geometry} material={materials.Material} position={[0, 1.5, 0]} />
            <mesh name="u_head" geometry={nodes.u_head.geometry} material={materials.Material} position={[0, 2.5, 0]}>
                <group name="f_0" position={[0, 0.5, 0]} />
                <group name="f_1" position={[0.5, 0, 0]} rotation={[Math.PI, 0, -Math.PI / 2]} />
                <group name="f_2" position={[0, 0, -0.5]} rotation={[-Math.PI / 2, -Math.PI / 2, 0]} />
                <group name="f_3" position={[-0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
                <group name="f_4" position={[0, 0, 0.5]} rotation={[Math.PI / 2, Math.PI / 2, 0]} />
                {props.children}
            </mesh>
        </group>
    );
}

export const Module = ({ moduleType, face, value, id, ...props }) => {
    const store = useStoreContext();

    const startColor = store.get(moduleType + '_start');
    const endColor = store.get(moduleType + '_end');
    const highlightColor = store.get(moduleType + '_highlight');

    const [activated, setActivated] = useState(false);
    const [rnd] = useState(() => Math.random() * 0.8 + 0.2);
    const color = useMemo(() => activated ? getColor(highlightColor, rnd) : lerpColor(startColor, endColor, rnd), [activated, rnd, startColor, endColor, highlightColor]);

    const name = 'Module_' + id;

    let mesh;
    if (moduleType === 'T') {
        mesh = <ModuleT face={face} value={value} color={color} setActivated={setActivated} {...props} />;
    } else {
        mesh = <ModuleR face={face} value={value} color={color} setActivated={setActivated} {...props} />;
    }

    return (
        <group
            name={name}
            moduleType={moduleType}
            face={face}
            value={value}
        >
            {mesh}
        </group>
    );
}

export const ModuleTree = ({ root, ...props }) => {
    return (
        <Module moduleType={root.moduleType} face={root.face} value={root.value} id={root.id} {...props} >
            {root.children.map(child => (
                <ModuleTree root={child} key={child.id} {...props} />
            ))}
        </Module>
    );
}

useGLTF.preload(process.env.PUBLIC_URL + '/basicR.gltf');
useGLTF.preload(process.env.PUBLIC_URL + '/basicT.gltf');
