# Hunter inference

The Hunter maintains a categorical probability over every walkable facility cell. Between observations, a persistence/diffusion transition leaves 46% of a cell's mass in place and distributes the remainder across traversable neighbors.

An emitted signal applies a Gaussian spatial likelihood centered on the player's actual emission source. The Hunter does not receive exact coordinates: likelihood width is inversely related to signature and configured sensitivity:

$$\sigma_h=\max(1.2,\frac{12}{1+(s/12)\alpha})$$

The posterior is normalized and becomes the basis for target selection. Most target changes choose maximum posterior mass; a controlled exploration branch samples among the top 8%. A shortest-path search moves through actual walkable geometry one step per logical tick. Quiet, disturbance, searching, hunting, and contact labels combine posterior concentration, recent signature, and close physical evidence without revealing the exact Hunter position to Play.
