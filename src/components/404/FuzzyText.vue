<script setup lang="ts">
import { onMounted, onUnmounted, watch, nextTick, useTemplateRef, computed } from 'vue';
import { useThemeStore } from '@/stores/theme';

interface FuzzyTextProps {
    text: string;
    fontSize?: number | string;
    fontWeight?: string | number;
    fontFamily?: string;
    color?: string;
    useThemeColor?: boolean;
    enableHover?: boolean;
    baseIntensity?: number;
    hoverIntensity?: number;
}

const props = withDefaults(defineProps<FuzzyTextProps>(), {
    text: '',
    fontSize: 'clamp(2rem, 8vw, 8rem)',
    fontWeight: 900,
    fontFamily: 'inherit',
    color: '#fff',
    useThemeColor: false,
    enableHover: true,
    baseIntensity: 0.18,
    hoverIntensity: 0.5
});

const themeStore = useThemeStore();

// Tailwind颜色映射
const getTailwindColor = (hexColor: string): string => {
    // 将主题色映射到对应的Tailwind颜色
    const colorMap: Record<string, string> = {
        '#570df8': 'rgb(87 13 248)', // light primary
        '#661ae6': 'rgb(102 26 230)', // dark primary
        '#65c3c8': 'rgb(101 195 200)', // cupcake primary
        '#e0a82e': 'rgb(224 168 46)', // bumblebee primary
        '#66cc8a': 'rgb(102 204 138)', // emerald primary
        '#4b6bfb': 'rgb(75 107 251)', // corporate primary
        '#e779c1': 'rgb(231 121 193)', // synthwave primary
        '#ef9995': 'rgb(239 153 149)', // retro primary
        '#ff7598': 'rgb(255 117 152)', // cyberpunk primary
        '#e96d7b': 'rgb(233 109 123)', // valentine primary
        '#f28c18': 'rgb(242 140 24)', // halloween primary
        '#5c7f67': 'rgb(92 127 103)', // garden primary
        '#1eb854': 'rgb(30 184 84)', // forest primary
        '#09ecf3': 'rgb(9 236 243)', // aqua primary
        '#0d0d0d': 'rgb(13 13 13)', // lofi primary
        '#d1c1d7': 'rgb(209 193 215)', // pastel primary
        '#6e0b75': 'rgb(110 11 117)', // fantasy primary
        '#b8b8b8': 'rgb(184 184 184)', // wireframe primary
        '#343232': 'rgb(52 50 50)', // black primary
        '#ffffff': 'rgb(255 255 255)', // luxury primary
        '#ff79c6': 'rgb(255 121 198)', // dracula primary
        '#45aeee': 'rgb(69 174 238)', // cmyk primary
        '#8c0327': 'rgb(140 3 39)', // autumn primary
        '#1c4ed8': 'rgb(28 78 216)', // business primary
        '#ff00ff': 'rgb(255 0 255)', // acid primary
        '#519903': 'rgb(81 153 3)', // lemonade primary
        '#38bdf8': 'rgb(56 189 248)', // night primary
        '#db924b': 'rgb(219 146 75)', // coffee primary
        '#047aed': 'rgb(4 122 237)', // winter primary
    };

    return colorMap[hexColor] || hexColor;
};

// 计算实际使用的颜色
const actualColor = computed(() => {
    if (props.useThemeColor) {
        const themeColor = themeStore.currentThemeObject.colors.primary;
        return getTailwindColor(themeColor);
    }
    return props.color;
});

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef');
let animationFrameId: number;
let isCancelled = false;
let cleanup: (() => void) | null = null;

const waitForFont = async (fontFamily: string, fontWeight: string | number, fontSize: string): Promise<boolean> => {
    if (document.fonts?.check) {
        const fontString = `${fontWeight} ${fontSize} ${fontFamily}`;

        if (document.fonts.check(fontString)) {
            return true;
        }

        try {
            await document.fonts.load(fontString);
            return document.fonts.check(fontString);
        } catch (error) {
            console.warn('Font loading failed:', error);
            return false;
        }
    }

    return new Promise(resolve => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            resolve(false);
            return;
        }

        ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`;
        const testWidth = ctx.measureText('M').width;

        let attempts = 0;
        const checkFont = () => {
            ctx.font = `${fontWeight} ${fontSize} ${fontFamily}`;
            const newWidth = ctx.measureText('M').width;

            if (newWidth !== testWidth && newWidth > 0) {
                resolve(true);
            } else if (attempts < 20) {
                attempts++;
                setTimeout(checkFont, 50);
            } else {
                resolve(false);
            }
        };

        setTimeout(checkFont, 10);
    });
};

const initCanvas = async () => {
    if (document.fonts?.ready) {
        await document.fonts.ready;
    }

    if (isCancelled) return;

    const canvas = canvasRef.value;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const computedFontFamily =
        props.fontFamily === 'inherit' ? window.getComputedStyle(canvas).fontFamily || 'sans-serif' : props.fontFamily;

    const fontSizeStr = typeof props.fontSize === 'number' ? `${props.fontSize}px` : props.fontSize;
    let numericFontSize: number;

    if (typeof props.fontSize === 'number') {
        numericFontSize = props.fontSize;
    } else {
        const temp = document.createElement('span');
        temp.style.fontSize = props.fontSize;
        temp.style.fontFamily = computedFontFamily;
        document.body.appendChild(temp);
        const computedSize = window.getComputedStyle(temp).fontSize;
        numericFontSize = parseFloat(computedSize);
        document.body.removeChild(temp);
    }

    const fontLoaded = await waitForFont(computedFontFamily, props.fontWeight, fontSizeStr);
    if (!fontLoaded) {
        console.warn(`Font not loaded: ${computedFontFamily}`);
    }

    const text = props.text;

    const offscreen = document.createElement('canvas');
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    const fontString = `${props.fontWeight} ${fontSizeStr} ${computedFontFamily}`;
    offCtx.font = fontString;

    const testMetrics = offCtx.measureText('M');
    if (testMetrics.width === 0) {
        setTimeout(() => {
            if (!isCancelled) {
                initCanvas();
            }
        }, 100);
        return;
    }

    offCtx.textBaseline = 'alphabetic';
    const metrics = offCtx.measureText(text);

    const actualLeft = metrics.actualBoundingBoxLeft ?? 0;
    const actualRight = metrics.actualBoundingBoxRight ?? metrics.width;
    const actualAscent = metrics.actualBoundingBoxAscent ?? numericFontSize;
    const actualDescent = metrics.actualBoundingBoxDescent ?? numericFontSize * 0.2;

    const textBoundingWidth = Math.ceil(actualLeft + actualRight);
    const tightHeight = Math.ceil(actualAscent + actualDescent);

    const extraWidthBuffer = 10;
    const offscreenWidth = textBoundingWidth + extraWidthBuffer;

    offscreen.width = offscreenWidth;
    offscreen.height = tightHeight;

    const xOffset = extraWidthBuffer / 2;
    offCtx.font = `${props.fontWeight} ${fontSizeStr} ${computedFontFamily}`;
    offCtx.textBaseline = 'alphabetic';
    offCtx.fillStyle = actualColor.value;
    offCtx.fillText(text, xOffset - actualLeft, actualAscent);

    const horizontalMargin = 50;
    const verticalMargin = 0;
    canvas.width = offscreenWidth + horizontalMargin * 2;
    canvas.height = tightHeight + verticalMargin * 2;
    ctx.translate(horizontalMargin, verticalMargin);

    const interactiveLeft = horizontalMargin + xOffset;
    const interactiveTop = verticalMargin;
    const interactiveRight = interactiveLeft + textBoundingWidth;
    const interactiveBottom = interactiveTop + tightHeight;

    let isHovering = false;
    const fuzzRange = 30;

    const run = () => {
        if (isCancelled) return;
        ctx.clearRect(-fuzzRange, -fuzzRange, offscreenWidth + 2 * fuzzRange, tightHeight + 2 * fuzzRange);
        const intensity = isHovering ? props.hoverIntensity : props.baseIntensity;
        for (let j = 0; j < tightHeight; j++) {
            const dx = Math.floor(intensity * (Math.random() - 0.5) * fuzzRange);
            ctx.drawImage(offscreen, 0, j, offscreenWidth, 1, dx, j, offscreenWidth, 1);
        }
        animationFrameId = window.requestAnimationFrame(run);
    };

    run();

    const isInsideTextArea = (x: number, y: number) =>
        x >= interactiveLeft && x <= interactiveRight && y >= interactiveTop && y <= interactiveBottom;

    const handleMouseMove = (e: MouseEvent) => {
        if (!props.enableHover) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        isHovering = isInsideTextArea(x, y);
    };

    const handleMouseLeave = () => {
        isHovering = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!props.enableHover) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        isHovering = isInsideTextArea(x, y);
    };

    const handleTouchEnd = () => {
        isHovering = false;
    };

    if (props.enableHover) {
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd);
    }

    cleanup = () => {
        window.cancelAnimationFrame(animationFrameId);
        if (props.enableHover) {
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);
        }
    };
};

onMounted(() => {
    nextTick(() => {
        initCanvas();
    });
});

onUnmounted(() => {
    isCancelled = true;
    if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
    }
    if (cleanup) {
        cleanup();
    }
});

watch(
    [
        () => props.text,
        () => props.fontSize,
        () => props.fontWeight,
        () => props.fontFamily,
        () => props.color,
        () => props.useThemeColor,
        () => props.enableHover,
        () => props.baseIntensity,
        () => props.hoverIntensity,
        actualColor
    ],
    () => {
        isCancelled = true;
        if (animationFrameId) {
            window.cancelAnimationFrame(animationFrameId);
        }
        if (cleanup) {
            cleanup();
        }
        isCancelled = false;
        nextTick(() => {
            initCanvas();
        });
    }
);
</script>

<template>
    <canvas ref="canvasRef" />
</template>

