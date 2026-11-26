// node_modules/.pnpm/fflate@0.8.2/node_modules/fflate/esm/browser.js
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b = new u16(31);
  for (var i = 0; i < 31; ++i) {
    b[i] = start += 1 << eb[i - 1];
  }
  var r = new i32(b[30]);
  for (var i = 1; i < 30; ++i) {
    for (var j = b[i]; j < b[i + 1]; ++j) {
      r[j] = j - b[i] << 5 | i;
    }
  }
  return { b, r };
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >> 1 | (i & 21845) << 1;
  x = (x & 52428) >> 2 | (x & 13107) << 2;
  x = (x & 61680) >> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var x;
var i;
var hMap = (function(cd, mb, r) {
  var s = cd.length;
  var i = 0;
  var l = new u16(mb);
  for (; i < s; ++i) {
    if (cd[i])
      ++l[cd[i] - 1];
  }
  var le = new u16(mb);
  for (i = 1; i < mb; ++i) {
    le[i] = le[i - 1] + l[i - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        var sv = i << 4 | cd[i];
        var r_1 = mb - cd[i];
        var v = le[cd[i] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
      }
    }
  }
  return co;
});
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flm = /* @__PURE__ */ hMap(flt, 9, 0);
var fdm = /* @__PURE__ */ hMap(fdt, 5, 0);
var shft = function(p) {
  return (p + 7) / 8 | 0;
};
var slc = function(v, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  return new u8(v.subarray(s, e));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var wbits = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
};
var wbits16 = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
  d[o + 2] |= v >> 16;
};
var hTree = function(d, mb) {
  var t = [];
  for (var i = 0; i < d.length; ++i) {
    if (d[i])
      t.push({ s: i, f: d[i] });
  }
  var s = t.length;
  var t2 = t.slice();
  if (!s)
    return { t: et, l: 0 };
  if (s == 1) {
    var v = new u8(t[0].s + 1);
    v[t[0].s] = 1;
    return { t: v, l: 1 };
  }
  t.sort(function(a, b) {
    return a.f - b.f;
  });
  t.push({ s: -1, f: 25001 });
  var l = t[0], r = t[1], i0 = 0, i1 = 1, i2 = 2;
  t[0] = { s: -1, f: l.f + r.f, l, r };
  while (i1 != s - 1) {
    l = t[t[i0].f < t[i2].f ? i0++ : i2++];
    r = t[i0 != i1 && t[i0].f < t[i2].f ? i0++ : i2++];
    t[i1++] = { s: -1, f: l.f + r.f, l, r };
  }
  var maxSym = t2[0].s;
  for (var i = 1; i < s; ++i) {
    if (t2[i].s > maxSym)
      maxSym = t2[i].s;
  }
  var tr = new u16(maxSym + 1);
  var mbt = ln(t[i1 - 1], tr, 0);
  if (mbt > mb) {
    var i = 0, dt = 0;
    var lft = mbt - mb, cst = 1 << lft;
    t2.sort(function(a, b) {
      return tr[b.s] - tr[a.s] || a.f - b.f;
    });
    for (; i < s; ++i) {
      var i2_1 = t2[i].s;
      if (tr[i2_1] > mb) {
        dt += cst - (1 << mbt - tr[i2_1]);
        tr[i2_1] = mb;
      } else
        break;
    }
    dt >>= lft;
    while (dt > 0) {
      var i2_2 = t2[i].s;
      if (tr[i2_2] < mb)
        dt -= 1 << mb - tr[i2_2]++ - 1;
      else
        ++i;
    }
    for (; i >= 0 && dt; --i) {
      var i2_3 = t2[i].s;
      if (tr[i2_3] == mb) {
        --tr[i2_3];
        ++dt;
      }
    }
    mbt = mb;
  }
  return { t: new u8(tr), l: mbt };
};
var ln = function(n, l, d) {
  return n.s == -1 ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1)) : l[n.s] = d;
};
var lc = function(c) {
  var s = c.length;
  while (s && !c[--s])
    ;
  var cl = new u16(++s);
  var cli = 0, cln = c[0], cls = 1;
  var w = function(v) {
    cl[cli++] = v;
  };
  for (var i = 1; i <= s; ++i) {
    if (c[i] == cln && i != s)
      ++cls;
    else {
      if (!cln && cls > 2) {
        for (; cls > 138; cls -= 138)
          w(32754);
        if (cls > 2) {
          w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
          cls = 0;
        }
      } else if (cls > 3) {
        w(cln), --cls;
        for (; cls > 6; cls -= 6)
          w(8304);
        if (cls > 2)
          w(cls - 3 << 5 | 8208), cls = 0;
      }
      while (cls--)
        w(cln);
      cls = 1;
      cln = c[i];
    }
  }
  return { c: cl.subarray(0, cli), n: s };
};
var clen = function(cf, cl) {
  var l = 0;
  for (var i = 0; i < cl.length; ++i)
    l += cf[i] * cl[i];
  return l;
};
var wfblk = function(out, pos, dat) {
  var s = dat.length;
  var o = shft(pos + 2);
  out[o] = s & 255;
  out[o + 1] = s >> 8;
  out[o + 2] = out[o] ^ 255;
  out[o + 3] = out[o + 1] ^ 255;
  for (var i = 0; i < s; ++i)
    out[o + i + 4] = dat[i];
  return (o + 4 + s) * 8;
};
var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
  wbits(out, p++, final);
  ++lf[256];
  var _a2 = hTree(lf, 15), dlt = _a2.t, mlb = _a2.l;
  var _b2 = hTree(df, 15), ddt = _b2.t, mdb = _b2.l;
  var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
  var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
  var lcfreq = new u16(19);
  for (var i = 0; i < lclt.length; ++i)
    ++lcfreq[lclt[i] & 31];
  for (var i = 0; i < lcdt.length; ++i)
    ++lcfreq[lcdt[i] & 31];
  var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
  var nlcc = 19;
  for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
    ;
  var flen = bl + 5 << 3;
  var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
  var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
  if (bs >= 0 && flen <= ftlen && flen <= dtlen)
    return wfblk(out, p, dat.subarray(bs, bs + bl));
  var lm, ll, dm, dl;
  wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
  if (dtlen < ftlen) {
    lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
    var llm = hMap(lct, mlcb, 0);
    wbits(out, p, nlc - 257);
    wbits(out, p + 5, ndc - 1);
    wbits(out, p + 10, nlcc - 4);
    p += 14;
    for (var i = 0; i < nlcc; ++i)
      wbits(out, p + 3 * i, lct[clim[i]]);
    p += 3 * nlcc;
    var lcts = [lclt, lcdt];
    for (var it = 0; it < 2; ++it) {
      var clct = lcts[it];
      for (var i = 0; i < clct.length; ++i) {
        var len = clct[i] & 31;
        wbits(out, p, llm[len]), p += lct[len];
        if (len > 15)
          wbits(out, p, clct[i] >> 5 & 127), p += clct[i] >> 12;
      }
    }
  } else {
    lm = flm, ll = flt, dm = fdm, dl = fdt;
  }
  for (var i = 0; i < li; ++i) {
    var sym = syms[i];
    if (sym > 255) {
      var len = sym >> 18 & 31;
      wbits16(out, p, lm[len + 257]), p += ll[len + 257];
      if (len > 7)
        wbits(out, p, sym >> 23 & 31), p += fleb[len];
      var dst = sym & 31;
      wbits16(out, p, dm[dst]), p += dl[dst];
      if (dst > 3)
        wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
    } else {
      wbits16(out, p, lm[sym]), p += ll[sym];
    }
  }
  wbits16(out, p, lm[256]);
  return p + ll[256];
};
var deo = /* @__PURE__ */ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
var et = /* @__PURE__ */ new u8(0);
var dflt = function(dat, lvl, plvl, pre, post, st) {
  var s = st.z || dat.length;
  var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
  var w = o.subarray(pre, o.length - post);
  var lst = st.l;
  var pos = (st.r || 0) & 7;
  if (lvl) {
    if (pos)
      w[0] = st.r >> 3;
    var opt = deo[lvl - 1];
    var n = opt >> 13, c = opt & 8191;
    var msk_1 = (1 << plvl) - 1;
    var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
    var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
    var hsh = function(i2) {
      return (dat[i2] ^ dat[i2 + 1] << bs1_1 ^ dat[i2 + 2] << bs2_1) & msk_1;
    };
    var syms = new i32(25e3);
    var lf = new u16(288), df = new u16(32);
    var lc_1 = 0, eb = 0, i = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
    for (; i + 2 < s; ++i) {
      var hv = hsh(i);
      var imod = i & 32767, pimod = head[hv];
      prev[imod] = pimod;
      head[hv] = imod;
      if (wi <= i) {
        var rem = s - i;
        if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
          pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i - bs, pos);
          li = lc_1 = eb = 0, bs = i;
          for (var j = 0; j < 286; ++j)
            lf[j] = 0;
          for (var j = 0; j < 30; ++j)
            df[j] = 0;
        }
        var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
        if (rem > 2 && hv == hsh(i - dif)) {
          var maxn = Math.min(n, rem) - 1;
          var maxd = Math.min(32767, i);
          var ml = Math.min(258, rem);
          while (dif <= maxd && --ch_1 && imod != pimod) {
            if (dat[i + l] == dat[i + l - dif]) {
              var nl = 0;
              for (; nl < ml && dat[i + nl] == dat[i + nl - dif]; ++nl)
                ;
              if (nl > l) {
                l = nl, d = dif;
                if (nl > maxn)
                  break;
                var mmd = Math.min(dif, nl - 2);
                var md = 0;
                for (var j = 0; j < mmd; ++j) {
                  var ti = i - dif + j & 32767;
                  var pti = prev[ti];
                  var cd = ti - pti & 32767;
                  if (cd > md)
                    md = cd, pimod = ti;
                }
              }
            }
            imod = pimod, pimod = prev[imod];
            dif += imod - pimod & 32767;
          }
        }
        if (d) {
          syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
          var lin = revfl[l] & 31, din = revfd[d] & 31;
          eb += fleb[lin] + fdeb[din];
          ++lf[257 + lin];
          ++df[din];
          wi = i + l;
          ++lc_1;
        } else {
          syms[li++] = dat[i];
          ++lf[dat[i]];
        }
      }
    }
    for (i = Math.max(i, wi); i < s; ++i) {
      syms[li++] = dat[i];
      ++lf[dat[i]];
    }
    pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i - bs, pos);
    if (!lst) {
      st.r = pos & 7 | w[pos / 8 | 0] << 3;
      pos -= 7;
      st.h = head, st.p = prev, st.i = i, st.w = wi;
    }
  } else {
    for (var i = st.w || 0; i < s + lst; i += 65535) {
      var e = i + 65535;
      if (e >= s) {
        w[pos / 8 | 0] = lst;
        e = s;
      }
      pos = wfblk(w, pos + 1, dat.subarray(i, e));
    }
    st.i = s;
  }
  return slc(o, 0, pre + shft(pos) + post);
};
var crct = /* @__PURE__ */ (function() {
  var t = new Int32Array(256);
  for (var i = 0; i < 256; ++i) {
    var c = i, k = 9;
    while (--k)
      c = (c & 1 && -306674912) ^ c >>> 1;
    t[i] = c;
  }
  return t;
})();
var crc = function() {
  var c = -1;
  return {
    p: function(d) {
      var cr = c;
      for (var i = 0; i < d.length; ++i)
        cr = crct[cr & 255 ^ d[i]] ^ cr >>> 8;
      c = cr;
    },
    d: function() {
      return ~c;
    }
  };
};
var dopt = function(dat, opt, pre, post, st) {
  if (!st) {
    st = { l: 1 };
    if (opt.dictionary) {
      var dict = opt.dictionary.subarray(-32768);
      var newDat = new u8(dict.length + dat.length);
      newDat.set(dict);
      newDat.set(dat, dict.length);
      dat = newDat;
      st.w = dict.length;
    }
  }
  return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
};
var mrg = function(a, b) {
  var o = {};
  for (var k in a)
    o[k] = a[k];
  for (var k in b)
    o[k] = b[k];
  return o;
};
var wbytes = function(d, b, v) {
  for (; v; ++b)
    d[b] = v, v >>>= 8;
};
function deflateSync(data, opts) {
  return dopt(data, opts || {}, 0, 0);
}
var fltn = function(d, p, t, o) {
  for (var k in d) {
    var val = d[k], n = p + k, op = o;
    if (Array.isArray(val))
      op = mrg(o, val[1]), val = val[0];
    if (val instanceof u8)
      t[n] = [val, op];
    else {
      t[n += "/"] = [new u8(0), op];
      fltn(val, n, t, o);
    }
  }
};
var te = typeof TextEncoder != "undefined" && /* @__PURE__ */ new TextEncoder();
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}
function strToU8(str, latin1) {
  if (latin1) {
    var ar_1 = new u8(str.length);
    for (var i = 0; i < str.length; ++i)
      ar_1[i] = str.charCodeAt(i);
    return ar_1;
  }
  if (te)
    return te.encode(str);
  var l = str.length;
  var ar = new u8(str.length + (str.length >> 1));
  var ai = 0;
  var w = function(v) {
    ar[ai++] = v;
  };
  for (var i = 0; i < l; ++i) {
    if (ai + 5 > ar.length) {
      var n = new u8(ai + 8 + (l - i << 1));
      n.set(ar);
      ar = n;
    }
    var c = str.charCodeAt(i);
    if (c < 128 || latin1)
      w(c);
    else if (c < 2048)
      w(192 | c >> 6), w(128 | c & 63);
    else if (c > 55295 && c < 57344)
      c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i) & 1023, w(240 | c >> 18), w(128 | c >> 12 & 63), w(128 | c >> 6 & 63), w(128 | c & 63);
    else
      w(224 | c >> 12), w(128 | c >> 6 & 63), w(128 | c & 63);
  }
  return slc(ar, 0, ai);
}
var exfl = function(ex) {
  var le = 0;
  if (ex) {
    for (var k in ex) {
      var l = ex[k].length;
      if (l > 65535)
        err(9);
      le += l + 4;
    }
  }
  return le;
};
var wzh = function(d, b, f, fn, u, c, ce, co) {
  var fl2 = fn.length, ex = f.extra, col = co && co.length;
  var exl = exfl(ex);
  wbytes(d, b, ce != null ? 33639248 : 67324752), b += 4;
  if (ce != null)
    d[b++] = 20, d[b++] = f.os;
  d[b] = 20, b += 2;
  d[b++] = f.flag << 1 | (c < 0 && 8), d[b++] = u && 8;
  d[b++] = f.compression & 255, d[b++] = f.compression >> 8;
  var dt = new Date(f.mtime == null ? Date.now() : f.mtime), y = dt.getFullYear() - 1980;
  if (y < 0 || y > 119)
    err(10);
  wbytes(d, b, y << 25 | dt.getMonth() + 1 << 21 | dt.getDate() << 16 | dt.getHours() << 11 | dt.getMinutes() << 5 | dt.getSeconds() >> 1), b += 4;
  if (c != -1) {
    wbytes(d, b, f.crc);
    wbytes(d, b + 4, c < 0 ? -c - 2 : c);
    wbytes(d, b + 8, f.size);
  }
  wbytes(d, b + 12, fl2);
  wbytes(d, b + 14, exl), b += 16;
  if (ce != null) {
    wbytes(d, b, col);
    wbytes(d, b + 6, f.attrs);
    wbytes(d, b + 10, ce), b += 14;
  }
  d.set(fn, b);
  b += fl2;
  if (exl) {
    for (var k in ex) {
      var exf = ex[k], l = exf.length;
      wbytes(d, b, +k);
      wbytes(d, b + 2, l);
      d.set(exf, b + 4), b += 4 + l;
    }
  }
  if (col)
    d.set(co, b), b += col;
  return b;
};
var wzf = function(o, b, c, d, e) {
  wbytes(o, b, 101010256);
  wbytes(o, b + 8, c);
  wbytes(o, b + 10, c);
  wbytes(o, b + 12, d);
  wbytes(o, b + 16, e);
};
function zipSync(data, opts) {
  if (!opts)
    opts = {};
  var r = {};
  var files = [];
  fltn(data, "", r, opts);
  var o = 0;
  var tot = 0;
  for (var fn in r) {
    var _a2 = r[fn], file = _a2[0], p = _a2[1];
    var compression = p.level == 0 ? 0 : 8;
    var f = strToU8(fn), s = f.length;
    var com = p.comment, m = com && strToU8(com), ms = m && m.length;
    var exl = exfl(p.extra);
    if (s > 65535)
      err(11);
    var d = compression ? deflateSync(file, p) : file, l = d.length;
    var c = crc();
    c.p(file);
    files.push(mrg(p, {
      size: file.length,
      crc: c.d(),
      c: d,
      f,
      m,
      u: s != fn.length || m && com.length != ms,
      o,
      compression
    }));
    o += 30 + s + exl + l;
    tot += 76 + 2 * (s + exl) + (ms || 0) + l;
  }
  var out = new u8(tot + 22), oe = o, cdl = tot - o;
  for (var i = 0; i < files.length; ++i) {
    var f = files[i];
    wzh(out, f.o, f, f.f, f.u, f.c.length);
    var badd = 30 + f.f.length + exfl(f.extra);
    out.set(f.c, f.o + badd);
    wzh(out, o, f, f.f, f.u, f.c.length, f.o, f.m), o += 16 + badd + (f.m ? f.m.length : 0);
  }
  wzf(out, o, files.length, cdl, oe);
  return out;
}

// src/lib/monthlyPptx.ts
var EMU = 914400;
var esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
var fmt = (n) => new Intl.NumberFormat("th-TH", { maximumFractionDigits: 1 }).format(n);
var monthName = (s) => {
  const [y, m] = s.split("-").map(Number);
  return new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
};
function shape(id, x, y, w, h, text = "", o = {}) {
  const geom = o.radius ? "roundRect" : "rect";
  const fill = o.fill ? `<a:solidFill><a:srgbClr val="${o.fill}"/></a:solidFill>` : "<a:noFill/>";
  const line2 = o.line ? `<a:ln w="12700"><a:solidFill><a:srgbClr val="${o.line}"/></a:solidFill></a:ln>` : "<a:ln><a:noFill/></a:ln>";
  const paras = text.split("\n").map((t, i) => `<a:p><a:pPr algn="${o.align || "l"}"/><a:r><a:rPr lang="th-TH" sz="${o.size || 1600}"${o.bold ? ' b="1"' : ""}><a:solidFill><a:srgbClr val="${o.color || "153C63"}"/></a:solidFill><a:latin typeface="Tahoma"/><a:ea typeface="Tahoma"/><a:cs typeface="Tahoma"/></a:rPr><a:t xml:space="preserve">${esc(t)}</a:t></a:r><a:endParaRPr lang="th-TH" sz="${o.size || 1600}"/></a:p>`).join("");
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="Shape ${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${Math.round(x * EMU)}" y="${Math.round(y * EMU)}"/><a:ext cx="${Math.round(w * EMU)}" cy="${Math.round(h * EMU)}"/></a:xfrm><a:prstGeom prst="${geom}"><a:avLst/></a:prstGeom>${fill}${line2}</p:spPr><p:txBody><a:bodyPr wrap="square" anchor="${o.valign || "ctr"}" lIns="90000" rIns="90000" tIns="40000" bIns="40000"/><a:lstStyle/>${paras || '<a:p><a:endParaRPr lang="th-TH"/></a:p>'}</p:txBody></p:sp>`;
}
function line(id, x, y, w, h, color = "D7E4F1") {
  const left = x + Math.min(0, w);
  const top = y + Math.min(0, h);
  const width = Math.max(1 / EMU, Math.abs(w));
  const height = Math.max(1 / EMU, Math.abs(h));
  const flipH = w < 0 ? ' flipH="1"' : "";
  const flipV = h < 0 ? ' flipV="1"' : "";
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="Line ${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm${flipH}${flipV}><a:off x="${Math.round(left * EMU)}" y="${Math.round(top * EMU)}"/><a:ext cx="${Math.max(1, Math.round(width * EMU))}" cy="${Math.max(1, Math.round(height * EMU))}"/></a:xfrm><a:prstGeom prst="line"><a:avLst/></a:prstGeom><a:ln w="19050"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill></a:ln></p:spPr></p:sp>`;
}
function slideXml(content) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${content}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
}
function footer(month, page) {
  return shape(99, 0.6, 7.16, 12.1, 0.18, `JRTL-PMS  \xB7  ${month}  \xB7  ${page}`, { size: 850, color: "71849A" });
}
function downloadMonthlyPptx(d) {
  let id = 10;
  const S = (x, y, w, h, text, o = {}) => shape(id++, x, y, w, h, text, o);
  const slides = [];
  const machineLabel = d.machine || "\u0E17\u0E38\u0E01\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07";
  let c = S(0.65, 0.45, 12, 0.4, "JRTL \xB7 PRODUCTION MANAGEMENT", { size: 1200, bold: true, color: "2878D0" });
  c += S(0.65, 1.05, 12, 0.75, "\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E2A\u0E23\u0E38\u0E1B\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E1C\u0E25\u0E34\u0E15\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E40\u0E14\u0E37\u0E2D\u0E19", { size: 3e3, bold: true, color: "123E68" });
  c += S(0.68, 1.85, 11.8, 0.5, `${monthName(d.month)} (${d.month})  |  ${machineLabel}`, { size: 1900, color: "526B83" });
  c += S(0.68, 2.45, 11.8, 0.35, `\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E16\u0E36\u0E07 ${d.created}  \xB7  \u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22 OEE \u0E2D\u0E49\u0E32\u0E07\u0E2D\u0E34\u0E07\u0E2A\u0E39\u0E15\u0E23\u0E23\u0E30\u0E1A\u0E1A`, { size: 1100, color: "73869A" });
  const kpis = [
    ["OEE \u0E42\u0E14\u0E22\u0E23\u0E27\u0E21", d.oee === null ? "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25" : `${(d.oee * 100).toFixed(1)}%`],
    ["\u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15\u0E23\u0E27\u0E21", `${fmt(d.output)} \u0E0A\u0E34\u0E49\u0E19`],
    ["\u0E07\u0E32\u0E19\u0E14\u0E35 / \u0E07\u0E32\u0E19\u0E40\u0E2A\u0E35\u0E22", `${fmt(d.good)} / ${fmt(d.ng)} \u0E0A\u0E34\u0E49\u0E19`],
    ["\u0E40\u0E14\u0E34\u0E19\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07 / \u0E2B\u0E22\u0E38\u0E14", `${fmt(d.run)} / ${fmt(d.downtime)} \u0E19\u0E32\u0E17\u0E35`]
  ];
  kpis.forEach(([label, value], i) => {
    const x = 0.68 + i * 3.08;
    c += S(x, 3.25, 2.86, 1.35, "", { fill: "F1F7FC", line: "D1E3F2", radius: true });
    c += S(x + 0.12, 3.42, 2.62, 0.3, label, { size: 1150, color: "526B83" });
    c += S(x + 0.12, 3.8, 2.62, 0.55, value, { size: 2050, bold: true, color: "123E68" });
  });
  c += S(0.68, 5.05, 11.9, 0.75, `\u0E20\u0E32\u0E1E\u0E23\u0E27\u0E21: \u0E1C\u0E25\u0E34\u0E15\u0E44\u0E14\u0E49 ${fmt(d.output)} \u0E0A\u0E34\u0E49\u0E19 (${fmt(d.good)} \u0E07\u0E32\u0E19\u0E14\u0E35, ${fmt(d.ng)} \u0E07\u0E32\u0E19\u0E40\u0E2A\u0E35\u0E22) \xB7 OEE ${d.oee === null ? "\u0E22\u0E31\u0E07\u0E04\u0E33\u0E19\u0E27\u0E13\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49" : `${(d.oee * 100).toFixed(1)}%`}`, { size: 1600, color: "153C63", fill: "F8FAFC", line: "D7E4F1", radius: true });
  c += footer(d.month, 1);
  slides.push(slideXml(c));
  c = S(0.58, 0.32, 12.2, 0.48, "\u0E41\u0E19\u0E27\u0E42\u0E19\u0E49\u0E21\u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15\u0E41\u0E25\u0E30 OEE / Production Trend", { size: 2250, bold: true, color: "123E68" });
  c += S(0.6, 0.84, 12, 0.28, `\u0E22\u0E49\u0E2D\u0E19\u0E2B\u0E25\u0E31\u0E07 6 \u0E40\u0E14\u0E37\u0E2D\u0E19 \xB7 ${machineLabel} \xB7 \u0E41\u0E17\u0E48\u0E07\u0E2A\u0E35\u0E19\u0E49\u0E33\u0E40\u0E07\u0E34\u0E19 = Output, \u0E40\u0E2A\u0E49\u0E19\u0E2A\u0E35\u0E2A\u0E49\u0E21 = OEE`, { size: 1050, color: "60758B" });
  c += line(4, 0.6, 1.22, 12.1, 0, "2878D0");
  const chartX = 1.05, chartY = 1.65, chartW = 10.9, chartH = 4.45;
  const maxOut = Math.max(1, ...d.trend.map((t) => t.total));
  [0, 0.25, 0.5, 0.75, 1].forEach((v, i) => {
    const y = chartY + chartH * (1 - v);
    c += line(id++, chartX, y, chartW, 0, "E3EBF3");
    c += S(0.58, y - 0.1, 0.4, 0.2, fmt(maxOut * v), { size: 800, align: "r", color: "6F8398" });
  });
  const points = [];
  d.trend.forEach((t, i) => {
    const cx = chartX + (i + 0.5) * chartW / Math.max(d.trend.length, 1);
    const bh = t.total / maxOut * (chartH * 0.82);
    c += S(cx - 0.28, chartY + chartH - bh, 0.56, bh, "", { fill: "4C91D6", radius: true });
    c += S(cx - 0.55, chartY + chartH + 0.08, 1.1, 0.28, t.month.slice(5) + "/" + t.month.slice(0, 4), { size: 850, align: "ctr", color: "526B83" });
    c += S(cx - 0.65, chartY + chartH - bh - 0.28, 1.3, 0.22, fmt(t.total), { size: 850, bold: true, align: "ctr", color: "123E68" });
    if (t.oee !== null) points.push([cx, chartY + chartH * (1 - Math.min(1, Math.max(0, t.oee)))]);
  });
  points.forEach(([x, y], i) => {
    c += S(x - 0.07, y - 0.07, 0.14, 0.14, "", { fill: "F28C28", radius: true });
    if (i) c += line(id++, points[i - 1][0], points[i - 1][1], x - points[i - 1][0], y - points[i - 1][1], "F28C28");
    c += S(x - 0.4, y - 0.32, 0.8, 0.18, `${(d.trend.filter((t) => t.oee !== null)[i]?.oee || 0) * 100 | 0}%`, { size: 800, align: "ctr", color: "B86612" });
  });
  c += S(0.7, 6.45, 11.9, 0.4, `\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01 ${d.month}: OEE ${d.oee === null ? "\u2014" : `${(d.oee * 100).toFixed(1)}%`}  \xB7  \u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15 ${fmt(d.output)} \u0E0A\u0E34\u0E49\u0E19  \xB7  \u0E07\u0E32\u0E19\u0E14\u0E35 ${fmt(d.good)}  \xB7  \u0E07\u0E32\u0E19\u0E40\u0E2A\u0E35\u0E22 ${fmt(d.ng)}`, { size: 1200, bold: true, color: "153C63" });
  c += footer(d.month, 2);
  slides.push(slideXml(c));
  c = S(0.58, 0.32, 12.2, 0.48, "\u0E04\u0E38\u0E13\u0E20\u0E32\u0E1E\u0E41\u0E25\u0E30\u0E07\u0E32\u0E19\u0E40\u0E2A\u0E35\u0E22 / Quality & Defects", { size: 2250, bold: true, color: "123E68" });
  c += S(0.6, 0.84, 12, 0.28, `\u0E2A\u0E23\u0E38\u0E1B\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E07\u0E32\u0E19\u0E40\u0E2A\u0E35\u0E22\u0E23\u0E32\u0E22\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E41\u0E22\u0E01\u0E15\u0E32\u0E21\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17 Part \xB7 \u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22\u0E07\u0E32\u0E19\u0E40\u0E2A\u0E35\u0E22 ${d.defectTarget === null ? "\u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38" : `${d.defectTarget}%`}`, { size: 1050, color: "60758B" });
  c += line(4, 0.6, 1.22, 12.1, 0, "2878D0");
  const totalNg = Math.max(1, ...d.defectCategories.map((v) => v.ng));
  d.defectCategories.forEach((cat, i) => {
    const y = 1.75 + i * 0.86;
    c += S(0.8, y, 2.3, 0.35, cat.label, { size: 1350, bold: true, color: "153C63" });
    c += S(3.25, y, 7.5, 0.38, "", { fill: "EDF2F7", radius: true });
    c += S(3.25, y, 7.5 * cat.ng / totalNg, 0.38, "", { fill: ["2878D0", "ED8B32", "20A36B", "98A5B3"][i % 4], radius: true });
    c += S(10.95, y, 1.4, 0.35, `${fmt(cat.ng)} \u0E0A\u0E34\u0E49\u0E19`, { size: 1250, bold: true, align: "r", color: "153C63" });
  });
  c += S(0.8, 5.45, 5.5, 0.88, `\u0E07\u0E32\u0E19\u0E40\u0E2A\u0E35\u0E22\u0E23\u0E27\u0E21
${fmt(d.ng)} \u0E0A\u0E34\u0E49\u0E19`, { size: 1800, bold: true, fill: "FFF5F4", line: "F1D3CF", radius: true });
  c += S(6.55, 5.45, 5.5, 0.88, `\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E07\u0E32\u0E19\u0E40\u0E2A\u0E35\u0E22\u0E23\u0E27\u0E21
${d.good + d.ng ? `${(d.ng / (d.good + d.ng) * 100).toFixed(2)}%` : "\u2014"}`, { size: 1800, bold: true, fill: "F1F7FC", line: "D1E3F2", radius: true });
  c += S(0.8, 6.5, 11.5, 0.35, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38: \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E08\u0E31\u0E1A\u0E04\u0E39\u0E48 Part No. \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E27\u0E21\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E2B\u0E21\u0E27\u0E14 \u201C\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E2B\u0E21\u0E27\u0E14\u201D", { size: 950, color: "71849A" });
  c += footer(d.month, 3);
  slides.push(slideXml(c));
  c = S(0.58, 0.32, 12.2, 0.48, "\u0E40\u0E27\u0E25\u0E32\u0E2A\u0E39\u0E0D\u0E40\u0E2A\u0E35\u0E22\u0E41\u0E25\u0E30\u0E41\u0E1C\u0E19\u0E1B\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E38\u0E07 / Losses & Actions", { size: 2250, bold: true, color: "123E68" });
  c += S(0.6, 0.84, 12, 0.28, `\u0E2A\u0E32\u0E40\u0E2B\u0E15\u0E38\u0E40\u0E27\u0E25\u0E32\u0E2B\u0E22\u0E38\u0E14\u0E41\u0E25\u0E30\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E38\u0E07\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E43\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19 ${d.month} \xB7 ${machineLabel}`, { size: 1050, color: "60758B" });
  c += line(4, 0.6, 1.22, 12.1, 0, "2878D0");
  c += S(0.75, 1.45, 5.4, 0.35, "\u0E40\u0E27\u0E25\u0E32\u0E2B\u0E22\u0E38\u0E14\u0E41\u0E22\u0E01\u0E15\u0E32\u0E21\u0E2A\u0E32\u0E40\u0E2B\u0E15\u0E38 (\u0E19\u0E32\u0E17\u0E35)", { size: 1450, bold: true, color: "153C63" });
  const lossMax = Math.max(1, ...d.losses.map((v) => v.minutes));
  d.losses.slice(0, 6).forEach((loss, i) => {
    const y = 1.95 + i * 0.54;
    c += S(0.8, y, 1.7, 0.28, loss.label, { size: 1e3, color: "526B83" });
    c += S(2.55, y, 2.65, 0.24, "", { fill: "EDF2F7", radius: true });
    c += S(2.55, y, 2.65 * loss.minutes / lossMax, 0.24, "", { fill: "2878D0", radius: true });
    c += S(5.25, y, 0.85, 0.28, fmt(loss.minutes), { size: 1e3, align: "r", color: "153C63" });
  });
  if (!d.losses.length) c += S(0.8, 2, 5.2, 0.45, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E27\u0E25\u0E32\u0E2A\u0E39\u0E0D\u0E40\u0E2A\u0E35\u0E22\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E43\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49", { size: 1100, color: "526B83" });
  c += S(6.55, 1.45, 5.8, 0.35, `\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E38\u0E07 (${d.actions.length})`, { size: 1450, bold: true, color: "153C63" });
  const acts = d.actions.slice(0, 5);
  acts.forEach((a2, i) => {
    const y = 1.95 + i * 0.88;
    c += S(6.55, y, 5.8, 0.72, `${a2.topic} \xB7 ${a2.status}
${a2.machine || "\u0E17\u0E38\u0E01\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07"} | ${a2.owner || "\u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E1C\u0E34\u0E14\u0E0A\u0E2D\u0E1A"} | ${a2.date}
\u0E1B\u0E31\u0E0D\u0E2B\u0E32: ${a2.problem || "\u2014"}  /  \u0E41\u0E01\u0E49\u0E44\u0E02: ${a2.correction || "\u2014"}`, { size: 950, fill: i % 2 ? "FFFFFF" : "F5F8FB", line: "D7E4F1", valign: "t" });
  });
  if (!acts.length) c += S(6.55, 1.95, 5.8, 0.65, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E38\u0E07\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E43\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49", { size: 1100, color: "526B83", fill: "F5F8FB", line: "D7E4F1" });
  c += footer(d.month, 4);
  slides.push(slideXml(c));
  const tableSlide = (title, subtitle, headers, rows, page) => {
    let body = S(0.58, 0.32, 12.2, 0.48, title, { size: 2250, bold: true, color: "123E68" });
    body += S(0.6, 0.84, 12, 0.28, subtitle, { size: 1050, color: "60758B" });
    body += line(4, 0.6, 1.22, 12.1, 0, "2878D0");
    const x = 0.68, y = 1.52, widths = headers.length === 5 ? [4.4, 1.8, 1.8, 1.8, 1.8] : [2.2, 4.8, 1.1, 1.1, 1.1, 1.1, 1.1];
    let cx = x;
    headers.forEach((h, i) => {
      body += S(cx, y, widths[i], 0.48, h, { size: 1e3, bold: true, color: "FFFFFF", fill: "2878D0", line: "FFFFFF", align: i > 1 ? "r" : "l" });
      cx += widths[i];
    });
    rows.forEach((row, ri) => {
      let px = x;
      const py = y + 0.49 + ri * 0.39;
      const bg = ri % 2 ? "F4F8FC" : "FFFFFF";
      row.forEach((cell, i) => {
        body += S(px, py, widths[i], 0.38, cell, { size: 900, color: "153C63", fill: bg, line: "E1EAF2", align: i > (headers.length === 5 ? 0 : 1) ? "r" : "l" });
        px += widths[i];
      });
    });
    if (!rows.length) body += S(0.8, 2, 11.5, 0.5, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E01\u0E32\u0E23\u0E1C\u0E25\u0E34\u0E15\u0E43\u0E19\u0E0A\u0E48\u0E27\u0E07\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01", { size: 1200, color: "60758B" });
    body += footer(d.month, page);
    slides.push(slideXml(body));
  };
  const machinePages = Math.max(1, Math.ceil(d.machineBreakdown.length / 13));
  for (let page = 0; page < machinePages; page++) {
    const rows = d.machineBreakdown.slice(page * 13, (page + 1) * 13).map((v, i) => [v.machine, fmt(v.good), fmt(v.ng), fmt(v.test), fmt(v.output)]);
    tableSlide(`\u0E2A\u0E23\u0E38\u0E1B\u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15\u0E41\u0E22\u0E01\u0E15\u0E32\u0E21\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E08\u0E31\u0E01\u0E23${machinePages > 1 ? ` (${page + 1}/${machinePages})` : ""} / Output by Machine`, `${d.month} \xB7 ${machineLabel} \xB7 \u0E40\u0E23\u0E35\u0E22\u0E07\u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15\u0E23\u0E27\u0E21\u0E08\u0E32\u0E01\u0E21\u0E32\u0E01\u0E44\u0E1B\u0E19\u0E49\u0E2D\u0E22`, ["\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E08\u0E31\u0E01\u0E23 / Machine", "\u0E07\u0E32\u0E19\u0E14\u0E35 / Good", "\u0E07\u0E32\u0E19\u0E40\u0E2A\u0E35\u0E22 / NG", "\u0E17\u0E14\u0E2A\u0E2D\u0E1A / Test", "\u0E23\u0E27\u0E21 / Output"], rows, slides.length + 1);
  }
  const partPages = Math.max(1, Math.ceil(d.partBreakdown.length / 13));
  for (let page = 0; page < partPages; page++) {
    const rows = d.partBreakdown.slice(page * 13, (page + 1) * 13).map((v) => [v.machine, `${v.part}${v.step ? ` \xB7 ${v.step}` : ""}`, fmt(v.good), fmt(v.ng), fmt(v.test), fmt(v.output), v.output > 0 ? `${(v.ng / v.output * 100).toFixed(1)}%` : "\u2014"]);
    tableSlide(`\u0E2A\u0E23\u0E38\u0E1B\u0E1C\u0E25\u0E1C\u0E25\u0E34\u0E15\u0E41\u0E22\u0E01\u0E15\u0E32\u0E21\u0E0A\u0E34\u0E49\u0E19\u0E07\u0E32\u0E19${partPages > 1 ? ` (${page + 1}/${partPages})` : ""} / Output by Part`, `${d.month} \xB7 \u0E41\u0E2A\u0E14\u0E07\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E08\u0E31\u0E01\u0E23 \u0E0A\u0E34\u0E49\u0E19\u0E07\u0E32\u0E19 \u0E41\u0E25\u0E30\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19 \xB7 ${machineLabel}`, ["\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07 / Machine", "\u0E0A\u0E34\u0E49\u0E19\u0E07\u0E32\u0E19 / Part \xB7 Step", "\u0E07\u0E32\u0E19\u0E14\u0E35", "\u0E07\u0E32\u0E19\u0E40\u0E2A\u0E35\u0E22", "\u0E17\u0E14\u0E2A\u0E2D\u0E1A", "\u0E23\u0E27\u0E21", "NG %"], rows, slides.length + 1);
  }
  const files = {
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>${slides.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join("")}</Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>`),
    "ppt/presentation.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join("")}</p:sldIdLst><p:sldSz cx="12192000" cy="6858000" type="screen16x9"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle><a:defPPr><a:defRPr lang="th-TH"/></a:defPPr></p:defaultTextStyle></p:presentation>`),
    "ppt/_rels/presentation.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>${slides.map((_, i) => `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`).join("")}</Relationships>`),
    "ppt/slideMasters/slideMaster1.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMap accent1="2878D0" accent2="ED8B32" accent3="20A36B" accent4="98A5B3" accent5="123E68" accent6="71849A" bg1="lt1" bg2="lt2" tx1="dk1" tx2="dk2" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="1" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>`),
    "ppt/slideMasters/_rels/slideMaster1.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`),
    "ppt/slideLayouts/slideLayout1.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a masterClrMapping="1"/></p:clrMapOvr></p:sldLayout>`),
    "ppt/slideLayouts/_rels/slideLayout1.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`),
    "ppt/theme/theme1.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="JRTL"><a:themeElements><a:clrScheme name="JRTL"><a:dk1><a:srgbClr val="123E68"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="153C63"/></a:dk2><a:lt2><a:srgbClr val="F1F7FC"/></a:lt2><a:accent1><a:srgbClr val="2878D0"/></a:accent1><a:accent2><a:srgbClr val="ED8B32"/></a:accent2><a:accent3><a:srgbClr val="20A36B"/></a:accent3><a:accent4><a:srgbClr val="98A5B3"/></a:accent4><a:accent5><a:srgbClr val="123E68"/></a:accent5><a:accent6><a:srgbClr val="71849A"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="JRTL"><a:majorFont><a:latin typeface="Tahoma"/><a:ea typeface="Tahoma"/><a:cs typeface="Tahoma"/></a:majorFont><a:minorFont><a:latin typeface="Tahoma"/><a:ea typeface="Tahoma"/><a:cs typeface="Tahoma"/></a:minorFont></a:fontScheme><a:fmtScheme name="JRTL"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`)
  };
  slides.forEach((xml, i) => {
    files[`ppt/slides/slide${i + 1}.xml`] = strToU8(xml);
    files[`ppt/slides/_rels/slide${i + 1}.xml.rels`] = strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>`);
  });
  const packed = zipSync(files, { level: 6 });
  const buffer = new ArrayBuffer(packed.byteLength);
  new Uint8Array(buffer).set(packed);
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `monthly-production-${d.month}.pptx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3e3);
}

// src/monthlyPptxRuntime.ts
var numeric = (value) => {
  const first = String(value || "").match(/-?[\d,]+(?:\.\d+)?/)?.[0] || "0";
  const parsed = Number(first.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
};
var monthAt = (month, delta) => {
  const [year, index] = month.split("-").map(Number);
  return new Date(Date.UTC(year, index - 1 + delta, 1)).toISOString().slice(0, 7);
};
function findProductionLogs(report) {
  const fiberKey = Object.keys(report).find((key) => key.startsWith("__reactFiber$"));
  if (!fiberKey) return [];
  let node = report[fiberKey];
  while (node?.return) node = node.return;
  const stack = [node];
  const seen = /* @__PURE__ */ new Set();
  let best = [];
  while (stack.length) {
    const fiber = stack.pop();
    if (!fiber || seen.has(fiber)) continue;
    seen.add(fiber);
    for (const props of [fiber.memoizedProps, fiber.pendingProps]) {
      const rows = props?.logs;
      if (Array.isArray(rows) && rows.length > best.length && rows.some((row) => row && typeof row.date === "string" && typeof row.machineName === "string" && "goodQty" in row)) best = rows;
    }
    if (fiber.sibling) stack.push(fiber.sibling);
    if (fiber.child) stack.push(fiber.child);
  }
  return best;
}
function readReport(report) {
  const controls = report.querySelector("header .mr-controls");
  const month = controls?.querySelector('input[type="month"]')?.value || (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
  const machine = controls?.querySelector("select")?.value || "";
  const kpis = Array.from(report.querySelectorAll(".mr-kpis > div")).map((el) => el.querySelector("strong")?.textContent?.trim() || "");
  const defect = report.querySelector('[aria-label="Monthly defect chart"]');
  const tables = Array.from(defect?.querySelectorAll("table") || []);
  const table = tables.find((t) => t.querySelector("tbody tr th")?.textContent?.includes("\u0E07\u0E32\u0E19\u0E40\u0E2A\u0E35\u0E22"));
  const headerCells = Array.from(table?.querySelectorAll("thead th") || []).map((el) => el.textContent?.trim() || "");
  const selectedIndex = headerCells.findIndex((value, i) => i > 0 && Number(value) === Number(month.slice(5)));
  const cellIndex = Math.max(1, selectedIndex);
  const dataRows = Array.from(table?.querySelectorAll("tbody tr") || []);
  const rowValue = (startsWith) => {
    const row = dataRows.find((r) => (r.querySelector("th")?.textContent || "").trim().toLocaleLowerCase().includes(startsWith.toLocaleLowerCase()));
    return row?.querySelectorAll("th,td")[cellIndex]?.textContent?.trim() || "";
  };
  const defectCategories = [
    ["AUTO PART", "\u0E0A\u0E34\u0E49\u0E19\u0E2A\u0E48\u0E27\u0E19\u0E23\u0E16\u0E22\u0E19\u0E15\u0E4C / Auto Part"],
    ["ELECTRONICS", "\u0E2D\u0E34\u0E40\u0E25\u0E47\u0E01\u0E17\u0E23\u0E2D\u0E19\u0E34\u0E01\u0E2A\u0E4C / Electronics"],
    ["BOX", "\u0E01\u0E25\u0E48\u0E2D\u0E07 / Box"],
    ["UNMATCHED", "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E2B\u0E21\u0E27\u0E14 / Unmatched"]
  ].map(([key, label]) => ({ label, ng: numeric(rowValue(key)) }));
  const ng = numeric(rowValue("\u0E07\u0E32\u0E19\u0E40\u0E2A\u0E35\u0E22\u0E23\u0E27\u0E21"));
  const good = Math.max(0, numeric(kpis[1]) - ng);
  const targetInput = defect?.querySelector('input[type="number"]');
  const defectTarget = targetInput && targetInput.value !== "" ? Number(targetInput.value) : null;
  const defectYear = month.slice(0, 4);
  const monthlyTotals = /* @__PURE__ */ new Map();
  const totalRow = dataRows.find((r) => (r.querySelector("th")?.textContent || "").includes("\u0E07\u0E32\u0E19\u0E14\u0E35 + \u0E07\u0E32\u0E19\u0E40\u0E2A\u0E35\u0E22"));
  if (totalRow) {
    const cells = Array.from(totalRow.querySelectorAll("th,td"));
    headerCells.forEach((head, i) => {
      if (i > 0 && Number(head) >= 1 && Number(head) <= 12) monthlyTotals.set(`${defectYear}-${String(Number(head)).padStart(2, "0")}`, numeric(cells[i]?.textContent));
    });
  }
  const oeeTrend = /* @__PURE__ */ new Map();
  report.querySelectorAll(".mr-trend > div").forEach((el) => {
    const label = el.querySelector("span")?.textContent?.trim() || "";
    const value = el.querySelector("strong")?.textContent?.trim() || "";
    const key = /^\d{4}-\d{2}$/.test(label) ? label : "";
    const percent = Number(value.replace("%", "")) / 100;
    if (key && Number.isFinite(percent)) oeeTrend.set(key, percent);
  });
  const trend = Array.from({ length: 6 }, (_, i) => monthAt(month, i - 5)).map((key) => ({ month: key, oee: oeeTrend.get(key) ?? null, total: monthlyTotals.get(key) || 0 }));
  const losses = Array.from(report.querySelectorAll(".mr-charts > section:first-child .mr-bar")).map((el) => ({
    label: el.querySelector("span")?.textContent?.trim() || "\u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38",
    minutes: numeric(el.querySelector("b")?.textContent)
  }));
  const actions = Array.from(report.querySelectorAll(".mr-actions:first-of-type .mr-table tbody tr")).filter((row) => row.querySelectorAll("td").length > 1).map((row) => {
    const cells = Array.from(row.querySelectorAll("td")).map((cell) => cell.innerText.trim());
    return { date: cells[0]?.split("\n")[0] || "", machine: cells[0]?.split("\n")[1] || "", topic: cells[1]?.split("\n")[0] || "", problem: cells[1]?.split("\n").slice(1).join(" ") || "", correction: cells[2] || "", owner: cells[3]?.split("\n")[0] || "", status: cells[6] || "", result: cells[5] || "" };
  });
  const productionLogs = findProductionLogs(report).filter((row) => row.date?.slice(0, 7) === month && row.date <= (report.querySelector(".mr-scope")?.textContent?.match(/(?:ถึง|through)\s*(\d{4}-\d{2}-\d{2})/)?.[1] || "9999-12-31") && (!machine || row.machineName === machine));
  const machineMap = /* @__PURE__ */ new Map();
  const partMap = /* @__PURE__ */ new Map();
  for (const row of productionLogs) {
    const good2 = Number(row.goodQty) || 0, ngQty = Number(row.ngQty) || 0, test = Number(row.testQty) || 0, output = good2 + ngQty + test;
    const m = machineMap.get(row.machineName) || { machine: row.machineName, good: 0, ng: 0, test: 0, output: 0 };
    m.good += good2;
    m.ng += ngQty;
    m.test += test;
    m.output += output;
    machineMap.set(row.machineName, m);
    const part = row.partNo || row.productName || "\u0E44\u0E21\u0E48\u0E23\u0E30\u0E1A\u0E38\u0E0A\u0E34\u0E49\u0E19\u0E07\u0E32\u0E19", step = row.step || "";
    const key = `${row.machineId || row.machineName}|${part}|${step}`;
    const p = partMap.get(key) || { machine: row.machineName, part, step, good: 0, ng: 0, test: 0, output: 0 };
    p.good += good2;
    p.ng += ngQty;
    p.test += test;
    p.output += output;
    partMap.set(key, p);
  }
  return {
    month,
    machine,
    created: report.querySelector(".mr-scope")?.textContent?.match(/\d{4}-\d{2}-\d{2}/)?.[0] || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    oee: kpis[0]?.includes("%") ? numeric(kpis[0]) / 100 : null,
    output: numeric(kpis[1]),
    good,
    ng,
    run: numeric(kpis[2]),
    downtime: numeric(kpis[3]),
    trend,
    losses,
    defectTarget,
    defectCategories,
    actions,
    machineBreakdown: Array.from(machineMap.values()).sort((a, b) => b.output - a.output),
    partBreakdown: Array.from(partMap.values()).sort((a, b) => a.machine.localeCompare(b.machine, "th") || b.output - a.output)
  };
}
function mount() {
  document.querySelectorAll(".monthly-report").forEach((report) => {
    const controls = report.querySelector("header .mr-controls");
    if (!controls || controls.querySelector("[data-monthly-pptx]")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.monthlyPptx = "true";
    button.textContent = "\u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14 PowerPoint";
    button.setAttribute("aria-label", "\u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E40\u0E14\u0E37\u0E2D\u0E19 PowerPoint");
    button.addEventListener("click", () => downloadMonthlyPptx(readReport(report)));
    const pdf = Array.from(controls.querySelectorAll("button")).find((b) => b.textContent?.includes("PDF"));
    if (pdf) pdf.before(button);
    else controls.append(button);
  });
}
mount();
new MutationObserver(mount).observe(document.documentElement, { childList: true, subtree: true });

