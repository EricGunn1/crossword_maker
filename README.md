# Crossword Maker

A browser-based crossword puzzle maker. Create a square grid, mark blank
squares, write across/down clues, and publish a read-only version of the
puzzle for solvers.

## Download

```bash
git clone git@github.com:EricGunn1/crossword_maker.git
cd crossword_maker
```

## Run

This is a static site with no build step or dependencies — just open
[index.html](index.html) in a browser:

```bash
open index.html        # macOS
xdg-open index.html    # Linux
```

Or serve it locally (needed if your browser blocks local file access for
scripts):

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000 in your browser.
