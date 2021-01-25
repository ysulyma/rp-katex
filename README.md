# rp-katex

[KaTeX](https://katex.org/) plugin for [ractive-player](https://www.npmjs.com/package/ractive-player).

## Usage

```tsx
import {KTX} from "rp-katex";

function Quadratic() {
  return (
    <div>
      The value of <KTX>x</KTX> is given by the quadratic formula
      <KTX display>{String.raw`x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`}</KTX>
    </div>
  );
}
```
