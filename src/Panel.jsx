import { Children, forwardRef, useEffect, useRef, useCallback } from "react";
import "./Panel.css";

const PANEL_WIDTH = 600;
const PANEL_MARGIN = 18;

export function Panel(props) {
    return props.children;
}

const PanelTab = (props) => {
    const buttonRef = useRef(null);

    const onClick = useCallback(
        () => {
            props.contentRefs[props.index].classList.toggle('hide');
            buttonRef.current.classList.toggle('hide');
        }, [props.contentRefs, props.index, buttonRef]
    );

    let divStyle = {
        zIndex: props.index,
        top: props.offset ? props.offset : 0
    };

    if (props.left) {
        divStyle.right = `${PANEL_MARGIN * (props.index - props.length)}px`;
    } else {
        divStyle.left = `${PANEL_MARGIN * (props.index - 2)}px`;
    }

    return (
        <div className={`button ${props.opened ? '' : 'hide'}`} onClick={onClick} ref={buttonRef} style={divStyle}>
            {props.children}
        </div>
    )
};

const PanelContent = forwardRef((props, ref) => {
    const divStyle = {
        zIndex: props.index,
        width: PANEL_WIDTH,
    }

    return (
        <div className={`panel-wrapper ${props.opened ? '' : 'hide'}`} ref={ref} style={divStyle}>
            <div className="panel-inner">
                {props.children}
            </div>
        </div>
    )
});

export function PanelList({ children, ...props }) {
    const contentRefs = useRef([]);

    useEffect(() => {
        contentRefs.current = contentRefs.current.slice(0, children.length);
    }, [children]);

    return (
        <div className={`panel-list ${props.left ? 'left' : ''}`} style={{ width: PANEL_MARGIN * (children.length ?? 1) }}>
            <>
                {
                    Children.map(children, (child, index) => {
                        return (
                            <PanelContent
                                key={index}
                                index={index}
                                {...child.props}
                                {...props}
                                ref={el => contentRefs.current[index] = el}
                            >
                                {child}
                            </PanelContent>
                        )
                    })
                }
            </>
            <>
                {
                    Children.map(children, (child, index) => {
                        return (
                            <PanelTab
                                key={index}
                                index={index}
                                length={children.length}
                                {...child.props}
                                {...props}
                                contentRefs={contentRefs.current}
                            >
                                {child.props.name}
                            </PanelTab>);
                    })
                }
            </>
        </div>
    );
}
