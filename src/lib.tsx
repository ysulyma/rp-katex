/// <reference types="katex" />
import * as EventEmitter from "events";
import * as React from "react";
import {ReactChild, ReactNode} from "react";
import * as matchAll from "string.prototype.matchall";

declare global {
  var katex: typeof katex;
}

const KaTeXLoad = new Promise<typeof katex>((resolve, reject) => {
  const script = document.getElementById("js-async-katex") as HTMLScriptElement;
  if (!script) return;

  if (window.hasOwnProperty("katex")) {
    resolve(katex);
    // MathJax.Hub.Register.StartupHook("LoadHead Ready", () => resolve(MathJax));
  } else {
    script.addEventListener("load", () => resolve(katex));
  }
});

const KaTeXMacros = new Promise<{[key: string]: string;}>((resolve, reject) => {
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

export const KaTeXReady = Promise.all([KaTeXLoad, KaTeXMacros]);

interface Props extends React.HTMLAttributes<HTMLSpanElement> {
  display?: boolean;
  // renderer?: "HTML-CSS" | "CommonHTML" | "PreviewHTML" | "NativeMML" | "SVG" | "PlainSource";
}

interface Handle {
  domElement: HTMLSpanElement;
  ready: Promise<void>;
}

const implementation: React.RefForwardingComponent<Handle, Props> = function KTX(props, ref) {
  const spanRef = React.useRef<HTMLSpanElement>();
  const {children, display, ...attrs} = props;
  const resolveRef = React.useRef<() => void>();
  const ready = React.useMemo(() => {
    return new Promise<void>((resolve, reject) => {
      resolveRef.current = resolve;
    });
  }, []);

  React.useImperativeHandle(ref, () => ({
    domElement: spanRef.current,
    ready
  }));

  React.useEffect(() => {
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
export const KTX = React.forwardRef(implementation);

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
  };
  return macros;
}
