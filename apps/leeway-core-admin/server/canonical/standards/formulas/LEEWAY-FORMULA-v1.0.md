# LEEWAY-FORMULA-v1.0

objectId: `LEEWAY_STANDARDS::FORMULA::LEEWAY-FORMULA-v1.0`

status: `FROZEN_VERIFIED`

frozenAt: `2026-08-11T22:17:00`

frozenBy: `creator (Leonard Lee) via opencode session`

verifiedBy: `exact-rational BigInt verification (no float, no pi, no rounding) — LEEWAY_FORMULA_V1_PASS 2026-08-11T22:17`

verificationReceipt: `receipts/leeway-formula/leeway-formula-v1-golden-verification-20260811-221700.json`

This document is the authoritative specification. The Runtime Fabric engine (`leeway-formula/v1/`) implements these definitions without reinterpretation. Adapters may change. The formula does not. Any formula change becomes `LEEWAY-FORMULA-v1.1` or later.

---

## 1. Candidate Universe

Ω = {0, 1, 2, ..., 69}

Ω is **not** the six columns and is **not** the sixteen rows.

Every candidate x ∈ Ω is independently evaluated against the complete 16×6 historical window.

|Ω| = 70 candidates.

---

## 2. Golden Input

The authoritative decimal golden matrix is:

```text
5,9,35,54,63,7
14,20,59,60,61,25
8,30,41,48,54,4
6,17,27,48,50,5
30,36,40,42,57,2
6,26,46,58,65,25
3,4,24,36,47,17
4,5,22,50,58,1
2,9,44,53,59,8
9,14,44,50,56,3
2,7,18,29,38,16
5,25,36,40,48,3
8,10,14,45,59,5
12,29,37,43,55,18
17,44,63,66,67,4
17,38,46,50,69,20
```

It contains 96 cells and ΣX = 2908. Therefore:

μ = 2908/96 = 727/24

No intermediate rounding of μ is permitted.

---

## 3. Occurrence Rows

For candidate x, define:

T_t(x) = [τ_1, τ_2, ..., τ_n]

where 1 ≤ τ_1 < τ_2 < ... < τ_n ≤ 16 are the distinct chronological row numbers in which x occurs.

A candidate appearing multiple times in one row counts once for occurrence-row dynamics.

---

## 4. Feature Vector

Φ_t(x) = [F_t(x), G_t(x), R_t(x), P_t(x), v_t(x), a_t(x), D_t(x), H_t(x), C_t(x), φ_t(x)]

The following are the sole permitted definitions.

### Feature 1 — Frequency

F_t(x) = total number of cells in the 16×6 matrix equal to x.

Counts cells, not merely rows.

### Feature 2 — Gap

If n ≥ 1: G_t(x) = 16 − τ_n

If the candidate never appeared: G_t(x) = 16

### Feature 3 — Recency

If n ≥ 1: R_t(x) = τ_n / 16

If unseen: R_t(x) = 0

### Feature 4 — Positional Stability

For each coordinate j ∈ {1,2,3,4,5,6}:

c_j(x) = Σ_{τ=1}^{16} 1[x_{τ,j} = x]

Then:

P_t(x) = max_j c_j(x) / F_t(x) if F_t(x) > 0, else 0

P_t measures repeated positional concentration. Do not substitute frequency.

### Feature 5 — Velocity

Velocity means latest inter-arrival interval, not numerical-value change.

If n ≥ 2: v_t(x) = τ_n − τ_{n−1}

Otherwise: v_t(x) = 0

### Feature 6 — Acceleration

If n ≥ 3: a_t(x) = (τ_n − τ_{n−1}) − (τ_{n−1} − τ_{n−2})

Otherwise: a_t(x) = 0

No other velocity or acceleration definitions are permitted.

### Feature 7 — Displacement

Using the exact global mean μ = 727/24:

D_t(x) = |x − 727/24|

### Feature 8 — Hamiltonian-Like Feature

H_t(x) = ½ v_t(x)² + ½ D_t(x)²

No additional coefficient is permitted.

### Feature 9 — Repeated Co-Occurrence

For every x ≠ y:

Pair_t(x,y) = Σ_{τ=1}^{16} 1[x ∈ X_τ ∧ y ∈ X_τ]

Then:

C_t(x) = Σ_{y ∈ Ω, y ≠ x} 1[Pair_t(x,y) ≥ 2]

C_t(x) is the number of distinct candidates that appeared with x in at least two separate rows. Do not substitute total co-occurrence or 5·F(x).

### Feature 10 — Phase

Phase driver:

Q_t(x) = v_t(x) + a_t(x) + D_t(x) + R_t(x) + G_t(x)

Normalize Q_t across all 70 candidates:

q_t(x) = Norm_Ω(Q_t(x))

Then:

φ_t(x) = 2π · q_t(x)

For the normalized phase term participating in the LeeWay score: Norm_Ω(φ_t(x)) = q_t(x), because multiplication by the positive constant 2π does not alter min-max normalization. Do not approximate π for candidate ranking.

---

## 5. Canonical Normalization

Every feature is independently min-max normalized across all 70 candidates:

z_min = min_{y∈Ω} z(y)
z_max = max_{y∈Ω} z(y)

Norm_Ω(z(x)) = (z(x) − z_min) / (z_max − z_min) if z_max ≠ z_min, else 0

Norm_Ω: Φ → [0,1]. This is min-max normalization. It is not Z-score normalization.

---

## 6. Canonical LeeWay Score

Feature order is permanently: F, G, R, P, v, a, D, H, C, φ.

Every feature has exactly equal weight: w_k = 1/10.

S_t(x) = (1/10) · [N_F(x) + N_G(x) + N_R(x) + N_P(x) + N_v(x) + N_a(x) + N_D(x) + N_H(x) + N_C(x) + N_φ(x)]

where N_k(x) = Norm_Ω(Φ_{t,k}(x)).

Do not round before ranking. Use exact rational arithmetic wherever possible.

---

## 7. Softmax

p_t(x) = e^{S_t(x)} / Σ_{y∈Ω} e^{S_t(y)}

Softmax acts on the 70 canonical candidate scores. Because exp is strictly increasing, S_t(a) > S_t(b) ⟺ p_t(a) > p_t(b). Exact S_t(x) determines authoritative ranking; softmax produces the probability representation but does not alter candidate order.

---

## 8. Canonical Tie Breaking

Candidates are ordered by: S↓ → F↓ → R↓ → P↓ → x↑.

Equivalently: K_t(x) = (−S_t(x), −F_t(x), −R_t(x), −P_t(x), x).

No other tie-break rule is permitted.

---

## 9. Final Output Rule

There is **no additional 0..69 quantization formula**. The candidate universe is already Ω = {0,...,69}. The output values are the actual candidate values x.

X̂_17 = Top_6^↓ { p_t(x) : x ∈ Ω }

Preserve ranking order. Do not calculate round(score × 69), floor(score × 69), rank mapping, and do not treat the six columns as the six candidates. The six winners are simply the six highest-ranked x values from Ω.

---

## 10. Base64 Codec

RFC 4648 Base64 alphabet as the digit alphabet:

```text
ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/
```

A=0, B=1, ..., /=63. For integer x, encode its ordinary positional base-64 representation with this alphabet and no leading zero digit.

4 ↔ E, 50 ↔ y, 59 ↔ 7, 63 ↔ /, and since 69 = 1(64)+5: 69 ↔ BF.
Likewise 64 ↔ BA, 65 ↔ BB, 66 ↔ BC, 67 ↔ BD, 68 ↔ BE.

---

## 11. Complete LeeWay Formula

LW_t = { (x, B64(x)) : x ∈ Top_6^↓ [ Softmax_{x∈Ω} ( (1/10) Σ_{k=1}^{10} Norm_Ω(Φ_{t,k}(x)) ) ] }

with Φ_t(x) = [F, G, R, P, v, a, D, H, C, φ].

---

## 12. Frozen Golden Vector

LW_{v1.0}(X_golden) = [4, 50, 63, 59, 48, 69]

B64(LW_{v1.0}(X_golden)) = [E, y, /, 7, w, BF]

Canonical boot/self-test assertion:

```text
DECIMAL_STATE=4,50,63,59,48,69
BASE64_STATE=E,y,/,7,w,BF
```

If the implementation does not reproduce this exact ordered result from this exact matrix and these exact feature definitions, the status must be `LEEWAY_FORMULA_V1_BLOCKED` and formula-governed decisions must be refused. The implementation must fail closed. It must not modify the formula in order to force the golden result.

---

## Revision Record

| Rev | Date | Change | By |
|---|---|---|---|
| v1.0 initial | 2026-08-11 | Frozen as provided by creator; golden vector independently re-verified with exact rational arithmetic (all 10 features) and confirmed PASS | Creator + Agent Lee (diagnostic) |

No formula definition was modified. An earlier provisional "BLOCKED" finding (receipt 220716) was traced to a verification-script bug (F and C features silently normalized to zero) and superseded by receipt 221700.
