#!/usr/bin/env python3
"""Genererer app-ikonerne (PNG) uden eksterne biblioteker.

    python3 tools/make-icons.py

Tegner den samme bille-formede maskine som i spillet, set oppefra.
"""
import os
import struct
import zlib

SS = 4  # supersampling
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'icons')


def hex_rgb(s):
    s = s.lstrip('#')
    return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16))


class Canvas:
    def __init__(self, size):
        self.n = size * SS
        self.px = bytearray(self.n * self.n * 4)

    def blend(self, x, y, rgb, a=1.0):
        if x < 0 or y < 0 or x >= self.n or y >= self.n or a <= 0:
            return
        i = (y * self.n + x) * 4
        p = self.px
        inv = 1 - a
        p[i] = int(rgb[0] * a + p[i] * inv)
        p[i + 1] = int(rgb[1] * a + p[i + 1] * inv)
        p[i + 2] = int(rgb[2] * a + p[i + 2] * inv)
        p[i + 3] = min(255, int(255 * a + p[i + 3] * inv))

    def rrect(self, x0, y0, x1, y1, r, color, alpha=1.0):
        rgb = hex_rgb(color) if isinstance(color, str) else color
        for y in range(max(0, int(y0)), min(self.n, int(y1) + 1)):
            for x in range(max(0, int(x0)), min(self.n, int(x1) + 1)):
                cx = min(max(x, x0 + r), x1 - r)
                cy = min(max(y, y0 + r), y1 - r)
                if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                    self.blend(x, y, rgb, alpha)

    def circle(self, cx, cy, r, color, alpha=1.0):
        rgb = hex_rgb(color) if isinstance(color, str) else color
        for y in range(max(0, int(cy - r)), min(self.n, int(cy + r) + 1)):
            for x in range(max(0, int(cx - r)), min(self.n, int(cx + r) + 1)):
                if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                    self.blend(x, y, rgb, alpha)

    def vgradient(self, x0, y0, x1, y1, top, bottom):
        a = hex_rgb(top)
        b = hex_rgb(bottom)
        h = max(1, y1 - y0)
        for y in range(max(0, int(y0)), min(self.n, int(y1) + 1)):
            t = (y - y0) / h
            rgb = tuple(int(a[k] + (b[k] - a[k]) * t) for k in range(3))
            for x in range(max(0, int(x0)), min(self.n, int(x1) + 1)):
                self.blend(x, y, rgb, 1.0)

    def downsample(self, size):
        out = bytearray(size * size * 4)
        f = SS * SS
        for y in range(size):
            for x in range(size):
                r = g = b = a = 0
                for sy in range(SS):
                    for sx in range(SS):
                        i = ((y * SS + sy) * self.n + (x * SS + sx)) * 4
                        r += self.px[i]; g += self.px[i + 1]; b += self.px[i + 2]; a += self.px[i + 3]
                j = (y * size + x) * 4
                out[j] = r // f; out[j + 1] = g // f; out[j + 2] = b // f; out[j + 3] = a // f
        return out


def write_png(path, size, rgba):
    raw = bytearray()
    for y in range(size):
        raw.append(0)
        raw += rgba[y * size * 4:(y + 1) * size * 4]

    def chunk(tag, data):
        return (struct.pack('>I', len(data)) + tag + data +
                struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff))

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(bytes(raw), 9))
    png += chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)


def draw_icon(size, pad_ratio=0.0):
    c = Canvas(size)
    n = c.n
    # baggrund: afrundet groen plade
    c.rrect(0, 0, n - 1, n - 1, n * 0.23, '#3f9142')
    c.vgradient(0, 0, n - 1, n - 1, '#5fc16a', '#2f7d32')
    # klippestriber
    for k in range(6):
        if k % 2 == 0:
            c.rrect(0, n * (0.08 + k * 0.15), n - 1, n * (0.08 + k * 0.15) + n * 0.075, 0, '#6fce79', 0.35)

    m = n * (1 - pad_ratio)
    off = (n - m) / 2
    def X(t):
        return off + m * t
    def Y(t):
        return off + m * t

    # hjul (top og bund)
    c.rrect(X(0.26), Y(0.16), X(0.52), Y(0.26), m * 0.05, '#2c2c31')
    c.rrect(X(0.26), Y(0.74), X(0.52), Y(0.84), m * 0.05, '#2c2c31')
    # lille forhjul
    c.circle(X(0.86), Y(0.5), m * 0.045, '#2c2c31')
    # krop
    c.rrect(X(0.14), Y(0.2), X(0.84), Y(0.8), m * 0.2, '#b8460b')
    c.rrect(X(0.155), Y(0.215), X(0.825), Y(0.785), m * 0.19, '#f97316')
    c.rrect(X(0.2), Y(0.24), X(0.78), Y(0.42), m * 0.12, '#ffb266', 0.5)
    # skaerm med smil
    c.rrect(X(0.5), Y(0.34), X(0.76), Y(0.66), m * 0.06, '#0a1a2c')
    c.rrect(X(0.515), Y(0.355), X(0.745), Y(0.645), m * 0.05, '#132a44')
    c.circle(X(0.58), Y(0.44), m * 0.028, '#ffe066')
    c.circle(X(0.69), Y(0.44), m * 0.028, '#ffe066')
    for k in range(11):
        t = k / 10
        x = X(0.565 + 0.13 * t)
        y = Y(0.53 + 0.075 * (1 - (2 * t - 1) ** 2))
        c.circle(x, y, m * 0.019, '#ffe066')
    # stopknap
    c.circle(X(0.26), Y(0.5), m * 0.105, '#8f1015')
    c.circle(X(0.26), Y(0.5), m * 0.088, '#e5484d')
    c.circle(X(0.235), Y(0.47), m * 0.035, '#ff8a8f', 0.75)
    return c.downsample(size)


os.makedirs(OUT, exist_ok=True)
for size, pad in ((180, 0.06), (192, 0.06), (512, 0.06), (512, 0.22)):
    name = 'icon-%d%s.png' % (size, '-maskable' if pad > 0.1 else '')
    write_png(os.path.join(OUT, name), size, draw_icon(size, pad))
    print('skrev icons/%s' % name)
