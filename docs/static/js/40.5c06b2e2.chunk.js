(this.webpackJsonpcodebook=this.webpackJsonpcodebook||[]).push([[40],{45:function(e,n,i){!function(e){"use strict";e.defineMode("diff",(function(){var e={"+":"positive","-":"negative","@":"meta"};return{token:function(n){var i=n.string.search(/[\t ]+?$/);if(!n.sol()||0===i)return n.skipToEnd(),("error "+(e[n.string.charAt(0)]||"")).replace(/ $/,"");var o=e[n.peek()]||n.skipToEnd();return-1===i?n.skipToEnd():n.pos=i,o}}})),e.defineMIME("text/x-diff","diff")}(i(14))}}]);
//# sourceMappingURL=40.5c06b2e2.chunk.js.map