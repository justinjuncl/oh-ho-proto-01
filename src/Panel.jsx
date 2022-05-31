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
