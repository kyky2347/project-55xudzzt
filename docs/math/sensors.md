# Sensor likelihoods

## Passive structural audio

Four cardinal ranges use Gaussian error with a default σ of 4.8 cells, 28% independent dropout, and a 9% false-return component drawn from a wider Gaussian. It costs no energy and emits 0.4 signal.

## Short ping

Cardinal surface ranges use σ 2.4, 12% dropout, and 3.5% false returns. It costs 3 energy and emits 9 signal.

## Active sonar

Cardinal surface ranges extend to 20 cells with σ 0.72, 2.5% dropout, and 0.8% false returns. It costs 12 energy and emits 42 signal.

For every valid range $z_j$ at a candidate position $x$, the independent measurement likelihood multiplies Gaussian densities around the ray-cast range $r_j(x)$:

$$p(z\mid x)=\prod_j \mathcal N(z_j;r_j(x),\sigma^2)$$

## Beacon triangulation

The nearest beacon produces:

$$RSSI(x) = -34 - 10(2.05)\log_{10}(\max(1,d(x,b))) + \epsilon$$

with $\epsilon\sim\mathcal N(0,\sigma^2)$ and default σ 3.6 dB. The particle likelihood is the Gaussian density of observed RSSI around the candidate prediction. It costs 5 energy and emits 15 signal.
