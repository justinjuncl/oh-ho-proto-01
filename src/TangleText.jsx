import React from "react";
import PropTypes from "prop-types";


export class TangleText extends React.Component {
    static defaultProps = {
        min: -Infinity,
        max: Infinity,
        step: 1,
        decimals: 2,
        pixelDistance: 6,
        className: "react-tangle-input",
        format: function(x) { return x; },
        onInput: function() { }
    };

    static propTypes = {
        value: PropTypes.number.isRequired,
        onChange: PropTypes.func.isRequired,
        onBlur: PropTypes.func.isRequired,
        min: PropTypes.number,
        max: PropTypes.number,
        step: PropTypes.number,
        decimals: PropTypes.number,
        pixelDistance: PropTypes.number,
        className: PropTypes.string,
        onInput: PropTypes.func,
        format: PropTypes.func
    };

    constructor(props) {
        super(props);
        this.state = {
            value: this.truncate(this.props.value),
            isMouseDown: false,
            isReadOnly: true
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.value !== this.props.value) {
            this.setState({ value: this.truncate(this.props.value) });
        }
    }

    truncate = (num) => {
        return Number(num.toFixed(this.props.decimals));
    }

    bounds = (num) => {
        num = Math.max(num, this.props.min);
        num = Math.min(num, this.props.max);
        return num;
    }

    setValue = (value) => {
        let finalValue = this.truncate(this.bounds(value));
        if (this.state.value !== finalValue) {
            this.props.onChange(finalValue);
        }
        this.setState({ value: finalValue });
        return finalValue;
    }

    onChange = (e) => {
        this.setState({ value: e.target.value });
    }

    onBlur = (e) => {
        let parsed = parseFloat(this.state.value);
        if (isNaN(parsed)) {
            this.setState({ value: this.props.value });
        } else {
            const finalValue = this.setValue(parsed);
            this.props.onBlur(finalValue);
        }
        this.setState({ isReadOnly: true });
    }

    onMouseMove = (e) => {
        let change;
        if (this.props.pixelDistance > 0) {
            change = Math.floor((this.startX - e.screenX) / this.props.pixelDistance);
        } else {
            change = this.startX - e.screenX;
        }
        this.dragged = true;
        this.props.onInput(this.setValue(this.startValue - (change * this.props.step)));
    }

    onMouseDown = (e) => {
        // short circuit if currently editing number
        if (e.target === document.activeElement || e.button !== 0) return;
        this.setState({ isMouseDown: true });

        e.preventDefault();

        this.dragged = false;
        this.startX = e.screenX;
        this.startValue = this.state.value;

        window.addEventListener("mousemove", this.onMouseMove);
        window.addEventListener("mouseup", this.onMouseUp);
    }

    onMouseUp = (e) => {
        if (this.state.isMouseDown) {
            e.preventDefault();
            window.removeEventListener("mousemove", this.onMouseMove);
            window.removeEventListener("mouseup", this.onMouseUp);
            if (this.dragged) this.onBlur();
            this.setState({ isMouseDown: false });
        }
    }

    onDoubleClick = (e) => {
        this.setState({ isReadOnly: false });
        e.target.focus();
    }

    onKeyDown = (e) => {
        if (e.which === 38) { // UP
            e.preventDefault();
            this.props.onInput(this.setValue(this.state.value + this.props.step));
        } else if (e.which === 40) { // DOWN
            e.preventDefault();
            this.props.onInput(this.setValue(this.state.value - this.props.step));
        } else if (e.key === "Enter" || e.key === "Escape") { // ENTER
            this.onBlur(e);
            e.target.blur();
        }
    }

    render() {
        return (
            <input
                className={this.props.className}
                disabled={this.props.disabled}
                readOnly={this.state.isReadOnly}
                type="text"
                onChange={this.onChange}
                onMouseDown={this.onMouseDown}
                onKeyDown={this.onKeyDown}
                onMouseUp={this.onMouseUp}
                onDoubleClick={this.onDoubleClick}
                onBlur={this.onBlur}
                value={this.props.format(this.state.value)} />
        );
    }
};

