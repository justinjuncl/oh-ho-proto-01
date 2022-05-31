import { useCallback } from "react"
import ReactFlow, { Controls, ReactFlowProvider, useReactFlow } from 'react-flow-renderer';

import dagre from 'dagre';
import { wait } from "@testing-library/user-event/dist/utils";

let nodeId = 0;

function NodeEditor_({ nodes, edges, onNodesChange, onEdgesChange, onConnect, setTreeData, tree, ...props }) {
    const reactFlowStyle = {
        background: 'white'
    };
    const divStyle = {
        width: 400,
        height: 400,
        zIndex: 900,
        bottom: 0,
        right: 0,
        position: 'absolute'
    };
    const buttonStyle = {
        position: 'absolute',
        zIndex: 10,
        top: 10,
        left: 10
    }

    const reactFlowInstance = useReactFlow();

    const onClick = useCallback(() => {
        const id = `${++nodeId}`;
        const newNode = {
            id,
            position: {
                x: Math.random() * 500,
                y: Math.random() * 500,
            },
            data: {
                label: `Node ${id}`,
            },
        };
        reactFlowInstance.addNodes(newNode);

        const copy_tree = { ...tree };
        copy_tree.children[0].id = 15;
        copy_tree.children[0].value = Math.random();
        setTreeData(copy_tree);

    }, [reactFlowInstance, setTreeData, tree]);

    return (
        <div style={divStyle}>
            <ReactFlow
                style={reactFlowStyle}
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                proOptions={{
                    account: 'paid-pro',
                    hideAttribution: true
                }}
            >
                <Controls />
            </ReactFlow>
            <button onClick={onClick} style={buttonStyle}>
                add node
            </button>
        </div>
    );
}

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 36;

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = isHorizontal ? 'left' : 'top';
        node.sourcePosition = isHorizontal ? 'right' : 'bottom';

        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };

        return node;
    });

    return [nodes, edges];
};

export function NodeEditor({ tree, setTreeData, ...props }) {
    let nodes = [];
    let edges = [];

    const dfs = (node) => {
        nodes.push({
            id: `${node.id}`,
            data: {
                label: `Module_${node.id}`,
                value: node.value,
                moduleType: node.moduleType
            },
            position: { x: 0, y: 0 },
        });

        for (const child of node.children) {
            edges.push({
                id: `E_${node.id}-${child.id}`,
                source: `${node.id}`,
                target: `${child.id}`,
            });

            dfs(child);
        }
    };

    dfs(tree);

    [nodes, edges] = getLayoutedElements(nodes, edges);

    return (
        <ReactFlowProvider>
            <NodeEditor_ nodes={nodes} edges={edges} tree={tree} setTreeData={(tree) => { setTreeData(tree) }} props={props} />
        </ReactFlowProvider>
    );
}
