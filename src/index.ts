import * as React from "react";
import {Player} from "ractive-player";

export {KaTeXReady} from "../lib/KaTeX";

import {KTX as KTXNonBlocking} from "../lib/KaTeX";

const KTXBlocking = React.forwardRef((
  props: React.ComponentProps<typeof KTXNonBlocking>,
  ref: React.MutableRefObject<React.ElementRef<typeof KTXNonBlocking>>
) => {
  const player = React.useContext(Player.Context);
  const innerRef = React.useRef<React.ElementRef<typeof KTXNonBlocking>>();
  if (ref) {
    ref.current = innerRef.current;
  }

  /* obstruction nonsense */
  const resolve = React.useRef(null);
  React.useMemo(() => {
    const promise = new Promise((res, rej) => {
      resolve.current = res;
    });
    player.obstruct("canplay", promise);
    player.obstruct("canplaythrough", promise);
  }, []);

  React.useEffect(() => {
    if (ref) {
      ref.current = innerRef.current;
    }
    innerRef.current.ready.then(() => resolve.current());
  }, []);
  return (<KTXNonBlocking ref={innerRef} {...props}/>);
});
// const KTXBlocking = KTXNonBlocking;

export {
  KTXBlocking as KTX, KTXBlocking, KTXNonBlocking
};
