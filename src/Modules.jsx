import React, { useRef, useState, useMemo } from "react";
import { useSpring, a } from "@react-spring/three";
import { useControls, useStoreContext } from "leva";

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


export const ModuleT = ({ moduleType, face, value, ...props }) => {
    const group = useRef();
    const geometry = useRef();
    
    const store = useStoreContext();

    const highlightColor = store.get(moduleType + '_Highlight');
    const startColor = store.get('start');
    const endColor = store.get('end');

    const [activated, setActivated] = useState(false);
    const [rnd] = useState(() => Math.random() * 0.8 + 0.2);
    const color = useMemo(() => {
        return activated ? getColor(highlightColor, rnd) : lerpColor(startColor, endColor, rnd)
    }, [activated, highlightColor, rnd, startColor, endColor]);

    const configs = useSpring({
        position: activated ? [0, 1.5, 0] : [0, 0.5, 0],
    });

    const offset = OFFSET_MODULE[face];

    return (
        <group
            name={'Module' + moduleType}
            moduleType={moduleType}
            face={face}
            value={value}
            position={offset.position}
            rotation={offset.rotation}
            // onClick={(e) => (setActivated(!activated))}
            onClick={(e) => (e.stopPropagation(), setActivated(!activated))}
            ref={group}>
            <mesh // Bottom
                castShadow
                receiveShadow>
                <boxBufferGeometry attach='geometry' />
                <meshStandardMaterial attach='material' color={color} />
            </mesh>
            <a.mesh // Middle
                // position={configs.position}
                position={[0, 0.5 + value, 0]}
                castShadow
                receiveShadow>
                <boxBufferGeometry ref={geometry} attach='geometry' args={[1, 2, 1]} />
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
        </group>
    );
};

export const ModuleR = ({ moduleType, face, value, ...props }) => {
    const group = useRef();
    const geometry = useRef();

    const store = useStoreContext();

    const highlightColor = store.get(moduleType + '_Highlight');
    const startColor = store.get('start');
    const endColor = store.get('end');

    const [activated, setActivated] = useState(false);
    const [rnd] = useState(() => Math.random() * 0.8 + 0.2);
    const color = useMemo(() => {
        return activated ? getColor(highlightColor, rnd) : lerpColor(startColor, endColor, rnd)
    }, [activated, highlightColor, rnd, startColor, endColor]);

    const configs = useSpring({
        rotation: activated ? [0, Math.PI / 2, 0] : [0, 0, 0]
    });

    const offset = OFFSET_MODULE[face];

    return (
        <group
            name={'Module' + moduleType}
            moduleType={moduleType}
            face={face}
            value={value}
            position={offset.position}
            rotation={offset.rotation}
            onClick={(e) => (e.stopPropagation(), setActivated(!activated))}
            // onClick={(e) => (setActivated(!activated))}
            ref={group}>
            <mesh // Bottom
                castShadow
                receiveShadow>
                <boxBufferGeometry attach='geometry' />
                <meshStandardMaterial attach='material' color={color} />
            </mesh>
            <a.mesh // Middle
                position={[0, 1, 0]}
                // rotation={configs.rotation}
                rotation={[0, 2 * Math.PI * value, 0]}
                castShadow
                receiveShadow>
                <boxBufferGeometry ref={geometry} attach='geometry' args={[1, 1, 1]} />
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
        </group>
    );
};

export const Module = ( props ) => {
    if (props.moduleType === 'T') {
        return <ModuleT {...props} />;
    } else {
        return <ModuleR {...props} />;
    }
}

export const ModuleTree = ({ root, ...props }) => {
    return (
        <Module moduleType={root.moduleType} face={root.face} value={root.value} {...props} >
        {root.children.map(child => (
            <ModuleTree root={child} key={child.id} {...props}/>
        ))}
        </Module>
    );
}

