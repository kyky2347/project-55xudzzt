# Particle filter

Particles approximate the filtering distribution $p(x_t \mid z_{1:t},u_{1:t})$ over walkable facility positions.

Prediction samples the movement model:

$$p(x_t \mid z_{1:t-1}) = \int p(x_t \mid x_{t-1},u_t)p(x_{t-1}\mid z_{1:t-1})\,dx$$

The requested direction succeeds with the difficulty's `motionCorrect` probability, stays in place with `motionStay`, and otherwise slips perpendicular with equal probability. Wall collisions remain in place.

Measurement updates use log weights to limit underflow:

$$\log \tilde w_t^i = \log w_{t-1}^i + \log p(z_t \mid x_t^i)$$

Subtracting the maximum finite log weight before exponentiation produces stable normalized weights. If all weights become invalid or zero, normalization returns a uniform distribution instead of NaN.

Effective sample size is $N_{eff}=1/\sum_i(w_i)^2$. When it falls below the configured fraction of particle count, systematic resampling draws one random offset and evenly spaced cumulative thresholds. The count is preserved and weights reset to $1/N$.

Displayed uncertainty bins particles by facility cell and computes:

$$H(X)=-\sum_x p(x)\log_2 p(x)$$
