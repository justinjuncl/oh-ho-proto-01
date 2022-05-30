import { LevaPanel, useControls as useControlsImpl, useCreateStore } from 'leva'

export function ModulePanel({ selected }) {
    return <LevaPanel store={selected?.moduleData.store} titleBar={{ title: 'Module_' + selected?.id }} />
}

export function useModuleControls(selected, props) {
    const store = useCreateStore()
    const isSelected = selected === store

    const moduleProps = useControlsImpl(
        Object.keys(props).reduce(
            (acc, key) => ({
                ...acc,
                [key]: {
                    ...props[key],
                    transient: false,
                    render: (get) => isSelected
                }
            }),
            {}
        ),
        { store },
    )
    return [store, moduleProps]
}

export function ModuleTreePanel(tree) {
    let result = '';
    let indent = 1;

    console.log(tree)

    function walk(node, indent = 1) {
        tree.forEach(function(node) {
            result += Array(indent).join('  ') + node.id + '\n';
            if (node.children) {
                indent++;
                walk(node.children, indent + 1);
            }
            if (tree.indexOf(node) === tree.length - 1) {
                indent--;
            }
        })
    }

    walk(tree);
    return result;
}
