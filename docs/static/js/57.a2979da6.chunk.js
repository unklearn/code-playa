(this.webpackJsonpcodebook=this.webpackJsonpcodebook||[]).push([[57],{68:function(r,t,n){!function(r){"use strict";r.defineMode("http",(function(){function r(r,t){return r.skipToEnd(),t.cur=i,"error"}function t(t,e){return t.match(/^HTTP\/\d\.\d/)?(e.cur=n,"keyword"):t.match(/^[A-Z]+/)&&/[ \t]/.test(t.peek())?(e.cur=o,"keyword"):r(t,e)}function n(t,n){var o=t.match(/^\d+/);if(!o)return r(t,n);n.cur=e;var u=Number(o[0]);return u>=100&&u<200?"positive informational":u>=200&&u<300?"positive success":u>=300&&u<400?"positive redirect":u>=400&&u<500?"negative client-error":u>=500&&u<600?"negative server-error":"error"}function e(r,t){return r.skipToEnd(),t.cur=i,null}function o(r,t){return r.eatWhile(/\S/),t.cur=u,"string-2"}function u(t,n){return t.match(/^HTTP\/\d\.\d$/)?(n.cur=i,"keyword"):r(t,n)}function i(r){return r.sol()&&!r.eat(/[ \t]/)?r.match(/^.*?:/)?"atom":(r.skipToEnd(),"error"):(r.skipToEnd(),"string")}function c(r){return r.skipToEnd(),null}return{token:function(r,t){var n=t.cur;return n!=i&&n!=c&&r.eatSpace()?null:n(r,t)},blankLine:function(r){r.cur=c},startState:function(){return{cur:t}}}})),r.defineMIME("message/http","http")}(n(14))}}]);
//# sourceMappingURL=57.a2979da6.chunk.js.map