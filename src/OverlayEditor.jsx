import { Leva, LevaPanel } from "leva";

export const OverlayEditor = ({ storeTree, storeColor, storeDebug }) => {
    return (
        <div
            style={{
                position: 'fixed',
                zIndex: 100,
                pointerEvents: 'none',
                width: '100%',
                padding: 10,
            }}
        >
            <div
                style={{
                    float: 'left',
                    pointerEvents: 'auto',
                    width: 300,
                }}
            >
                <Leva fill />
                <LevaPanel store={storeDebug} fill titleBar={false} />
            </div>
            <div
                style={{
                    float: 'right',
                    display: 'inline-flex',
                    gap: 10,
                    alignItems: 'start'
                }}
            >
                <div
                    style={{
                        pointerEvents: 'auto',
                        width: 300,
                    }}
                >
                    <LevaPanel store={storeTree} fill />
                </div>
                <div
                    style={{
                        pointerEvents: 'auto',
                        width: 300,
                    }}
                >
                    <LevaPanel store={storeColor} fill />
                </div>
            </div>
        </div>
    );
}
