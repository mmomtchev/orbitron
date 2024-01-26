# Plot Halley's Comet from 1600 AD to 2200 AD

*Halley's Comet is currently near its aphelion at 35.14 AU which it reached on 9 December 2023*

Start by finding its id:

```shell
$ orbitron lookup --all halley
Halley 1978 UO, 1978 TE9, 1978 SH6, 1955 QN1, 2002688, J82H01G
		20002688
Halley 1982 U1, 1909 R1, 1835 P1, 1758 Y1, 1682 Q1, 1607 S1, 1531 P1, 1456 K1, 1378 S1, 1301 R1, 1222 R1, 1145 G1, 1066 G1, 989, 989 N1, 912, 912 J1, 837, 837 F1, 760, 760 K1, 684, 684 R1, 66, 607, 607 H1, 530, 530 Q1, 451, 451 L1, 374, 374 E1, 295, 295 J1, 218, 218 H1, 1986 III, 1982i, 1910 II, 1909c, 1835 III, 1759 I, 1682, 1607, 1531, 1456, 141, 141 F1, 1378, 1301, 1222, 1145, 1066, 66 B1, -11 Q1, -86 Q1, -163 U1, -86, -239 K1, -239, -163, -11, 4000001
		1000036
```

The first one is an asteroid, the comet is the second one. Use `DES%3D1000036` (use `%3D` for `=`):

```shell
$ orbitron animate --start 1601-01-01 --stop 2200-01-01 --days 100 \
  --out halley.gif --format gif --proj isosqrt --origin sun        \
  --body DES%3D1000036=white
```

you will get a list of the actual trajectories that JPL maintains, which are separate for each passage - as it is currently impossible to accurately predict its trajectory across different passages:

```
 Matching small-bodies: 

    Record #  Epoch-yr  >MATCH DESIG<  Primary Desig  Name  
    --------  --------  -------------  -------------  -------------------------
    90000001    -239    1000036        1P              Halley
    90000002    -163    1000036        1P              Halley
    90000003     -86    1000036        1P              Halley
    90000004     -11    1000036        1P              Halley
    90000005      66    1000036        1P              Halley
    90000006     141    1000036        1P              Halley
    90000007     218    1000036        1P              Halley
    90000008     295    1000036        1P              Halley
    90000009     374    1000036        1P              Halley
    90000010     451    1000036        1P              Halley
    90000011     530    1000036        1P              Halley
    90000012     607    1000036        1P              Halley
    90000013     684    1000036        1P              Halley
    90000014     760    1000036        1P              Halley
    90000015     837    1000036        1P              Halley
    90000016     912    1000036        1P              Halley
    90000017     989    1000036        1P              Halley
    90000018    1066    1000036        1P              Halley
    90000019    1145    1000036        1P              Halley
    90000020    1222    1000036        1P              Halley
    90000021    1301    1000036        1P              Halley
    90000022    1378    1000036        1P              Halley
    90000023    1456    1000036        1P              Halley
    90000024    1531    1000036        1P              Halley
    90000025    1607    1000036        1P              Halley
    90000026    1682    1000036        1P              Halley
    90000027    1759    1000036        1P              Halley
    90000028    1835    1000036        1P              Halley
    90000029    1910    1000036        1P              Halley
    90000030    1968    1000036        1P              Halley

 (30 matches. To SELECT, enter record # (integer), followed by semi-colon.)
*******************************************************************************
```

Select the last one:

```shell
$ orbitron animate --start 1601-01-01 --stop 2200-01-01 --days 100 \
  --out halley.gif --format gif --proj isosqrt --origin sun \
  --body 90000030=white --body jupiter --body sun
```

As the orbit is highly eccentric and its passage near the Sun is much faster, you will see it jump at each perihelion.

You will get much better results at slower speed (`--days 1`) and for a single passage.
