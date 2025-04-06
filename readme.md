# $HIT Coin Trader Pro

This is a simple crypto trading parody game built with React and Tailwind CSS.
(And Gemini 2.5 Pro via bolt.diy, but that was a little bit of a disaster. A lot
of manual recovery was required, and then o3-mini in Cursor failed many times at
fixing the many logic bugs that Gemini had created.)

The whole thing runs client-side in your browser.

## Running locally

Clone the repo, then run the following:

```bash
npm install
npm run build
bash -c "cd dist/ && python -m http.server >/dev/null 2>&1" &
```

Then open your browser and navigate to `http://localhost:8000`. This starts the
Python http server as a background process, so you can rebuild the app and
refresh your browser to test any changes.

## Contributing

If you have a good idea for improving this game, bearing in mind that it will
always and only be a single-player game hosted on Cloudflare Pages, fork the
repo, try it out, and then make a pull request if it works.

I plan to make a p2p multi-player parody crypto trading game in a few months. If
you want to discuss ideas/designs for it, join the Discord group with the link
on the [Pycelium community page](https://www.pycelium.com/community).

## ISC License

Copyright (c) 2025 The Pycelium Company

Permission to use, copy, modify, and/or distribute this software
for any purpose with or without fee is hereby granted, provided
that the above copyright notice and this permission notice appear in
all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL
WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE
AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR
CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT,
NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
