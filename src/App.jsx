import { Scene } from "Scene";
import { Logo } from "Logo";
import { Panel, PanelList } from "Panel";
import { NodeEditor } from "NodeEditor";
import { OverlayEditor } from "OverlayEditor";

import "App.css";


const App = () => {
    return (
        <>
            <PanelList offset={50}>
                <Panel name="Debug">
                    <OverlayEditor />
                </Panel>
                <Panel name="Node Editor" opened>
                    <NodeEditor />
                </Panel>
            </PanelList>
            <PanelList left>
                <Panel name="Gallery">
                    <div style={{ textAlign: "center", padding: "100% 0", fontStyle: "italic" }}>Coming soon</div>
                </Panel>
                <Panel name="About">
                    <div style={{ textAlign: "center", padding: "100% 0", fontStyle: "italic" }}>Coming soon</div>
                </Panel>
            </PanelList>
            <Scene />
            <Logo />
        </>
    );
};

export default App;
