# Directional confidence and at least 465 actual executions

The user authorized fixing the confidence overlay and completing the test.
Confidence now means probability that the model's predicted direction is right
at the next close. This is an explicit change from after-cost profit probability.
Costs are still fully charged in P&L. Keep the 55%/60%/70% gates for 1x/2x/3x.

Raw score: the model quantile CDF at the current close, in its median direction.
Calibrate on the last 300 forecast origins whose outcomes exit strictly before
the current entry. Use ten fixed width-0.1 bins, Beta(1,1) posterior mean
(wins+1)/(n+2), minimum support 20. A sparse bin backs off to all valid non-flat
predictions in that past window; total support below 20 yields probability 0.5.
Zero realized moves count as failures. No scores are clamped to an observed
training range. Update counts only as completed past observations become usable.
The same price-direction probability controls all exposure levels; leverage
cannot change the probability of the price direction. Choose highest level
whose fixed gate is passed, otherwise cash. Unchanged forecast medians skip.

Also record the probability of positive net P&L at each level, using the same
causal histogram method, as a separate diagnostic. It does not control the
direction-confidence policy or get relabeled as forecast confidence.

Run nine independent case streams, each chronologically from the earliest
eligible test origin after 250 context observations and 300 calibration origins,
with one-bar embargo. Advance 128 bars per active case per round. Stop after
the first complete round with at least 465 unique executions combined, or when
all available data are exhausted. This is a sample count across separate quote-
currency accounts, not a globally synchronized shared portfolio. Skips never
count as executions. No forced passes, duplicated trades or resampling.

Model, fees, financing, borrow and same-close paper fills remain unchanged.
The method definition changed after earlier test results were inspected. This
is retrospective strategy research with possible model-training overlap, not
a clean prospective validation. All previous experiments remain preserved.
