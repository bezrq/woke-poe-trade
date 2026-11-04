#!/usr/bin/env python3
"""Synthetic PoE map tooltips for the OCR bench.

Renders map tooltips in Fontin SmallCaps (the game's tooltip font) with the
game's text colours, on a translucent box over real game backgrounds, and
writes <id>.png + <id>.json labels in the bench's sample format.

  python3 synth.py --font Fontin-SmallCaps.ttf --bg screenshot.png \
      --stats ../../renderer/public/data/en/stats.ndjson --out DIR [--n 40]

Real screenshots are the ground truth; these exist so the pipeline can be
measured and tuned (and a font model trained) before enough real ones exist.
"""
import argparse, json, os, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

GREY = (127, 127, 127)
WHITE = (255, 255, 255)
BLUE = (136, 136, 255)
RED = (210, 0, 0)
YELLOW = (255, 255, 119)
NORMAL = (200, 200, 200)
UNIQUE = (175, 96, 37)
SEP = (138, 92, 44)
ENCHANT = (184, 218, 241)
ORIGINATOR = "Area is Influenced by the Originator's Memories"
ENCHANTS = ['Area contains a Blight Encounter', 'Area contains a Breach', 'Area contains an Expedition Encounter',
            'Area contains a Ritual Altar', 'Area contains an Abyss']

PREFIXES = ['Abhorrent', 'Afflicting', 'Antagonist\'s', 'Armoured', 'Burning', 'Chaining', 'Conflagrating',
            'Fecund', 'Hexproof', 'Mirrored', 'Overlord\'s', 'Savage', 'Splitting', 'Stalwart', 'Twinned', 'Unstoppable']
SUFFIXES = ['of Balance', 'of Bloodlines', 'of Congealment', 'of Deadliness', 'of Drought', 'of Elemental Weakness',
            'of Enfeeblement', 'of Exposure', 'of Frenzy', 'of Impotence', 'of Insulation', 'of Smothering',
            'of Stasis', 'of Toughness', 'of Venom', 'of Vulnerability']
MAPS = ['Strand', 'Crimson Temple', 'Cemetery', 'Tower', 'Jungle Valley', 'Dunes', 'Mesa', 'Toxic Sewer', 'City Square',
        'Defiled Cathedral', 'Burial Chambers', 'Park', 'Arcade', 'Canyon', 'Glacier', 'Tropical Island', 'Alleyways']
RARE_A = ['Grim', 'Dread', 'Mind', 'Doom', 'Ghastly', 'Woe', 'Blight', 'Shadow', 'Pain', 'Murder', 'Chaos']
RARE_B = ['Pit', 'Halls', 'Trap', 'Mist', 'Field', 'Crypt', 'Path', 'Cell', 'Stand', 'Barrow', 'Den']


def load_mods(stats_path):
    mods = set()
    for line in open(stats_path, encoding='utf-8'):
        if 'fromAreaMods' not in line:
            continue
        d = json.loads(line)
        for s in (d.get('stats') or [d]):
            f = s.get('fromAreaMods')
            if f != 'yes':
                continue
            for m in s['matchers']:
                if 'value' not in m:  # skip fixed-value alternates
                    mods.add(m['string'])
    # Mods that show on maps, not on scarabs/sextants/atlas passives.
    return sorted(m for m in mods if len(m) < 90)


def fill(mod, rng):
    out = mod
    while '#' in out:
        if '#%' in out:
            v = rng.choice([rng.randint(10, 60), rng.randint(20, 120)])
        else:
            v = rng.randint(1, 5)
        out = out.replace('#', str(v), 1)
    return out


def tooltip_spec(rng, mods):
    rarity = rng.choices(['normal', 'magic', 'rare', 'unique'], [1, 3, 8, 0.5])[0]
    tier = rng.randint(1, 16)
    base = rng.choice(MAPS) + ' Map'
    nmods = {'normal': 0, 'magic': rng.randint(1, 2), 'rare': rng.randint(4, 8), 'unique': rng.randint(3, 5)}[rarity]
    picked = rng.sample(mods, nmods)
    mod_lines = [fill(m, rng) for m in picked]
    quality = rng.choice([0, 0, rng.randint(1, 20)])
    qty = sum(rng.randint(8, 20) for _ in picked) + quality
    rar = sum(rng.randint(4, 12) for _ in picked) + (quality if rng.random() < .5 else 0)
    pack = sum(rng.randint(0, 7) for _ in picked)
    tier_line = (f'Map (Tier {tier})', WHITE if rarity == 'normal' else BLUE if rarity == 'magic' else YELLOW if rarity == 'rare' else UNIQUE)
    if rarity == 'normal':
        header = [(base, NORMAL)]
    elif rarity == 'magic':
        name = ' '.join(x for x in [rng.choice(PREFIXES), base, rng.choice(SUFFIXES) if nmods > 1 else ''] if x)
        header = [(name, BLUE)]
    elif rarity == 'rare':
        header = [(f'{rng.choice(RARE_A)} {rng.choice(RARE_B)}', YELLOW), tier_line]
    else:
        header = [('Maelstrom of Chaos', UNIQUE), tier_line]
    props = {}
    pl = [[('Monster Level: ', GREY), (str(min(84, 67 + tier + rng.randint(0, 1))), WHITE)]]
    if qty:
        props['quantity'] = qty
        pl.append([('Item Quantity: ', GREY), (f'+{qty}%', BLUE)])
    if rar:
        props['rarity'] = rar
        pl.append([('Item Rarity: ', GREY), (f'+{rar}%', BLUE)])
    if pack:
        props['packSize'] = pack
        pl.append([('Monster Pack Size: ', GREY), (f'+{pack}%', BLUE)])
    if quality:
        props['quality'] = quality
        pl.append([('Quality: ', GREY), (f'+{quality}%', BLUE)])
    originator = rarity in ('rare', 'magic') and tier >= 14 and rng.random() < 0.7
    if originator:
        for key, name in rng.sample([('currency', 'More Currency'), ('maps', 'More Maps'), ('scarabs', 'More Scarabs'), ('divCards', 'More Divination Cards')], rng.randint(0, 2)):
            v = rng.randint(10, 110)
            props[key] = v
            pl.append([(f'{name}: ', GREY), (f'+{v}%', BLUE)])
    blocks = [pl]
    implicit = []
    if originator:
        implicit.append([(ORIGINATOR, BLUE)])
    if rng.random() < 0.12:
        implicit.append([(rng.choice(ENCHANTS), ENCHANT)])
    if implicit:
        blocks.append(implicit)
    if mod_lines:
        blocks.append([[(m, BLUE)] for m in mod_lines])
    blocks.append([[('Travel to a Map of this tier or lower by using this in a personal Map', GREY)],
                   [('Device. Maps can only be used once.', GREY)]])
    corrupted = rng.random() < 0.3
    if corrupted:
        blocks.append([[('Corrupted', RED)]])
    impl_lines = [''.join(t for t, _ in segs) for segs in implicit]
    return {'rarity': rarity, 'header': header, 'blocks': blocks, 'props': props,
            'mods': picked, 'modLines': impl_lines + mod_lines, 'corrupted': corrupted}


def render(spec, bg, rng, H):
    W = bg.width
    scale = H / 1080 * rng.uniform(0.92, 1.12)
    body = ImageFont.truetype(FONT, round(17 * scale))
    head = ImageFont.truetype(FONT, round(19 * scale))
    pitch = round(20.5 * scale)
    lines = []  # (segments, font, kind)
    for text, col in spec['header']:
        lines.append(([(text, col)], head, 'head'))
    for i, block in enumerate(spec['blocks']):
        if i:
            lines.append((None, None, 'sep'))
        for segs in block:
            lines.append((segs, body, 'line'))
    d0 = ImageDraw.Draw(bg)
    def width(segs, font):
        return sum(d0.textlength(t, font=font) for t, _ in segs)
    tw = int(max(width(s, f) for s, f, k in lines if s) + 40 * scale)
    th = 0
    for s, f, k in lines:
        th += round(pitch * 1.45) if k == 'head' else round(pitch * 0.55) if k == 'sep' else pitch
    th += round(12 * scale)
    # Tooltip beside the hovered item; cursor just outside it.
    cx = rng.randint(int(W * 0.15), int(W * 0.85))
    left = rng.random() < 0.5
    tx = cx - tw - round(25 * scale) if left else cx + round(25 * scale)
    tx = max(0, min(W - tw, tx))
    ty = rng.randint(0, max(0, H - th))
    cy = rng.randint(ty, ty + th) if th < H else rng.randint(0, H - 1)
    if tx <= cx <= tx + tw:
        cx = tx - 10 if tx > 20 else tx + tw + 10
    img = bg.convert('RGBA')
    over = Image.new('RGBA', img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(over)
    alpha = round(255 * rng.uniform(0.55, 0.88))
    od.rectangle([tx, ty, tx + tw, ty + th], fill=(0, 0, 0, alpha))
    hh = round(pitch * 1.45) * len(spec['header']) + round(4 * scale)
    od.rectangle([tx, ty, tx + tw, ty + hh], fill=(40, 28, 16, 235))
    img = Image.alpha_composite(img, over)
    d = ImageDraw.Draw(img)
    y = ty + round(6 * scale)
    boxes = []
    for segs, font, kind in lines:
        if kind == 'sep':
            h = round(pitch * 0.55)
            d.line([tx + tw * 0.15, y + h // 2, tx + tw * 0.85, y + h // 2], fill=SEP, width=max(1, round(scale)))
            y += h
            continue
        h = round(pitch * 1.45) if kind == 'head' else pitch
        lw = width(segs, font)
        x = tx + (tw - lw) / 2
        boxes.append({'text': ''.join(t for t, _ in segs), 'x': round(x), 'y': round(y), 'width': round(lw), 'height': h})
        for t, col in segs:
            ty0 = y + (h - pitch) / 2
            d.text((x, ty0), t, font=font, fill=col)
            # Keywords in mods are sometimes underlined in game.
            if col == BLUE and kind == 'line' and rng.random() < 0.12:
                words = t.split(' ')
                k = rng.randrange(len(words))
                ux = x + d.textlength(' '.join(words[:k]) + (' ' if k else ''), font=font)
                uy = ty0 + font.size * 1.0
                d.line([ux, uy, ux + d.textlength(words[k], font=font), uy], fill=col, width=1)
            x += d.textlength(t, font=font)
        y += h
    return img.convert('RGB'), {'x': cx, 'y': cy}, {'x': tx, 'y': ty, 'width': tw, 'height': th}, boxes


def text_lines(spec):
    out = [t for t, _ in spec['header']]
    for block in spec['blocks']:
        out += [''.join(t for t, _ in segs) for segs in block]
    return out


def main():
    global FONT
    ap = argparse.ArgumentParser()
    ap.add_argument('--font', required=True)
    ap.add_argument('--bg', required=True, nargs='+')
    ap.add_argument('--stats', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--n', type=int, default=40)
    ap.add_argument('--seed', type=int, default=1)
    ap.add_argument('--height', type=int, nargs='+', default=[1440])
    a = ap.parse_args()
    FONT = a.font
    rng = random.Random(a.seed)
    mods = load_mods(a.stats)
    bgs = [Image.open(p).convert('RGB') for p in a.bg]
    os.makedirs(a.out, exist_ok=True)
    for i in range(a.n):
        H = rng.choice(a.height)
        W = round(H * 16 / 9)
        bg = rng.choice(bgs)
        if rng.random() < 0.5:
            bg = bg.transpose(Image.FLIP_LEFT_RIGHT)
        bg = bg.resize((W, H))
        spec = tooltip_spec(rng, mods)
        img, cursor, box, line_boxes = render(spec, bg, rng, H)
        sid = f'synth-{a.seed}-{i:03d}'
        img.save(os.path.join(a.out, sid + '.png'), compress_level=1)
        label = {'kind': 'map', 'source': 'synthetic', 'cursor': cursor, 'box': box,
                 'lines': text_lines(spec), 'props': spec['props'], 'mods': spec['mods'],
                 'modLines': spec['modLines'], 'corrupted': spec['corrupted'], 'lineBoxes': line_boxes}
        json.dump(label, open(os.path.join(a.out, sid + '.json'), 'w'), indent=1)
    print(f'wrote {a.n} samples to {a.out}')


if __name__ == '__main__':
    main()
