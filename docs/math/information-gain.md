# Information gain

Actual information gain for a performed sensor action is:

$$IG=\max(0,H(p_{prior})-H(p_{posterior}))$$

The sensor rail's expected value is a Monte Carlo approximation. It samples candidate true positions from the current weighted particle distribution, simulates real observations through the selected sensor noise model, applies those likelihoods to copies of the prior, and averages the resulting posterior entropy across four outcomes:

$$EIG(a)\approx H(p)-\frac{1}{K}\sum_{k=1}^{K} H(p(x\mid z_k,a))$$

The Play UI translates this numerical value to low/medium/high while retaining the exact estimate in accessible labels. Lab and debrief expose numerical values.
