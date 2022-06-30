export function hexToHSL(H) {
    // Convert hex to RGB first
    let r = 0, g = 0, b = 0;
    if (H.length === 4) {
        r = "0x" + H[1] + H[1];
        g = "0x" + H[2] + H[2];
        b = "0x" + H[3] + H[3];
    } else if (H.length === 7) {
        r = "0x" + H[1] + H[2];
        g = "0x" + H[3] + H[4];
        b = "0x" + H[5] + H[6];
    }
    // Then to HSL
    r /= 255;
    g /= 255;
    b /= 255;
    let cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;

    if (delta === 0)
        h = 0;
    else if (cmax === r)
        h = ((g - b) / delta) % 6;
    else if (cmax === g)
        h = (b - r) / delta + 2;
    else
        h = (r - g) / delta + 4;

    h = Math.round(h * 60);

    if (h < 0)
        h += 360;

    l = (cmax + cmin) / 2;
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return [h, s, l];
}

export const getColor = (color, val) => {
    const [hue] = hexToHSL(color);
    return "hsl(" + hue + ", " + Math.floor(100 * val) + "%, 50%)";
}

export const lerpColor = (start, end, amount) => {
    let a, b;

    if (typeof start === "number") {
        a = start;
    } else {
        a = parseInt(start.replace(/^#/, ''), 16);
    }

    if (typeof end === "number") {
        b = end;
    } else {
        b = parseInt(end.replace(/^#/, ''), 16);
    }

    const ar = (a & 0xFF0000) >> 16,
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

