import React, { useRef, useState, useMemo } from "react";
import { useSpring, a } from "@react-spring/three";
import { useStoreContext } from "leva";
import { Edges } from "@react-three/drei";

import { useStore } from "./Storage";
import { hexToHSL } from "./utils"

const OFFSET_MODULE = [{
    position: [0, 1, 0],
    rotation: [0, 0, 0],
}, {
    position: [0, 0, 1],
    rotation: [Math.PI / 2, 0, 0],
}, {
    position: [1, 0, 0],
    rotation: [0, 0, -Math.PI / 2],
}, {
    position: [0, 0, -1],
    rotation: [-Math.PI / 2, 0, 0],
}, {
    position: [-1, 0, 0],
    rotation: [0, 0, Math.PI / 2],
}];

export const NORMAL_TO_FACE = {
    [[0, 1, 0]]: 0,
    [[0, 0, 1]]: 1,
    [[1, 0, 0]]: 2,
    [[0, 0, -1]]: 3,
    [[-1, 0, 0]]: 4,
};


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

const ModuleT = ({ value, color, ...props }) => {
    const configs = useSpring({
        position: [0, 0.5 + value, 0]
    });

    return (
        <>
            <mesh // Bottom
                castShadow
                receiveShadow>
                <boxBufferGeometry attach='geometry' />
                <meshStandardMaterial attach='material' color={color} />
            </mesh>
            <a.mesh // Middle
                position={configs.position}
                castShadow
                receiveShadow>
                <boxBufferGeometry attach='geometry' args={[1, 2, 1]} />
                <meshStandardMaterial attach='material' color={color} />
                <mesh // Top
                    position={[0, 1.5, 0]}
                    castShadow
                    receiveShadow>
                    <boxBufferGeometry attach='geometry' />
                    <meshStandardMaterial attach='material' color={color} />
                    {props.children}
                </mesh>
            </a.mesh>
        </>
    );
}

const ModuleR = ({ value, color, ...props }) => {
    const configs = useSpring({
        rotation: [0, 2 * Math.PI * value, 0]
    });

    return (
        <>
            <mesh // Bottom
                castShadow
                receiveShadow>
                <boxBufferGeometry attach='geometry' />
                <meshStandardMaterial attach='material' color={color} />
            </mesh>
            <a.mesh // Middle
                position={[0, 1, 0]}
                rotation={configs.rotation}
                castShadow
                receiveShadow>
                <boxBufferGeometry attach='geometry' args={[1, 1, 1]} />
                <meshStandardMaterial attach='material' color={color} />
                <mesh // Top
                    position={[0, 1, 0]}
                    castShadow
                    receiveShadow>
                    <boxBufferGeometry attach='geometry' />
                    <meshStandardMaterial attach='material' color={color} />
                    {props.children}
                </mesh>
            </a.mesh>
        </>
    );
}

export const Module = ({ moduleType, face, value, id, ...props }) => {
    const group = useRef();

    const store = useStoreContext();

    const setSelection = useStore(state => state.setSelection);

    const startColor = store.get(moduleType + '_start');
    const endColor = store.get(moduleType + '_end');
    const highlightColor = store.get(moduleType + '_highlight');

    const [activated, setActivated] = useState(false);
    const [rnd] = useState(() => Math.random() * 0.8 + 0.2);
    const color = useMemo(() => activated ? getColor(highlightColor, rnd) : lerpColor(startColor, endColor, rnd), [activated, rnd, startColor, endColor, highlightColor]);

    const name = 'Module_' + id;
    const offset = OFFSET_MODULE[face];

    let mesh;
    if (moduleType === 'T') {
        mesh = <ModuleT value={value} color={color} {...props} />;
    } else {
        mesh = <ModuleR value={value} color={color} {...props} />;
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
                setActivated(!activated);
                setSelection({
                    object: closestParent(e.object),
                    face: NORMAL_TO_FACE[e.face.normal.toArray()]
                })
            }}
            ref={group}>
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

