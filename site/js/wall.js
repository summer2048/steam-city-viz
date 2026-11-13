// WebGL2 renderer: one instanced quad per game, three blendable layouts, three texture LODs.
const VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 aCorner;
layout(location=1) in vec4 aA;
layout(location=2) in vec4 aB;
layout(location=3) in vec4 aC;
layout(location=4) in vec4 aMeta;   // dataIdx, yearf, tier, rnd
layout(location=5) in vec4 aHi;     // uv rect in hi atlas
layout(location=6) in float aHiTex; // 0 none, 1 lod1, 2 lod2
layout(location=7) in vec3 aCol;
uniform vec2 uView; uniform vec3 uCam;
uniform float uT, uPop, uAB, uBC, uDim0, uDim1, uTop, uMinPx;
uniform vec3 uMouse;
out vec2 vUV; out vec2 vHiUV; flat out float vHiTex; flat out float vIdx; flat out vec3 vCol;
flat out float vPx; flat out float vDim; out vec2 vLocal; flat out vec2 vSizePx;
float ease(float t){ return t*t*t*(t*(t*6.-15.)+10.); }
void main(){
  float rnd = aMeta.w;
  float e1 = ease(clamp(uAB*1.5 - rnd*0.5, 0., 1.));
  float e2 = ease(clamp(uBC*1.5 - rnd*0.5, 0., 1.));
  vec4 L = mix(mix(aA, aB, e1), aC, e2);
  // gentle arc while travelling between layouts
  float arc = sin(e1*3.14159)*(1.-e2) + sin(e2*3.14159);
  L.xy += vec2(sin(rnd*40.), cos(rnd*57.)) * arc * 40.;
  vec2 size = L.zw;
  float rv = clamp((uT - aMeta.y)/uPop, 0., 1.);
  rv = 1. - pow(1.-rv, 3.);
  size *= rv;
  size *= mix(vec2(1.09,1.17), vec2(1.), smoothstep(1.5, 5., size.y*uCam.z)); // close the gaps once tiles are dust
  float tier = aMeta.z;
  float dim = tier < 0.5 ? max(uDim0, uDim1) : (tier < 1.5 ? uDim1 : 0.);
  // lit top-tier tiles never shrink below a few pixels, so they read as stars
  if (tier > 1.5) size = mix(size, max(size, vec2(2.14,1.)*uMinPx/uCam.z), uTop*rv);
  if (uMouse.z > 0.) {
    vec2 dd = L.xy - uMouse.xy; float f = exp(-dot(dd,dd)/(uMouse.z*uMouse.z));
    L.xy += dd*f*0.9; size *= 1. + f*1.6;
  }
  vec2 world = L.xy + (aCorner-0.5)*size;
  vec2 clip = (world - uCam.xy)*uCam.z/(uView*0.5);
  gl_Position = vec4(clip, 0., 1.);
  float asp = L.z/max(L.w,1e-4);
  vec2 crop = vec2(min(1., asp/2.14), min(1., 2.14/asp));
  vec2 uv = 0.5 + (vec2(aCorner.x, 1.-aCorner.y)-0.5)*crop;
  vUV = uv; vHiUV = mix(aHi.xy, aHi.zw, uv);
  vHiTex = aHiTex; vIdx = aMeta.x; vCol = aCol; vPx = size.y*uCam.z; vDim = dim;
  vLocal = aCorner; vSizePx = size*uCam.z;
}`;
const FS = `#version 300 es
precision highp float;
uniform sampler2D uL0, uL1, uL2;
uniform float uGlobal;
in vec2 vUV; in vec2 vHiUV; flat in float vHiTex; flat in float vIdx; flat in vec3 vCol;
flat in float vPx; flat in float vDim; in vec2 vLocal; flat in vec2 vSizePx;
out vec4 o;
void main(){
  float col = mod(vIdx, 256.), row = floor(vIdx/256.);
  vec2 uv0 = (vec2(col,row) + clamp(vUV, vec2(0.5/8.,0.5/4.), vec2(7.5/8.,3.5/4.))) * vec2(8.,4.)/2048.;
  vec3 c = mix(vCol, texture(uL0, uv0).rgb, smoothstep(2., 5., vPx));
  vec3 h1 = texture(uL1, vHiUV).rgb, h2 = texture(uL2, vHiUV).rgb;
  if (vHiTex > 0.5) c = mix(c, vHiTex < 1.5 ? h1 : h2, smoothstep(5., 11., vPx));
  float l = dot(c, vec3(.2126,.7152,.0722));
  c = max(mix(vec3(l), c, 1. + 0.35*(1.-smoothstep(2., 7., vPx))), 0.); // far away, let the spectrum sing
  c = mix(c, vec3(l)*0.07 + vec3(0.012,0.012,0.016), vDim);
  // soft rounded corners once tiles are large enough to see them
  vec2 p = (abs(vLocal-0.5)*2.)*vSizePx*0.5; vec2 hs = vSizePx*0.5; float r = min(6., min(hs.x,hs.y)*0.12);
  vec2 q = p - (hs - r); float dist = length(max(q,0.)) - r;
  float a = 1. - smoothstep(-0.75, 0.75, dist);
  if (min(vSizePx.x, vSizePx.y) < 10.) a = 1.;
  o = vec4(c*uGlobal*a, a);
}`;

const BG_VS = `#version 300 es
layout(location=0) in vec2 aCorner; out vec2 vUv;
void main(){ vUv = aCorner; gl_Position = vec4(aCorner*2.-1., 0., 1.); }`;
const BG_FS = `#version 300 es
precision highp float;
uniform sampler2D uGlow; uniform vec2 uView; uniform float uTime, uGlowAmt; uniform vec3 uC1, uC2;
in vec2 vUv; out vec4 o;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*noise(p); p=p*2.03+7.1; a*=.5; } return s; }
void main(){
  vec2 q = vUv*vec2(uView.x/uView.y, 1.); float t = uTime*0.035;
  float n1 = fbm(q*1.25 + vec2(t, -t*0.7)), n2 = fbm(q*1.05 + vec2(-t*0.8, t*0.5) + 5.2);
  vec3 c = vec3(0.026,0.026,0.034) + uC1*smoothstep(.32,.8,n1) + uC2*smoothstep(.38,.85,n2);
  vec3 g = textureLod(uGlow, vUv, 3.0).rgb*0.45 + textureLod(uGlow, vUv, 5.0).rgb*0.9; // light spilling off the covers
  c += g*uGlowAmt;
  c += (hash(gl_FragCoord.xy + fract(uTime)*91.) - .5)*0.02; // film grain
  o = vec4(c, 1.);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

export class Wall {
  constructor(canvas, data, layouts, images, meta) {
    const gl = (this.gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' }));
    if (!gl) throw new Error('WebGL2 not available');
    this.canvas = canvas; this.n = data.n;
    const prog = (this.prog = gl.createProgram());
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS)); gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    const bg = (this.bg = gl.createProgram());
    gl.attachShader(bg, compile(gl, gl.VERTEX_SHADER, BG_VS)); gl.attachShader(bg, compile(gl, gl.FRAGMENT_SHADER, BG_FS));
    gl.linkProgram(bg);
    if (!gl.getProgramParameter(bg, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(bg));
    this.ub = {};
    for (const k of ['uGlow', 'uView', 'uTime', 'uGlowAmt', 'uC1', 'uC2']) this.ub[k] = gl.getUniformLocation(bg, k);
    this.glowTex = gl.createTexture(); this.fbo = gl.createFramebuffer();
    gl.useProgram(prog);
    this.u = {};
    for (const k of ['uView', 'uCam', 'uT', 'uPop', 'uAB', 'uBC', 'uDim0', 'uDim1', 'uTop', 'uMinPx', 'uMouse', 'uGlobal', 'uL0', 'uL1', 'uL2'])
      this.u[k] = gl.getUniformLocation(prog, k);

    // draw order: date order, with the top tier last (ascending reviews) so the biggest sit on top
    const { n, tier, rev, yearf, hi, rgb } = data;
    const order = new Uint32Array(n); let k = 0; const tops = [];
    for (let i = 0; i < n; i++) if (tier[i] === 2) tops.push(i); else order[k++] = i;
    tops.sort((a, b) => rev[a] - rev[b]); for (const i of tops) order[k++] = i;

    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const buf = (loc, arr, size, div, norm = false, type = gl.FLOAT) => {
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, type, norm, 0, 0); gl.vertexAttribDivisor(loc, div);
    };
    buf(0, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), 2, 0);
    const perm = (src, w) => { const o = new src.constructor(n * w); for (let j = 0; j < n; j++) for (let c = 0; c < w; c++) o[j * w + c] = src[order[j] * w + c]; return o; };
    buf(1, perm(layouts[0], 4), 4, 1); buf(2, perm(layouts[1], 4), 4, 1); buf(3, perm(layouts[2], 4), 4, 1);
    const m = new Float32Array(n * 4), hr = new Float32Array(n * 4), ht = new Float32Array(n);
    const L1 = meta.lod1, S = 4096;
    for (let j = 0; j < n; j++) {
      const i = order[j];
      m[j * 4] = i; m[j * 4 + 1] = yearf[i]; m[j * 4 + 2] = tier[i];
      m[j * 4 + 3] = ((Math.imul(i + 1, 2654435761) >>> 0) % 100000) / 100000;
      const h = hi[i];
      if (h > 0) {
        const q = h - 1, c = q % L1.cols, r = (q / L1.cols) | 0;
        hr.set([(c * 64 + 0.5) / S, (r * 30 + 0.5) / S, (c * 64 + 63.5) / S, (r * 30 + 29.5) / S], j * 4); ht[j] = 1;
      } else if (h < 0) {
        const q = -h - 1;
        if (q < 16) { const c = q % 8, r = (q / 8) | 0; hr.set([(c * 512 + 0.5) / S, (r * 215 + 0.5) / S, (c * 512 + 511.5) / S, (r * 215 + 214.5) / S], j * 4); }
        else { const c = (q - 16) % 17, r = ((q - 16) / 17) | 0; hr.set([(c * 240 + 0.5) / S, (430 + r * 107 + 0.5) / S, (c * 240 + 239.5) / S, (430 + r * 107 + 106.5) / S], j * 4); }
        ht[j] = 2;
      }
    }
    buf(4, m, 4, 1); buf(5, hr, 4, 1); buf(6, ht, 1, 1);
    buf(7, perm(rgb, 3), 3, 1, true, gl.UNSIGNED_BYTE);
    this.vao = vao;

    const tex = (unit, img, mip) => {
      const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, gl.RGB, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      if (mip) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
      else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    };
    tex(0, images[0], false); tex(1, images[1], true); tex(2, images[2], true);
    gl.uniform1i(this.u.uL0, 0); gl.uniform1i(this.u.uL1, 1); gl.uniform1i(this.u.uL2, 2);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    this.resize();
  }
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = this.canvas.clientWidth; this.h = this.canvas.clientHeight;
    this.canvas.width = Math.round(this.w * dpr); this.canvas.height = Math.round(this.h * dpr);
    const gl = this.gl;
    this.gw = Math.max(2, Math.ceil(this.w / 4)); this.gh = Math.max(2, Math.ceil(this.h / 4));
    gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, this.glowTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, this.gw, this.gh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.glowTex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  draw(s) {
    const gl = this.gl, u = this.u, ub = this.ub;
    gl.useProgram(this.prog);
    gl.uniform2f(u.uView, this.w, this.h); gl.uniform3f(u.uCam, s.cx, s.cy, s.zoom);
    gl.uniform1f(u.uT, s.T); gl.uniform1f(u.uPop, s.pop); gl.uniform1f(u.uAB, s.AB); gl.uniform1f(u.uBC, s.BC);
    gl.uniform1f(u.uDim0, s.dim0); gl.uniform1f(u.uDim1, s.dim1); gl.uniform1f(u.uTop, s.top); gl.uniform1f(u.uMinPx, s.minPx);
    gl.uniform3f(u.uMouse, s.mx, s.my, s.mr); gl.uniform1f(u.uGlobal, s.global);
    gl.bindVertexArray(this.vao);
    // 1) small offscreen copy of the wall -> mip chain = cheap wide blur for the glow
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo); gl.viewport(0, 0, this.gw, this.gh);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.n);
    gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, this.glowTex); gl.generateMipmap(gl.TEXTURE_2D);
    // 2) ambient background
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.bg); gl.disable(gl.BLEND);
    gl.uniform1i(ub.uGlow, 3); gl.uniform2f(ub.uView, this.w, this.h); gl.uniform1f(ub.uTime, s.time);
    gl.uniform1f(ub.uGlowAmt, s.glow); gl.uniform3fv(ub.uC1, s.c1); gl.uniform3fv(ub.uC2, s.c2);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    // 3) the wall itself
    gl.enable(gl.BLEND); gl.useProgram(this.prog);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.n);
  }
}
