import { Children, forwardRef, useRef, useCallback } from "react";
import "./Panel.css";

export function Panel(props) {
    return props.children;
}

const PanelTab = (props) => {
    const buttonRef = useRef(null);

    const onClick = useCallback(
        () => {
            props.contentRef.classList.toggle('hide');
            buttonRef.current.classList.toggle('hide');
            // console.log(props.contentRef.offsetWidth);
        }, [props.contentRef]
    );

    const divStyle = {
        zIndex: props.index,
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
        height: props.height ? props.height : '100%',
    }

    return (
        <div className={`panel-wrapper ${props.opened ? '' : 'hide'}`} ref={ref} style={divStyle}>
            <div className="panel-inner">
                {props.children}
            </div>
        </div>
    )
});

export function PanelList(props) {
    const contentRefs = useRef([]);

    return (
        <div className="panel-list">
            <>
                {
                    Children.map(props.children, (child, index) => {
                        return (
                            <PanelTab
                                key={index}
                                index={index}
                                opened={child.props?.opened}
                                contentRef={contentRefs.current[index]}
                            >
                                {child.props.name}
                            </PanelTab>);
                    })
                }
            </>
            <>
                {
                    Children.map(props.children, (child, index) => {
                        return (
                            <PanelContent
                                key={index}
                                index={index}
                                {...child.props}
                                ref={el => contentRefs.current[index] = el}
                            >
                                {child}
                            </PanelContent>
                        )
                    })
                }
            </>
        </div>
    );
}
