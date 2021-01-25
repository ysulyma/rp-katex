/// <reference types="katex" />

import * as React from "react";
import {forwardRef, useEffect,useImperativeHandle, useMemo, useRef} from "react";

import {usePlayer} from "ractive-player";

declare global {
  const katex: typeof katex;
}

// option of loading KaTeX asynchronously
const KaTeXLoad = new Promise<typeof katex>((resolve) => {
  const script = document.getElementById("js-async-katex") as HTMLScriptElement;
  if (!script) return;

  if (window.hasOwnProperty("katex")) {
    resolve(katex);
  } else {
    script.addEventListener("load", () => resolve(katex));
  }
});

// load macros from <head>
const KaTeXMacros = new Promise<{[key: string]: string;}>((resolve) => {
  const macros: {[key: string]: string;} = {};
  const scripts: HTMLScriptElement[] = Array.from(document.querySelectorAll("head > script[type='math/tex']"));
  return Promise.all(
    scripts.map(script =>
      fetch(script.src)
      .then(res => {
        if (res.ok)
          return res.text();
        throw new Error(`${res.status} ${res.statusText}: ${script.src}`);
      })
      .then(tex => {
        Object.assign(macros, parseMacros(tex));
      })
    )
  ).then(() => resolve(macros));
});

// ready Promise
const KaTeXReady = Promise.all([KaTeXLoad, KaTeXMacros]);

interface Props extends React.HTMLAttributes<HTMLSpanElement> {
  display?: boolean;
}

interface Handle {
  domElement: HTMLSpanElement;
  ready: Promise<void>;
}

// blocking version
const implementation: React.RefForwardingComponent<Handle, Props> = function KTX(props, ref) {
  const spanRef = React.useRef<HTMLSpanElement>();
  const {children, display, ...attrs} = props;
  const resolveRef = useRef<() => void>();

  const ready = useMemo(() => {
    return new Promise<void>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  // handle
  useImperativeHandle(ref, () => ({
    domElement: spanRef.current,
    ready
  }));

  useEffect(() => {
    KaTeXReady.then(([katex, macros]) => {
      katex.render(children.toString(), spanRef.current, {
        displayMode: !!display,
        macros,
        strict: "ignore",
        throwOnError: false,
        trust: true
      });
      resolveRef.current();
    });
  }, [children]);

  // Google Chrome fails without this
  if (display) {
    if (!attrs.style)
      attrs.style = {};
    attrs.style.display = "block";
  }

  return (
    <span {...attrs} ref={spanRef}/>
  );
};

const KTXNonBlocking = React.forwardRef(implementation);

/**
Parse \newcommand macros in a file.
Also supports \ktxnewcommand (for use in conjunction with MathJax).
*/
function parseMacros(file: string) {
  const macros = {};
  const rgx = /\\(?:ktx)?newcommand\{(.+?)\}(?:\[\d+\])?\{/g;
  let match: RegExpExecArray;
  
  while (match = rgx.exec(file)) {
    let body = "";

    const macro = match[1];
    let braceCount = 1;

    for (let i = match.index + match[0].length; (braceCount > 0) && (i < file.length); ++i) {
      const char = file[i];
      if (char === "{") {
        braceCount++;
      } else if (char === "}") {
        braceCount--;
        if (braceCount === 0)
          break;
      } else if (char === "\\") {
        body += file.slice(i, i+2);
        ++i;
        continue;
      }
      body += char;
    }
    macros[macro] = body;
  }
  return macros;
}

// blocking version
const KTXBlocking = forwardRef(function KTX(
  props: React.ComponentProps<typeof KTXNonBlocking>,
  ref: React.MutableRefObject<React.ElementRef<typeof KTXNonBlocking>>
) {
  const player = usePlayer();
  const innerRef = useRef<React.ElementRef<typeof KTXNonBlocking>>();
  if (ref) {
    ref.current = innerRef.current;
  }

  /* obstruction nonsense */
  const resolve = useRef(null);
  useMemo(() => {
    const promise = new Promise((res) => {
      resolve.current = res;
    });
    player.obstruct("canplay", promise);
    player.obstruct("canplaythrough", promise);
  }, []);

  useEffect(() => {
    if (ref) {
      ref.current = innerRef.current;
    }
    innerRef.current.ready.then(() => resolve.current());
  }, []);

  return (<KTXNonBlocking ref={innerRef} {...props}/>);
});

// exports
export {KTXBlocking as KTX, KTXBlocking, KTXNonBlocking, KaTeXReady};
