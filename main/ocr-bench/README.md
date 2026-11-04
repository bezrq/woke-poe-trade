# OCR bench

Measures how well map scan and essence scan read the screen, by running the
app's own vision and OCR code (the same opencv + tesseract wasm files) on
labelled screenshots. Use it before and after any change to
`src/woke/map-scan-vision.ts`, the OCR model or the parsers in
`renderer/src/web/woke/`.

## Running

You need the OCR files the app uses (APT's `cv-ocr.zip`, see
`docs/ocr-guide.md`), unzipped anywhere. Runs on Windows, Linux or macOS.

```
cd main
npm run ocr-bench -- --ocr <cv-ocr dir> --fails
```

Options:

- `--samples <dir>`: labelled screenshots. Default: `testing/fixtures/screens`,
  the real ones the OCR tests also read.
- `--kind map|essence`: only one kind.

- `--model <name or path>`: read with a different model. Default: the one
  the app ships (`renderer/public/data/ocr/poe.traineddata`); `eng` is stock English.
- `--out <dir>`: write each misread line's image and text, to see why.
- `--oracle`: read only the labelled tooltip box, to tell "didn't find the
  tooltip" apart from "found it, misread it".

It prints, for maps: tooltips read perfectly (every mod, roll and property
right), mod recall / precision, rolls right, properties right, character
accuracy and timings. For essences: labels read perfectly, essence recall /
precision, and whether "corrupted" was right.

## Samples

The samples are `testing/fixtures/screens/map-real-*` and `essence-real-*`:
Guy's 2560x1440 screenshots, blacked out away from the tooltip to keep them
small. The OCR tests (`testing/vision/ocr.test.ts`) read the same files, so a
new sample is also a new test. Each `<id>.png` has an `<id>.json`:

```jsonc
// map
{ "kind": "map", "cursor": { "x": 2080, "y": 1020 },   // where the hovered item was
  "tier": 14,
  "props": { "quantity": 46, "rarity": 27, "packSize": 18 },
  "mods": ["Players cannot inflict Exposure", ...],    // matcher strings, for the tests
  "modLines": ["Players cannot inflict Exposure", ...],// as shown, for the bench
  "lines": ["Ancient Vector", "Map (Tier 14)", ...],   // every line, for character accuracy
  "box": { "x": 1675, "y": 525, "width": 813, "height": 470 } }  // tooltip, for --oracle

// essence
{ "kind": "essence", "cursor": { ... },
  "essences": ["Weeping Essence of Woe", "Wailing Essence of Spite"], "corrupted": false,
  "knownMiss": "a health bar covers part of the label" }  // optional: the test expects a miss
```

To add one: take a screenshot in game (Options > Input > Screenshot), black
out everything more than ~160 px from the tooltip, and write the label. Hard
cases (busy backgrounds, health bars over labels, 1080p, 4K) are the most
useful.

## Synthetic tooltips and the model

`synth.py` draws map tooltips in the game's font (Fontin SmallCaps, not in
the repo; free from exljbris) with the game's colours over real game
backgrounds, with exact labels. They're for training, and for testing more
tooltips than we have screenshots of:

```
python3 ocr-bench/synth.py --font Fontin-SmallCaps.ttf --bg screenshots/*.png \
  --stats ../renderer/public/data/en/stats.ndjson --out /tmp/synth --n 200
```

`renderer/public/data/ocr/poe.traineddata` is stock English Tesseract
(tessdata_best) fine-tuned on ~7,400 lines cut from synthetic tooltips by
the app's own line cutter (`npm run ocr-train-lines`), so it's trained on
exactly what it's shown. To retrain:

1. Make synthetic tooltips (above), then
   `npm run ocr-train-lines -- --ocr <cv-ocr dir> --samples /tmp/synth --out /tmp/gt`.
2. For each line, write a WordStr box file and run
   `tesseract <line>.png <line> --psm 13 lstm.train` (needs the
   `lstm.train` config in the tessdata dir) to get `.lstmf` files.
3. `combine_tessdata -e eng.traineddata eng.lstm` (tessdata_best's eng), then
   `lstmtraining --continue_from eng.lstm --traineddata eng.traineddata
   --train_listfile list.train --eval_listfile list.eval --max_iterations 6000
   --model_output ckpt/poe`.
4. `lstmtraining --stop_training --convert_to_int --continue_from ckpt/poe_checkpoint
   --traineddata eng.traineddata --model_output poe.traineddata`.
5. Check it with the bench on the real samples before shipping it.
