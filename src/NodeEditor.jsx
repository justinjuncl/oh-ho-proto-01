import { useCallback, useMemo, useRef } from "react"
import ReactFlow, { Handle, Position, Controls, ReactFlowProvider, useReactFlow } from 'react-flow-renderer';
import dagre from 'dagre';

const nodeWidth = 122;
const nodeHeight = 76;

let nodeId = 30;
const getId = () => `${nodeId++}`;

function BaseModuleNode({ data }) {
    const name = data.moduleType + data.label.replace("Module_", "");
    return (
        <div className="module-node-wrapper">
            <div className="module-node">
                <Handle type="target" position={Position.Top} id="target_face" />
                <Handle type="target" position={Position.Left} id="target_value" />
                <div className="module-node-inner">
                    <h1>{name}</h1>
                    <label className="label-face">face</label>
                    <div className="values">
                        <label className="label-value-text">value</label>
                        <label className="label-value">{data.value.toFixed(2)}</label>
                    </div>
                    <label>face</label>
                </div>
                <div className="handles">
                    <Handle type="source" position={Position.Bottom} id="source_0" />
                    <Handle type="source" position={Position.Bottom} id="source_1" />
                    <Handle type="source" position={Position.Bottom} id="source_2" />
                    <Handle type="source" position={Position.Bottom} id="source_3" />
                    <Handle type="source" position={Position.Bottom} id="source_4" />
                </div>
            </div>
        </div>
    );
}

function TModuleNode({ data }) { return <BaseModuleNode data={data} /> }
function RModuleNode({ data }) { return <BaseModuleNode data={data} /> }

function ModulesList() {
    const onDragStart = (event, nodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="modules-list">
            <div className="modules-list-item" onDragStart={(event) => onDragStart(event, 'T')} draggable>
                T Module
            </div>
            <div className="modules-list-item" onDragStart={(event) => onDragStart(event, 'R')} draggable>
                R Module
            </div>
        </div>
    );
}

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

    const nodeTypes = useMemo(() => ({
        T: TModuleNode,
        R: RModuleNode,
    }), []);

    const reactFlowInstance = useReactFlow();
    const reactFlowWrapper = useRef(null);

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onClick = function() {
        if (reactFlowWrapper.current) {
            console.log(reactFlowWrapper.current)
            reactFlowWrapper.current.classList.toggle('hide');
        }
    };

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
            const type = event.dataTransfer.getData('application/reactflow');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.project({
                x: event.clientX - reactFlowBounds.left - nodeWidth / 2,
                y: event.clientY - reactFlowBounds.top - nodeHeight / 2,
            });
            const newId = getId();

            const newNode = {
                id: newId,
                type,
                position,
                data: {
                    label: `Module_${newId}`,
                    value: 0,
                    moduleType: type
                },
            };

            reactFlowInstance.setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance]
    );

    return (
        <div style={divStyle} className="reactflow-wrapper" ref={reactFlowWrapper}>
            <button onClick={onClick} >
                Node Editor
            </button>
            <ReactFlow
                style={reactFlowStyle}
                nodeTypes={nodeTypes}
                defaultNodes={nodes}
                defaultEdges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                proOptions={{
                    account: 'paid-pro',
                    hideAttribution: true
                }}
            >
                {/* <Controls /> */}
            </ReactFlow>
            <ModulesList />
        </div>
    );
}

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

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
            type: node.moduleType
        });

        for (const child of node.children) {
            edges.push({
                id: `E_${node.id}-${child.id}`,
                source: `${node.id}`,
                sourceHandle: `source_${child.face}`,
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
