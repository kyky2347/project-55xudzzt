# Procedural generation

The generator starts from an all-wall 48 × 48 field and performs a seeded constrained dig from the center until roughly 42% of cells are connected floor. Occasional rectangular excavations produce rooms and loops while the walk creates corridors, necks, and misleading return paths. The boundary remains sealed.

All floor cells belong to the initial connected component by construction. Breadth-first distance maps then select a player start and place the Hunter, three unique cores, and extraction in distant valid regions. Beacons and recharge points use remaining unique floor cells. Tests run graph traversal from the player start and assert every objective and spawn is on floor and reachable.

Facility generation uses a stream forked from `<seed>:facility`; simulation noise uses `<seed>:simulation`, preventing rendering or UI work from perturbing the map.
