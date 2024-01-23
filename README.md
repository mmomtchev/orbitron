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

### Fun things to try

Animate the Apollo-12 S-IVB stage (yes, it is still there) with the Earth as center of the animation:
```shell
$ orbitron animate --start 2003-03-01 --stop 2003-09-01    \
  --out apollo-11-s4b.mp4 --days 1 --legend                \
  --body --998=green                                       \
  --proj lin --origin earth --body moon 
```

This is in fact the somewhat controversial object `J002E3` that was (re-)discoverd in September 2002 and initially got assigned an asteroid designation, but it is now believed to be in fact the S-IVB stage of the Apollo 12 mission. It is in a highly unstable orbit and it is re-captured by the Earth once every 40 years. In this animation you can see it perform an almost perfect natural gravitational sling-shot around the Moon before being ejected once again in a heliocentric orbit.

### Supported projections

* `lin`: Linear, 2D, top-down view from the north, works best for the inner planets
* `log`: Logarithmic, 2D, top-down view from the north, works best for huge differences in scale
* `sqrt`: Square Root law, 2D, top-down view from the north, works best for the main 8 planets
* `isolin`: Linear, isometric 3D view, 45° from the north, for highly inclined orbits around the inner planets
* `isosqrt`: Square Root law, isometric 3D view, 45° from the north, for the whole solar system

### Results


* Apollo 12 S-IVB stage
![Apollo 12 S-IVB stage](https://imgur.com/zT4lYws.gif)

* First phase of the Voyager 1 mission
![Voyager 1 part 1](https://imgur.com/4fx1SjT.gif)

* Second phase of the Voyager 1 mission
![Voyager 1 part 2](https://imgur.com/ctE6vUI.gif)
