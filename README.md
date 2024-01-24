# orbitron

`orbitron` is a tool for making orbital animations including spacecraft trajectories using the NASA/JPL Horizons API.

## Current project stage

MEP (Mechanical, Electrical, Plumbing)

## Usage

### Lookup the spacecraft you need

Find the Horizons ID of Voyager 1:

```shell
$ orbitron lookup Voyager

Voyager 1 (spacecraft)
		-31
Voyager 2 (spacecraft)
		-32

```

### Generate the animation

Create a slower animation for the first part of the mission (launch to Saturn), include only the inner planets, Jupiter and Saturn, set one day per frame speed (one month per second), linear projection.

```shell
$ orbitron animate --start 1977-09-06 --stop 1982-01-01    \
  --out voyager1-part1.mp4 --days 1 --legend               \
  --proj lin --origin sun --body -31=green                 \
  --body sun --body mercury --body venus --body earth      \
  --body mars --body jupiter --body saturn
```

Create a faster animation for the second part of the mission (Saturn to outer Solar System), include only the gas giants and Earth, set 10 days per frame (almost an year per second), square root isometric projection:

```shell
$ orbitron animate --start 1980-01-01 --stop 2024-01-01    \
  --out voyager1-part2.mp4 --days 10 --legend              \
  --proj lin --origin sun --body -31=green                 \
  --body sun --body earth                                  \
  --body jupiter --body saturn --body uranus               \
  --body neptune --body pluto
```

At the end of the animation, it will be moving right towards you - it is leaving the Solar System in a highly inclined trajectory about 45° from the north.

If you want to produce a GIF file instead, you can use `--out voyager1.gif --format gif`. To match the style of the Wikipedia articles, you can use:

```shell
$ orbitron animate --start 1977-09-06 --stop 1982-01-01           \
  --out voyager.gif --format gif --days 5                         \
  --font Arial --font-size 12 --date top --width 320 --height 200 \
  --proj lin --origin sun --body -31=green                        \
  --body sun --body earth --body mars --body jupiter --body saturn
```

### Fun things to try

* Animate the Apollo-12 S-IVB stage (yes, it is still there) with the Earth as center of the animation:
```shell
$ orbitron animate --start 2003-03-01 --stop 2003-09-01    \
  --out apollo-11-s4b.mp4 --days 1 --legend                \
  --body -998=green                                        \
  --proj lin --origin earth --body moon 
```

This is in fact the somewhat controversial object `J002E3` that was (re-)discoverd in September 2002 and initially got assigned an asteroid designation, but it is now believed to be in fact the S-IVB stage of the Apollo 12 mission. It is in a highly unstable orbit and it is re-captured by the Earth once every 40 years. In this animation you can see it perform an almost perfect natural gravitational sling-shot around the Moon before being ejected once again in a heliocentric orbit.

* Animate the JWST around the SEMB L2 (Sun & Earth-Moon Barycenter Lagrange 2) point

```shell
$ orbitron animate --start 2021-12-26 --stop 2024-01-01         \
  --days 1 --legend --proj isolin --origin @32 --body @32=red   \
  --body earth --body moon --body -170=green --out jwst.mp4
```

This is called a halo orbit and it is a result from a complex interaction between the two gravitational fields (the Sun and the Earth-Moon system) and the Coriolis force.

* Animate the Korean spacecraft Danuri (low-energy Moon transfer) around the Earth:

```shell
$ orbitron animate --start 2022-08-05 --stop 2023-01-01             \
  --days 1 --legend --proj isolin --origin earth --body @31=yellow  \
  --body earth --body moon --body -155=green --out danuri.mp4
```

### Supported projections

* `lin`: Linear, 2D, top-down view from the north, works best for the inner planets
* `log`: Logarithmic, 2D, top-down view from the north, works best for huge differences in scale
* `sqrt`: Square Root law, 2D, top-down view from the north, works best for the main 8 planets
* `isolin`: Linear, isometric 3D view, 45° from the north, for highly inclined orbits around the inner planets
* `isosqrt`: Square Root law, isometric 3D view, 45° from the north, for the whole solar system
* `sidelin`: Linear, 2D, side view from the plane of the ecliptic, for highly inclined orbits around the inner planets

## License

### Software

ISC License

Copyright (c) 2024, Momtchil Momtchev <momtchil@momtchev.com>

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

### Data

This tool retrieves automatically data from the public NASA/JPL Horizons API. All the data is copyrighted by NASA/JPL. You are free to use their data, but you are not allowed to republish it as your own. Their copyright notice can be found at [Caltech/JPL Privacy Policies and Important Notices](https://www.jpl.nasa.gov/caltechjpl-privacy-policies-and-important-notices) near the bottom of the page.

### Images and video

You are the sole owner of the images and the videos you create.

## Results


* Apollo 12 S-IVB stage
![Apollo 12 S-IVB stage](https://imgur.com/zT4lYws.gif)

* First phase of the Voyager 1 mission
![Voyager 1 part 1](https://imgur.com/4fx1SjT.gif)

* Second phase of the Voyager 1 mission
![Voyager 1 part 2](https://imgur.com/ctE6vUI.gif)

* JWST
JWST (in green), viewed from Earth (blue) orbiting around L2 (in red)
![JWST from Earth](https://imgur.com/An6ns9a.gif)

JWST (in green) viewed from L2 (in red), with Earth (in blue) and Moon (in white), isometric 3D view from 45° north
![JWST 3D](https://imgur.com/AVVfzB3.gif)

JWST (in green) viewed from L2 (in red), with Earth (in blue) and Moon (in white), 2D top down view from the north
![JWST 2D topdown](https://imgur.com/qsHz4NJ.gif)

JWST (in green) viewed from L2 (in red), with Earth (in blue) and Moon (in white), 2D side view from the the plane of the ecliptic
![JWST 2D side](https://imgur.com/bPcVk5u.gif)
