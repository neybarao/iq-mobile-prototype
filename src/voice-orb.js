/*!
 * Voice Orb, web component <voice-orb>
 * Exported 2026-11-20 from https://www.neybarao.com/voice-orb/ · Style Glass · Theme Dark · Starts in Idle · Sensitivity 6.0× · Size 40% · Speed 3.0× · Background theme colour
 *
 * One file, no dependencies. Works in plain HTML and in any framework (Ionic Angular / React / Vue),
 * including Capacitor native builds, because it only needs a WebView with WebGL2.
 *
 * ---- Use ----
 *   import './voice-orb.js';                         // once, anywhere (e.g. main.ts)
 *   <voice-orb></voice-orb>                          // the look chosen in the Voice Orb page is the default
 *   <voice-orb state="thinking"></voice-orb>         // attributes override it: state, orb, theme, sens, size, speed, background
 *
 *   const orb = document.querySelector('voice-orb');
 *   orb.state = 'speaking';                          // 'idle' | 'speaking' | 'thinking' | 'error' (eases over 1.4 s)
 *   await orb.useMicrophone();                       // user's voice -> drives Idle (call from a tap on iOS)
 *   orb.stopMicrophone();
 *   orb.attachAIVoice(audioElOrMediaStream);         // assistant's voice -> drives Speaking
 *   orb.playIntro();                                 // replay the opening (the orb spins up from small, ~1.4 s)
 *   <voice-orb intro="off"></voice-orb>              // the opening plays when the element first appears; this skips it
 *
 * ---- Size ----
 *   The orb fills the element. Default is width 100% and square; set width/height in CSS to change it.
 *   `size` scales the orb inside that box (1 = same framing as the Voice Orb page).
 *
 * ---- Ionic Angular ----
 *   Add CUSTOM_ELEMENTS_SCHEMA to the component or module that uses <voice-orb>.
 * ---- Capacitor (native) ----
 *   The microphone needs the native permission: NSMicrophoneUsageDescription in iOS Info.plist,
 *   RECORD_AUDIO in the Android manifest.
 */
(() => {
  if (customElements.get('voice-orb')) return;

  // The look exported from the Voice Orb page. Attributes on the element override these.
  const DEFAULTS = {"orb":"glass","theme":"dark","state":"idle","sens":6,"size":0.4,"speed":3,"background":null,"edges":"broken","sat":1.45} || { orb: 'dots', theme: 'auto', state: 'idle', sens: 1, size: 1, speed: 1,
                                           background: null, edges: 'broken', sat: 1.45 };
  // Shaders, copied verbatim from the Voice Orb page at export time.
  const SH = {
    vs: `#version 300 es
  precision highp float;
  layout(location=0) in vec2 aUV;
  // Same clock split as the glass orb: *L for Listening (sphere), *T for Thinking (ring).
  uniform float uTimeL, uTimeT, uRotL, uSpinT, uFlowT, uMorph;
  uniform float uLevel, uBass, uMid, uHigh, uPass, uDpr, uLight;
  // Clip export only: the period (in clock units) after which every motion repeats exactly. 0 = live / off.
  uniform float uLoopP, uGray;
  // Opening (Dots): uIntroOn = 1 while it plays, uIntroT = seconds since it started.
  uniform float uIntroOn, uIntroT;
  // Who is talking: -1 = the AI (bluer), +1 = the user (redder), 0 = nobody.
  uniform float uHue;
  
  uniform float uSpeak, uSpeakE;
  uniform vec2 uFit;
  out vec3 vColor;
  out float vAlpha;

  // 3D simplex noise (Ashima Arts / Stefan Gustavson, MIT).
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  vec3 rotX(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x, c*p.y - s*p.z, s*p.y + c*p.z); }
  
  vec3 drift(vec3 v, float t, float P){
    if (P <= 0.0) return v * t;
    float a = 6.2831853 * t / P;
    vec3 e = normalize(cross(v, vec3(0.37, 0.81, 0.45))) * length(v);
    return (v * sin(a) + e * (1.0 - cos(a))) * (P / 6.2831853);
  }
  float wave(float f, float t, float ph, float P){
    if (P > 0.0) f = max(1.0, floor(f * P / 6.2831853 + 0.5)) * 6.2831853 / P;
    return sin(f * t + ph);
  }
  void main(){
    float theta = aUV.x * 6.2831853;
    float phi = aUV.y * 3.1415926;
    vec3 dir = vec3(sin(phi) * cos(theta), cos(phi), sin(phi) * sin(theta));
    float m = uMorph, listen = 1.0 - m;

    // ---- Listening: the sphere of meridian strands (driven by the *L clocks) ----
    float topW = smoothstep(-0.2, 1.0, dir.y);
    float botW = smoothstep(0.2, -1.0, dir.y);
    float t = uTimeL;
    float c = cos(uRotL), s = sin(uRotL);
    // Clip loops sample the noise in world space, so turning by whole meridians brings back the exact same picture.
    vec3 nd = uLoopP > 0.0 ? vec3(c * dir.x + s * dir.z, dir.y, -s * dir.x + c * dir.z) : dir;
    // Slow base wobble plus finer ripples; audio bands scale them by region.
    float n1 = snoise(nd * 1.5 + drift(vec3(0.0, 0.22, 0.1), t, uLoopP));
    float n2 = snoise(nd * 4.2 + drift(vec3(0.5, 0.0, -0.35), t, uLoopP));
    float n3 = snoise(nd * 9.0 + drift(vec3(0.0, -0.9, 0.6), t, uLoopP));
    float amp = 0.035 + 0.16 * uLevel + 0.22 * uBass * botW + 0.10 * uMid;
    float fine = 0.012 + 0.10 * uHigh * (0.4 + topW);
    float r = 1.0 + amp * (0.65 * n1 + 0.35 * n2) + fine * n3 + 0.06 * uLevel;
    vec3 p = dir * r;
    // Spin around Y, slight tilt toward the camera.
    p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
    vec3 nrm = vec3(c * dir.x + s * dir.z, dir.y, -s * dir.x + c * dir.z);
    p = rotX(p, 0.28);
    nrm = rotX(nrm, 0.28);
    // Speaking: a soft swell with each word, on top of the voice reaction.
    p += nrm * (uSpeak * 0.03 * uSpeakE);

    // ---- Thinking: the same dots wrap a ring facing the camera (driven by the *T clocks) ----
    // Each meridian becomes one coil around the tube; the coils slide around it and the ring turns slowly.
    float tt = uTimeT;
    float al = 3.1415926 - 2.0 * phi + uFlowT;
    float th = theta + uSpinT * 0.3 + 0.16 * (phi - 1.5707963); // a slight twist: each coil leans like a rope strand
    float thw = uLoopP > 0.0 ? theta + uSpinT * 0.3 : theta; // world angle in clip loops (same reason as above)
    float rt = 0.22 * (1.0 + 0.14 * snoise(vec3(cos(thw) * 0.9, sin(thw) * 0.9, 0.0) + drift(vec3(0.0, 0.0, 0.25), tt, uLoopP)));
    vec3 tn = vec3(cos(al) * cos(th), cos(al) * sin(th), sin(al));
    vec3 tp = vec3(0.74 * cos(th), 0.74 * sin(th), 0.0) + rt * tn;
    float breath = (wave(1.7, tt, 0.0, uLoopP) + 0.6 * wave(2.93, tt, 1.3, uLoopP) + 0.35 * wave(0.71, tt, 2.1, uLoopP)) / 1.95;
    float wob = snoise(tp * 0.55 + drift(vec3(0.2, -0.15, 0.17), tt, uLoopP));
    tp *= 1.0 + 0.02 * breath + 0.04 * wob;
    tp = rotX(tp, 0.12);
    tn = rotX(tn, 0.12);

    // ---- Blend: dots fly from one layout to the other, scattering a little mid-way like a flock ----
    vec3 q = mix(p, tp, m);
    float sc = 0.22 * sin(3.1415926 * m);
    q += sc * vec3(snoise(dir * 1.7 + vec3(t * 0.3, 0.0, 0.0)),
                   snoise(dir * 1.7 + vec3(0.0, 17.0, t * 0.3)),
                   snoise(dir * 1.7 + vec3(31.0, t * 0.3, 0.0)));
    p = q;

    // ---- Opening: the orb starts small and spins up to its full size ----
    if (uIntroOn > 0.5) {
      float ik = clamp(uIntroT / 1.4, 0.0, 1.0);
      float ie = 1.0 - pow(1.0 - ik, 3.0);
      float turn = (1.0 - ie) * 7.0; // what is left to turn, in radians
      float ic = cos(turn), is = sin(turn);
      p = vec3(ic * p.x + is * p.z, p.y, -is * p.x + ic * p.z) * mix(0.04, 1.0, ie);
    }

    float d = 3.6;
    gl_Position = vec4(p.x * uFit.x * d, p.y * uFit.y * d, 0.0, d - p.z);

    // Fresnel: bright at the silhouette, almost clear through the middle. Blended as a value (normals can cancel).
    float rim = mix(1.0 - abs(nrm.z), 1.0 - abs(tn.z), m);
    rim *= 1.0 - 0.3 * sin(3.1415926 * m); // a little calmer while scattered
    float edge = pow(rim, 2.6);

    // Screen-fixed gradient: warm on top, cool at the bottom.
    vec3 warm = mix(vec3(1.0, 0.36, 0.20), vec3(0.89, 0.26, 0.14), uLight);
    vec3 cool = mix(vec3(0.30, 0.56, 1.0), vec3(0.16, 0.38, 0.88), uLight);
    vec3 col = mix(cool, warm, smoothstep(-0.85, 0.85, p.y + 0.75 * uHue));
    // Dark: the rim burns toward white. Light: it deepens instead, since glow can't brighten a white page.
    vec3 hot = mix(vec3(1.0, 0.94, 0.9), col * 0.62, uLight);
    col = mix(col, hot, pow(rim, 6.0) * (0.55 + 0.4 * uLevel));

    float a = (0.12 + 0.88 * edge + 0.2 * uLevel * edge) * mix(1.0, 0.7, m); // the ring packs the dots tighter
    a *= 1.0 + 0.35 * uSpeak * listen * uSpeakE; // speaking glows a little with each word
    col = mix(col, vec3(dot(col, vec3(0.299, 0.587, 0.114)) * 1.15), uGray); // error: black and white
    vColor = col;
    vAlpha = uPass < 0.5 ? a : a * mix(0.07, 0.035, uLight);
    gl_PointSize = (uPass < 0.5 ? 2.3 : 8.0) * uDpr;
  }`,
    fs: `#version 300 es
  precision highp float;
  uniform float uPass;
  in vec3 vColor;
  in float vAlpha;
  out vec4 outColor;
  void main(){
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = uPass < 0.5 ? smoothstep(1.0, 0.55, d) : pow(max(0.0, 1.0 - d), 2.0);
    float k = min(1.0, vAlpha * a);
    outColor = vec4(vColor * k, k); // premultiplied: additive in dark, "over" in light
  }`,
    gvs: `#version 300 es
  precision highp float;
  layout(location=0) in vec3 aP; // x: along (0..1), y: across, z: kind (-1 shell, 0..2 ribbon)
  // Two sets of clocks: *L drive only what Listening shows, *T only what Thinking shows.
  // Live they tick together; the loop export rewinds each one while the other state fills the screen.
  uniform float uTimeL, uTimeT, uSpinL, uSpinT, uFlowL, uFlowT;
  uniform float uLevel, uBass, uHigh, uMorph, uBreak;
  uniform float uLoopP, uLoopFT; // clip export: loop period of the time clocks and of uFlowT (0 = live / off)
  uniform float uIntroOn, uIntroT; // opening: on while it plays, seconds since it started
  
  uniform float uSpeak, uSpeakE;
  uniform vec2 uFit;
  out vec3 vN;
  out vec2 vS;
  out float vW, vK, vVis, vZ, vGapA, vGapB, vGapT;
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  
  const float PI = 3.1415926, TAU = 6.2831853;
  const float RM = 0.74, RT = 0.22; // glass torus: major / minor radius
  vec3 rotX(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x, c*p.y - s*p.z, s*p.y + c*p.z); }
  vec3 rotY(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z); }
  vec3 rotZ(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c*p.x - s*p.y, s*p.x + c*p.y, p.z); }
  
  vec3 drift(vec3 v, float t, float P){
    if (P <= 0.0) return v * t;
    float a = 6.2831853 * t / P;
    vec3 e = normalize(cross(v, vec3(0.37, 0.81, 0.45))) * length(v);
    return (v * sin(a) + e * (1.0 - cos(a))) * (P / 6.2831853);
  }
  float wave(float f, float t, float ph, float P){
    if (P > 0.0) f = max(1.0, floor(f * P / 6.2831853 + 0.5)) * 6.2831853 / P;
    return sin(f * t + ph);
  }

  vec3 shellAt(vec2 q){
    float th = q.x * TAU, ph = clamp(q.y, 0.002, 0.998) * PI;
    vec3 sp = vec3(sin(ph) * cos(th), sin(ph) * sin(th), cos(ph));
    // Same (th, ph) on the torus: front pole -> inner rim, silhouette -> outer rim.
    float al = PI - 2.0 * ph;
    float rad = RM + RT * cos(al);
    vec3 to = vec3(rad * cos(th), rad * sin(th), RT * sin(al));
    // The poles become the hole; hold them shut until late so the blob stays solid mid-way.
    float mm = mix(uMorph, pow(uMorph, 4.0), 1.0 - sin(ph));
    return mix(sp, to, mm);
  }

  vec3 ribbonAt(vec2 q, float i){
    float s = q.x * TAU, w = q.y;
    // Listening: a wide band around a tilted great circle, with a gentle swoop.
    float amp = 0.09 * (1.0 + 1.2 * uLevel);
    float lat = amp * sin(2.0 * s + i * 2.1 + uFlowL * 0.6) + w * 0.26;
    vec3 sp = vec3(cos(lat) * cos(s), sin(lat), cos(lat) * sin(s)) * 0.975;
    sp = rotZ(sp, i < 0.5 ? -0.45 : (i < 1.5 ? 0.32 : 0.05));
    sp = rotX(sp, 0.42 + 0.12 * i);
    sp = rotY(sp, uSpinL * 0.5 + i * 1.4);
    // Thinking: a closed tube around the ring, its centre offset and tilted a little.
    // The three tubes braid: each one's centre circles inside the ring's cross-section once per lap.
    float a = w * PI;
    // Thickness swells and thins along each tube, drifting slowly.
    float rr = (0.15 + 0.01 * i) * (1.0 + 0.1 * snoise(vec3(cos(s) * 0.9, sin(s) * 0.9, i * 2.7) + drift(vec3(0.0, 0.0, 0.28), uTimeT, uLoopP)));
    float ph = i * 2.094 + s + uFlowT;
    float th = s + uSpinT * 0.3;
    float braid = 0.05 * (1.0 + 0.4 * snoise(vec3(cos(s) * 0.8, sin(s) * 0.8, i * 1.9) + drift(vec3(0.0, 0.0, -0.22), uTimeT, uLoopP)));
    float R = 0.74 + braid * cos(ph);
    float z = braid * sin(ph);
    vec3 to = vec3((R + rr * cos(a)) * cos(th), (R + rr * cos(a)) * sin(th), z + rr * sin(a));
    return mix(sp, to, uMorph);
  }

  // ---- Opening: the orb starts small and spins up to its full size (returns p untouched when off) ----
  vec3 introShape(vec3 p){
    if (uIntroOn < 0.5) return p;
    float k = clamp(uIntroT / 1.4, 0.0, 1.0);
    float e = 1.0 - pow(1.0 - k, 3.0);
    p = rotY(p, (1.0 - e) * 7.0) * mix(0.04, 1.0, e);
    return rotZ(p, (1.0 - e) * 0.6);
  }

  vec3 place(vec2 q, float k){
    vec3 p = k < -0.5 ? shellAt(q) : ribbonAt(q, k);
    float t = uTimeL, listen = 1.0 - uMorph;
    float blob = 0.012 * listen + 0.2 * sin(PI * uMorph) + (0.05 * uLevel + 0.05 * uBass) * listen;
    float n1 = snoise(p * 0.7 + drift(vec3(0.0, 0.3, 0.2), t, uLoopP));
    float n2 = snoise(p * 2.6 + drift(vec3(0.5, 0.0, -0.3), t, uLoopP));
    p *= 1.0 + blob * n1 + 0.01 * uHigh * n2 * listen + 0.04 * uLevel * listen;
    p *= 1.0 + uSpeak * listen * 0.025 * uSpeakE; // speaking: a soft swell with each word
    // Thinking: an uneven breath plus a slow liquid wobble of the whole ring.
    t = uTimeT;
    float breath = (wave(1.7, t, 0.0, uLoopP) + 0.6 * wave(2.93, t, 1.3, uLoopP) + 0.35 * wave(0.71, t, 2.1, uLoopP)) / 1.95;
    float wob = snoise(p * 0.55 + drift(vec3(0.2, -0.15, 0.17), t, uLoopP));
    p *= 1.0 + (0.02 * breath + 0.04 * wob) * uMorph;
    p = introShape(p);
    return rotX(p, mix(0.0, 0.12, uMorph));
  }

  void main(){
    vec2 q = aP.xy; float k = aP.z;
    vec3 p = place(q, k);
    vec2 e = k < -0.5 ? vec2(1.0 / 160.0, 1.0 / 80.0) : vec2(1.0 / 320.0, 0.08);
    vec3 pu = place(q + vec2(e.x, 0.0), k);
    vec3 pv = place(q + vec2(0.0, q.y > 0.5 ? -e.y : e.y), k);
    vN = cross(pu - p, pv - p);
    // Around the poles the finite-difference normal degenerates: at the sphere's pole, and mid-morph where the pole
    // becomes a tiny funnel whose sideways normals light up the rim term. Blend toward the radial normal over a soft
    // band, and only hand back the real normals once the ring's hole is properly open.
    if (k < -0.5) {
      float band = 1.0 - smoothstep(0.0, 0.16, min(q.y, 1.0 - q.y));
      float keep = 1.0 - smoothstep(0.55, 0.85, uMorph);
      vec3 nFD = normalize(vN + 1e-9);
      nFD *= sign(dot(nFD, p) + 1e-6); // same side as the radial normal, or the blend cancels out mid-way
      vN = mix(nFD, normalize(p), band * keep);
    }
    vS = p.xy;
    vW = q.y;
    vK = k;
    // Ribbon 3 only exists in the ring; all ribbons step back during the blob.
    float vis = k > 1.5 ? uMorph : 1.0;
    vVis = vis * (1.0 - 0.9 * sin(PI * uMorph));
    vZ = p.z;
    // Broken strokes: each edge of a band fades out along stretches of its length, and the gaps drift.
    float sa = q.x * TAU;
    vec3 cp = vec3(cos(sa), sin(sa), k * 3.7) * 0.8;
    float ga = smoothstep(-0.6, 0.15, snoise(cp + vec3(0.0, 0.0, uFlowL * 0.25)));
    float gb = smoothstep(-0.6, 0.15, snoise(cp + vec3(5.3, 1.7, uFlowL * 0.25)));
    vGapA = mix(1.0, ga, uBreak);
    vGapB = mix(1.0, gb, uBreak);
    // Thinking tubes: same idea on their bright rims; cos(around-tube) makes inner and outer rims break differently.
    float gt = smoothstep(-0.25, 0.35, snoise(cp * 1.4 + vec3(cos(q.y * PI) * 1.2, 2.1, 0.0) + drift(vec3(0.0, 0.0, 0.25), uFlowT, uLoopFT)));
    vGapT = mix(1.0, gt, uBreak);
    float d = 3.6;
    gl_Position = vec4(p.x * uFit.x * d, p.y * uFit.y * d, 0.0, d - p.z);
  }`,
    gfs: `#version 300 es
  precision highp float;
  uniform float uLight, uLevel, uMorph, uSpeak, uSpeakE, uGray;
  uniform float uHue; // who is talking: -1 the AI (bluer), +1 the user (redder)
  in vec3 vN;
  in vec2 vS;
  in float vW, vK, vVis, vZ, vGapA, vGapB, vGapT;
  out vec4 outColor;
  vec3 grad(vec2 s){
    // Left half blue (cyan up top), right half red, violet only in the seam, pink along the bottom.
    float g = clamp(0.5 + 0.6 * dot(s, vec2(0.96, -0.28)) + 0.3 * uHue, 0.0, 1.0);
    vec3 c0 = vec3(0.22, 0.58, 1.0), c1 = vec3(0.08, 0.26, 1.0), c2 = vec3(0.55, 0.16, 0.88);
    vec3 c3 = vec3(1.0, 0.14, 0.12), c4 = vec3(1.0, 0.22, 0.14);
    vec3 c = g < 0.38 ? mix(c0, c1, g / 0.38)
           : g < 0.54 ? mix(c1, c2, (g - 0.38) / 0.16)
           : g < 0.70 ? mix(c2, c3, (g - 0.54) / 0.16)
           : mix(c3, c4, (g - 0.70) / 0.30);
    return mix(c, vec3(1.0, 0.24, 0.66), smoothstep(-0.55, -1.0, s.y) * 0.45);
  }
  void main(){
    vec3 n = normalize(vN + 1e-7);
    float f = 1.0 - abs(n.z); // fresnel: 0 facing us, 1 edge-on
    vec3 c = grad(vS);
    c = mix(c, vec3(dot(c, vec3(0.299, 0.587, 0.114)) * 1.3), uGray); // error: black and white
    float a, wh = 0.0; // wh: near-white light on top of the colour (edges, crossings)
    if (vK < -0.5) {
      // Glass body: dim, deeper colour in the middle, a wide bright rim at the silhouette.
      a = 0.07 + 0.55 * pow(f, 2.0) + 0.5 * pow(f, 4.0) + 2.4 * pow(f, 12.0);
      c *= mix(0.45, 1.0, smoothstep(0.0, 0.8, f));
      vec3 nf = n * sign(n.z + 1e-6);
      a += 0.5 * pow(max(0.0, dot(nf, normalize(vec3(-0.5, 0.6, 0.62)))), 36.0); // glint top-left
      a *= mix(1.0, 0.8, uMorph);
      wh = 0.35 * pow(f, 16.0); // thin white line right at the silhouette
    } else {
      float e = abs(vW);
      float band = 1.0 - smoothstep(0.7, 1.0, e);
      float hem = smoothstep(0.72, 0.95, e) * (1.0 - smoothstep(0.95, 1.0, e));
      float gap = vW > 0.0 ? vGapA : vGapB;
      float silk = band * (0.04 + 0.6 * pow(f, 2.6)) + hem * gap * (vW > 0.0 ? 1.6 : 0.35); // one edge catches the light
      float tube = 0.05 + 0.3 * pow(f, 1.8) * mix(0.6, 1.0, vGapT) + 1.1 * pow(f, 8.0) * vGapT;                            // thinking tubes
      a = mix(silk, tube, uMorph) * vVis;
      // Lit edges glow almost white; where two of them cross, the sum burns to white.
      float edgeLine = smoothstep(0.82, 0.97, e) * (1.0 - smoothstep(0.97, 1.0, e));
      float silkWh = edgeLine * gap * (vW > 0.0 ? 1.0 : 0.3) * (0.9 + 3.0 * pow(f, 2.0)); // strongest where the band turns edge-on
      float tubeWh = 1.2 * pow(f, 10.0) * vGapT;
      wh = mix(silkWh, tubeWh, uMorph) * vVis;
      float depth = mix(0.3, 1.0, smoothstep(-0.7, 0.3, vZ)); // parts behind read dimmer through the glass
      a *= depth;
      wh *= depth * depth;
    }
    a *= 0.9 + 0.4 * uLevel * (1.0 - uMorph);
    a *= 1.0 + 0.3 * uSpeak * uSpeakE * (1.0 - uMorph); // speaking glows a little with each word
    if (uLight > 0.5) {
      // Light: no bloom; dense overlaps deepen, coverage caps at 1.
      float k = min(1.0, a * 0.7);
      c = mix(c, c * 0.6, smoothstep(0.55, 1.4, a) * 0.6);
      outColor = vec4(c * k, k);
    } else {
      // Dark: linear light into a float target; tone mapping turns overlaps white-hot.
      // Thinking glows brighter; the gain grows with the morph so Listening is unchanged.
      float gain = mix(1.0, 1.8, uMorph * uMorph);
      outColor = vec4((c * a + mix(c, vec3(1.0), 0.8) * wh * (1.0 + 0.5 * uLevel)) * gain, a);
    }
  }`,
    postVs: `#version 300 es
  out vec2 vUv;
  void main(){ vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); vUv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`,
    blurFs: `#version 300 es
  precision highp float;
  uniform sampler2D uTex; uniform vec2 uDir;
  in vec2 vUv; out vec4 o;
  void main(){
    vec3 c = texture(uTex, vUv).rgb * 0.227;
    c += (texture(uTex, vUv + uDir * 1.385).rgb + texture(uTex, vUv - uDir * 1.385).rgb) * 0.316;
    c += (texture(uTex, vUv + uDir * 3.231).rgb + texture(uTex, vUv - uDir * 3.231).rgb) * 0.070;
    o = vec4(c, 1.0);
  }`,
    compFs: `#version 300 es
  precision highp float;
  uniform sampler2D uScene, uBloom; uniform vec3 uBg; uniform float uGlow, uSat, uFlipY;
  in vec2 vUv; out vec4 o;
  void main(){
    vec2 uv = vec2(vUv.x, mix(vUv.y, 1.0 - vUv.y, uFlipY)); // export reads pixels top-down
    vec3 c = texture(uScene, uv).rgb + texture(uBloom, uv).rgb * uGlow;
    c = 1.0 - exp(-c); // soft shoulder: saturated colours roll toward white
    // Win back the saturation that glow and the shoulder wash out; near-white highlights barely move.
    float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = clamp(mix(vec3(lum), c, uSat), 0.0, 1.0);
    o = vec4(uBg + c * (1.0 - uBg), 1.0);
  }`
  };

  const STATES = ['idle', 'speaking', 'thinking', 'error'];
  const MERIDIANS = 140, PER_LINE = 110, COUNT = MERIDIANS * PER_LINE;
  const RIBBONS = 3, RIB_ALONG = 320, RIB_ACROSS = 24, SH_U = 160, SH_V = 80;
  const MORPH_SECS = 1.4;
  const INTRO_END = 1.4; // opening length in seconds
  const SPEECH = { syl: 4.2, phr: 0.3 };
  const BG = { dark: [0.027, 0.043, 0.078], light: [0.953, 0.961, 0.976] };
  const SILENT = { level: 0, bass: 0, mid: 0, high: 0 };

  function hexColor(s) {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(s || '').trim());
    if (!m) return null;
    let h = m[1];
    if (h.length === 3) h = h.replace(/./g, c => c + c);
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  }
  function speechEnv(s, f = SPEECH) {
    const syl = Math.pow(Math.abs(Math.sin(Math.PI * f.syl * s)), 1.6);
    const ph = Math.sin(2 * Math.PI * f.phr * s) + 0.5 * Math.sin(4 * Math.PI * f.phr * s + 1.7);
    const x = Math.min(1, Math.max(0, (ph + 0.6) / 1.0));
    return (0.25 + 0.75 * syl) * (0.15 + 0.85 * x * x * (3 - 2 * x));
  }

  class VoiceOrbElement extends HTMLElement {
    static get observedAttributes() { return ['state', 'orb', 'theme', 'sens', 'size', 'speed', 'background']; }

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = '<style>:host{display:block;width:100%;aspect-ratio:1/1;position:relative;contain:strict}'
        + ':host([hidden]){display:none}canvas{position:absolute;inset:0;width:100%;height:100%;display:block}</style>'
        + '<canvas part="canvas" aria-hidden="true"></canvas>';
      this._canvas = root.querySelector('canvas');
      this._raf = 0;
      this._visible = true;
      this._ctx = null; this._userBus = null; this._aiBus = null; this._stream = null; this._micSrc = null;
      this._aiElements = new Set(); this._aiStreams = new Set(); this._aiNodes = new Map();
      this.live = { level: 0, bass: 0, mid: 0, high: 0 };
      this._liveUser = { level: 0, bass: 0, mid: 0, high: 0 };
      this._liveAI = { level: 0, bass: 0, mid: 0, high: 0 };
    }

    // ---- Settings (attribute > exported default) ----
    _opt(name) {
      const a = this.getAttribute(name);
      return a == null ? DEFAULTS[name] : a;
    }
    _num(name, lo, hi) {
      const v = Number(this._opt(name));
      return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : DEFAULTS[name];
    }
    get state() { return this._state || this._initialState(); }
    set state(name) { this.setState(name); }
    setState(name) {
      if (!STATES.includes(name)) throw new Error('Unknown state: ' + name + ' (use ' + STATES.join(', ') + ')');
      this._state = name;
      if (this.getAttribute('state') !== name) this.setAttribute('state', name);
    }
    _initialState() {
      const s = this._opt('state');
      return STATES.includes(s) ? s : 'idle';
    }

    attributeChangedCallback(name, oldV, newV) {
      if (name === 'state') { if (STATES.includes(newV)) this._state = newV; return; }
      if (!this.gl) return;
      if (name === 'theme' || name === 'background') this._applyTheme();
      if (name === 'size') this._resize();
    }

    // Replay the opening: the orb starts small and spins up to its full size.
    playIntro() { this._introT = this._reduceMotion ? INTRO_END : 0; }

    connectedCallback() {
      if (!this.gl && !this._init()) return;
      if (this._introT == null) this._introT = this.getAttribute('intro') === 'off' || this._reduceMotion ? INTRO_END : 0;
      this._state = this._initialState();
      this._ro = new ResizeObserver(() => this._resize());
      this._ro.observe(this);
      this._io = new IntersectionObserver(es => { this._visible = es.some(e => e.isIntersecting); });
      this._io.observe(this);
      this._mq = window.matchMedia('(prefers-color-scheme: dark)');
      this._onScheme = () => this._applyTheme();
      this._mq.addEventListener('change', this._onScheme);
      this._resize();
      this._applyTheme();
      this._last = performance.now();
      const loop = now => { this._raf = requestAnimationFrame(loop); this._frame(now); };
      this._raf = requestAnimationFrame(loop);
    }

    disconnectedCallback() {
      cancelAnimationFrame(this._raf);
      if (this._ro) this._ro.disconnect();
      if (this._io) this._io.disconnect();
      if (this._mq) this._mq.removeEventListener('change', this._onScheme);
      this.stopMicrophone();
      // Ionic keeps pages in the DOM while navigating, so the GL context is kept for a quick return.
      // Call orb.destroy() to free it for good.
    }

    destroy() {
      this.disconnectedCallback();
      this._aiNodes.forEach(n => n.disconnect());
      this._aiNodes.clear(); this._aiElements.clear(); this._aiStreams.clear();
      if (this._ctx) { this._ctx.close(); this._ctx = null; }
      const lose = this.gl && this.gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
      this.gl = null;
    }

    // ---- WebGL setup (same programs and meshes as the page) ----
    _init() {
      const gl = this._canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' });
      if (!gl) { console.warn('<voice-orb>: WebGL2 is not available.'); return false; }
      this.gl = gl;
      const compile = (type, src) => {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
        return sh;
      };
      const program = (v, f) => {
        const p = gl.createProgram();
        gl.attachShader(p, compile(gl.VERTEX_SHADER, v));
        gl.attachShader(p, compile(gl.FRAGMENT_SHADER, f));
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
        return p;
      };

      // Dots
      const uv = new Float32Array(COUNT * 2);
      for (let m = 0, i = 0; m < MERIDIANS; m++) for (let k = 0; k < PER_LINE; k++, i += 2) { uv[i] = m / MERIDIANS; uv[i + 1] = (k + 0.5) / PER_LINE; }
      this.prog = program(SH.vs, SH.fs);
      this.vao = gl.createVertexArray();
      gl.bindVertexArray(this.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      this.U = {};
      ['uTimeL','uTimeT','uRotL','uSpinT','uFlowT','uMorph','uLevel','uBass','uMid','uHigh','uPass','uDpr','uFit','uLight','uLoopP','uSpeak','uSpeakE','uGray','uIntroOn','uIntroT','uHue'].forEach(n => this.U[n] = gl.getUniformLocation(this.prog, n));

      // Glass
      this.gprog = program(SH.gvs, SH.gfs);
      const gVerts = [], gIdx = [];
      const grid = (nu, nv, kind, vMap) => {
        const base = gVerts.length / 3;
        for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) gVerts.push(i / nu, vMap(j / nv), kind);
        for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
          const a = base + j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
          gIdx.push(a, b, c, b, d, c);
        }
      };
      grid(SH_U, SH_V, -1, v => v);
      for (let r = 0; r < RIBBONS; r++) grid(RIB_ALONG, RIB_ACROSS, r, v => v * 2 - 1);
      this.gvao = gl.createVertexArray();
      gl.bindVertexArray(this.gvao);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gVerts), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(gIdx), gl.STATIC_DRAW);
      this.G_COUNT = gIdx.length;
      gl.bindVertexArray(this.vao);
      this.GU = {};
      ['uTimeL','uTimeT','uSpinL','uSpinT','uFlowL','uFlowT','uLevel','uBass','uHigh','uMorph','uFit','uLight','uBreak','uLoopP','uLoopFT','uSpeak','uSpeakE','uGray','uIntroOn','uIntroT','uHue'].forEach(n => this.GU[n] = gl.getUniformLocation(this.gprog, n));
      const sat = Number(DEFAULTS.sat);
      this.glassSat = Number.isFinite(sat) && sat > 0 ? Math.min(3, sat) : 1.45;
      gl.useProgram(this.gprog);
      gl.uniform1f(this.GU.uBreak, DEFAULTS.edges === 'solid' ? 0 : 1);

      // Bloom (dark theme, glass only)
      this.blurProg = program(SH.postVs, SH.blurFs);
      this.compProg = program(SH.postVs, SH.compFs);
      this.BU = { tex: gl.getUniformLocation(this.blurProg, 'uTex'), dir: gl.getUniformLocation(this.blurProg, 'uDir') };
      const c = this.compProg;
      this.CU = { scene: gl.getUniformLocation(c, 'uScene'), bloom: gl.getUniformLocation(c, 'uBloom'), bg: gl.getUniformLocation(c, 'uBg'),
                  glow: gl.getUniformLocation(c, 'uGlow'), sat: gl.getUniformLocation(c, 'uSat'), flip: gl.getUniformLocation(c, 'uFlipY') };
      this.postVao = gl.createVertexArray();
      this.floatOK = !!gl.getExtension('EXT_color_buffer_float');
      this.rt = null;

      gl.useProgram(this.prog);
      gl.enable(gl.BLEND);

      // Animation state
      const st = this._initialState();
      this._reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this._rot = 0; this._motionTime = 0; this._spin = 0; this._flow = 0;
      this._morphP = st === 'thinking' || st === 'error' ? 1 : 0;
      this._speakP = st === 'speaking' ? 1 : 0; this._speakAmt = this._speakP;
      this._grayP = st === 'error' ? 1 : 0; this._grayAmt = this._grayP;
      this._canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); cancelAnimationFrame(this._raf); });
      return true;
    }

    _target(w, h) {
      const gl = this.gl, hdr = this.floatOK;
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, hdr ? gl.RGBA16F : gl.RGBA8, w, h, 0, gl.RGBA, hdr ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return { tex, fbo, w, h };
    }

    _resize() {
      const gl = this.gl;
      if (!gl) return;
      this._dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, this._canvas.clientWidth), h = Math.max(1, this._canvas.clientHeight);
      const cw = Math.round(w * this._dpr), ch = Math.round(h * this._dpr);
      const s = 0.6 * this._num('size', 0.4, 1.6);
      this._fit = w > h ? [s * h / w, s] : [s, s * w / h];
      if (this._canvas.width === cw && this._canvas.height === ch && this.rt) return;
      this._canvas.width = cw; this._canvas.height = ch;
      if (this.rt) [this.rt.scene, this.rt.a, this.rt.b].forEach(t => { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fbo); });
      const qw = Math.max(1, cw >> 2), qh = Math.max(1, ch >> 2);
      this.rt = { scene: this._target(cw, ch), a: this._target(qw, qh), b: this._target(qw, qh) };
    }

    _applyTheme() {
      const gl = this.gl;
      if (!gl) return;
      const t = this._opt('theme');
      const light = t === 'light' || (t !== 'dark' && !window.matchMedia('(prefers-color-scheme: dark)').matches);
      this._light = light;
      this._bg = hexColor(this._opt('background')) || (light ? BG.light : BG.dark);
      gl.useProgram(this.gprog); gl.uniform1f(this.GU.uLight, light ? 1 : 0);
      gl.useProgram(this.prog); gl.uniform1f(this.U.uLight, light ? 1 : 0);
      gl.blendFunc(gl.ONE, light ? gl.ONE_MINUS_SRC_ALPHA : gl.ONE);
      gl.clearColor(this._bg[0], this._bg[1], this._bg[2], 1);
    }

    // ---- Audio: two channels, user (mic -> Idle) and AI (assistant voice -> Speaking) ----
    _ensureAudio() {
      if (this._ctx) return;
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      const bus = () => {
        const an = this._ctx.createAnalyser();
        an.fftSize = 1024;
        an.smoothingTimeConstant = 0.6;
        return { an, freq: new Uint8Array(an.frequencyBinCount), wave: new Uint8Array(an.fftSize) };
      };
      this._userBus = bus();
      this._aiBus = bus();
    }
    async useMicrophone() {
      if (this._stream) return;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('Microphone needs a secure context (https or the native app).');
      this._ensureAudio();
      await this._ctx.resume();
      this._stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      this._micSrc = this._ctx.createMediaStreamSource(this._stream);
      this._micSrc.connect(this._userBus.an); // not sent to the speakers, so no feedback
    }
    stopMicrophone() {
      if (this._stream) this._stream.getTracks().forEach(t => t.stop());
      if (this._micSrc) this._micSrc.disconnect();
      this._stream = null; this._micSrc = null;
    }
    // <audio>/<video> keeps playing through the speakers; a MediaStream (e.g. WebRTC) is only analysed.
    attachAIVoice(source) {
      this._ensureAudio();
      this._ctx.resume();
      if (this._aiNodes.has(source)) return this._aiNodes.get(source);
      let node;
      if (source instanceof MediaStream) {
        node = this._ctx.createMediaStreamSource(source);
        node.connect(this._aiBus.an);
        this._aiStreams.add(node);
        source.getAudioTracks().forEach(tr => tr.addEventListener('ended', () => this.detachAIVoice(source)));
      } else {
        node = this._ctx.createMediaElementSource(source);
        node.connect(this._aiBus.an);
        node.connect(this._ctx.destination);
        this._aiElements.add(source);
      }
      this._aiNodes.set(source, node);
      return node;
    }
    detachAIVoice(source) {
      const node = this._aiNodes.get(source);
      if (!node) return;
      this._aiStreams.delete(node);
      if (this._aiElements.has(source)) { this._aiElements.delete(source); node.disconnect(this._aiBus.an); } // keeps playing
      else node.disconnect();
      this._aiNodes.delete(source);
    }
    _userOn() { return !!this._stream; }
    _aiOn() { return this._aiStreams.size > 0 || [...this._aiElements].some(el => !el.paused && !el.ended); }
    _measure(bus) {
      bus.an.getByteFrequencyData(bus.freq);
      bus.an.getByteTimeDomainData(bus.wave);
      let rms = 0;
      for (let i = 0; i < bus.wave.length; i++) { const v = (bus.wave[i] - 128) / 128; rms += v * v; }
      const nyq = this._ctx.sampleRate / 2, n = bus.freq.length;
      const band = (lo, hi) => {
        const a = Math.max(1, Math.floor(lo / nyq * n)), b = Math.min(n - 1, Math.ceil(hi / nyq * n));
        let sum = 0;
        for (let i = a; i <= b; i++) sum += bus.freq[i];
        return sum / ((b - a + 1) * 255);
      };
      return { level: Math.sqrt(rms / bus.wave.length) * 4, bass: band(40, 250) * 1.6, mid: band(250, 2000) * 1.8, high: band(2000, 8000) * 2.6 };
    }
    _follow(into, target) {
      const k = this._num('sens', 0.3, 6);
      for (const key in into) {
        const v = Math.min(2.4, target[key] * k);
        into[key] += (v - into[key]) * (v > into[key] ? 0.45 : 0.07);
      }
    }

    // ---- One frame (same maths as the page) ----
    _advanceMorph(dt, speed) {
      const st = this.state;
      const step = this._reduceMotion ? 1 : dt / MORPH_SECS;
      const target = st === 'thinking' || st === 'error' ? 1 : 0;
      this._morphP += Math.max(-step, Math.min(step, target - this._morphP));
      this._speakP += Math.max(-step, Math.min(step, (st === 'speaking' ? 1 : 0) - this._speakP));
      this._speakAmt = this._speakP * this._speakP * (3 - 2 * this._speakP);
      this._grayP += Math.max(-step, Math.min(step, (st === 'error' ? 1 : 0) - this._grayP));
      this._grayAmt = this._grayP * this._grayP * (3 - 2 * this._grayP);
      const m = this._morphP * this._morphP * (3 - 2 * this._morphP);
      const tt = this._motionTime;
      const pace = 1 + 0.35 * m * (Math.sin(tt * 0.53) * 0.6 + Math.sin(tt * 1.37 + 0.8) * 0.4);
      this._spin += dt * speed * (0.18 + 0.3 * this.live.level) * (1 + 1.6 * m) * pace;
      this._flow += dt * speed * (0.35 + 0.9 * m) * (2 - pace);
      return m;
    }
    _liveSpeak() {
      const k = this._speakAmt, ai = this._aiOn(), user = this._userOn(), t = this._motionTime;
      const e = ai ? Math.min(1, this._liveAI.level * 1.6) : speechEnv(t);
      const calm = 0.06 * (0.6 + 0.4 * Math.sin(t * 0.9));
      const f = { level: 1, bass: 0.9, mid: 0.8, high: 0.7 };
      for (const key in this.live) {
        const u = user ? this._liveUser[key] : calm * f[key];
        const a = ai ? this._liveAI[key] : 0.55 * e * f[key];
        this.live[key] = (1 - k) * u + k * a;
      }
      const L = this.live;
      // Who is talking, for the colour: the AI in Speaking pulls toward blue; the user's voice in Idle toward red.
      this._userTalk = (this._userTalk || 0) + ((user ? Math.min(1, this._liveUser.level * 2.5) : 0) - (this._userTalk || 0)) * 0.08;
      const hue = (1 - k) * this._userTalk - k;
      return { speak: k, speakE: e, gray: this._grayAmt, hue, level: L.level, bass: L.bass, mid: L.mid, high: L.high };
    }
    _setSpeak(L, st) {
      const gl = this.gl;
      gl.uniform1f(L.uSpeak, st.speak || 0);
      gl.uniform1f(L.uSpeakE, st.speakE || 0);
      gl.uniform1f(L.uGray, st.gray || 0);
      gl.uniform1f(L.uHue, st.hue || 0);
    }

    _frame(now) {
      const gl = this.gl;
      const dt = Math.min(0.05, (now - this._last) / 1000);
      this._last = now;
      if (!gl || !this._visible || document.hidden) return;
      if (this._ctx) {
        this._follow(this._liveUser, this._userOn() ? this._measure(this._userBus) : SILENT);
        this._follow(this._liveAI, this._aiOn() ? this._measure(this._aiBus) : SILENT);
      }
      const speed = this._num('speed', 0, 3) * (this._reduceMotion ? 0.3 : 1);
      this._motionTime += dt * speed;
      this._rot += dt * speed * (0.12 + this.live.level * 0.25);
      const W = this._canvas.width, H = this._canvas.height;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      gl.clear(gl.COLOR_BUFFER_BIT);
      const m = this._advanceMorph(dt, speed);
      const t = this._motionTime;
      this._introT = Math.min(INTRO_END, this._introT + dt);
      const intro = { introOn: this._introT < INTRO_END ? 1 : 0, introT: this._introT };
      if (this._opt('orb') === 'glass') {
        const st = Object.assign({ timeL: t, timeT: t, spinL: this._spin, spinT: this._spin, flowL: this._flow, flowT: this._flow,
                                   morph: m, fit: this._fit }, intro, this._liveSpeak());
        this._renderGlass(st, this._light ? null : this.rt, W, H);
      } else {
        this._renderDots(Object.assign({ timeL: t, timeT: t, rotL: this._rot, spinT: this._spin, flowT: this._flow, morph: m,
                                         fit: this._fit }, intro, this._liveSpeak()), W, H);
      }
    }

    _renderDots(st, w, h) {
      const gl = this.gl, U = this.U;
      gl.useProgram(this.prog);
      gl.bindVertexArray(this.vao);
      gl.uniform1f(U.uTimeL, st.timeL); gl.uniform1f(U.uTimeT, st.timeT);
      gl.uniform1f(U.uRotL, st.rotL); gl.uniform1f(U.uSpinT, st.spinT); gl.uniform1f(U.uFlowT, st.flowT);
      gl.uniform1f(U.uMorph, st.morph);
      gl.uniform1f(U.uLoopP, 0);
      this._setSpeak(U, st);
      gl.uniform1f(U.uIntroOn, st.introOn || 0); gl.uniform1f(U.uIntroT, st.introT || 0);
      gl.uniform1f(U.uLevel, st.level); gl.uniform1f(U.uBass, st.bass); gl.uniform1f(U.uMid, st.mid); gl.uniform1f(U.uHigh, st.high);
      gl.uniform2f(U.uFit, st.fit[0], st.fit[1]);
      gl.uniform1f(U.uDpr, this._dpr);
      gl.uniform1f(U.uPass, 1); gl.drawArrays(gl.POINTS, 0, COUNT); // halo
      gl.uniform1f(U.uPass, 0); gl.drawArrays(gl.POINTS, 0, COUNT); // crisp lines
    }

    _renderGlass(st, rt, w, h) {
      const gl = this.gl, GU = this.GU;
      gl.useProgram(this.gprog);
      gl.bindVertexArray(this.gvao);
      gl.uniform2f(GU.uFit, st.fit[0], st.fit[1]);
      gl.uniform1f(GU.uTimeL, st.timeL); gl.uniform1f(GU.uTimeT, st.timeT);
      gl.uniform1f(GU.uSpinL, st.spinL); gl.uniform1f(GU.uSpinT, st.spinT);
      gl.uniform1f(GU.uFlowL, st.flowL); gl.uniform1f(GU.uFlowT, st.flowT);
      gl.uniform1f(GU.uLoopP, 0); gl.uniform1f(GU.uLoopFT, 0);
      gl.uniform1f(GU.uIntroOn, st.introOn || 0); gl.uniform1f(GU.uIntroT, st.introT || 0);
      this._setSpeak(GU, st);
      gl.uniform1f(GU.uLevel, st.level); gl.uniform1f(GU.uBass, st.bass); gl.uniform1f(GU.uHigh, st.high);
      gl.uniform1f(GU.uMorph, st.morph);
      if (!rt) { gl.drawElements(gl.TRIANGLES, this.G_COUNT, gl.UNSIGNED_SHORT, 0); return; } // light theme

      gl.bindFramebuffer(gl.FRAMEBUFFER, rt.scene.fbo);
      gl.viewport(0, 0, rt.scene.w, rt.scene.h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.drawElements(gl.TRIANGLES, this.G_COUNT, gl.UNSIGNED_SHORT, 0);

      gl.disable(gl.BLEND);
      gl.useProgram(this.blurProg);
      gl.bindVertexArray(this.postVao);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(this.BU.tex, 0);
      const pass = (src, dst, dx, dy) => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo);
        gl.viewport(0, 0, dst.w, dst.h);
        gl.bindTexture(gl.TEXTURE_2D, src.tex);
        gl.uniform2f(this.BU.dir, dx / src.w, dy / src.h);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };
      pass(rt.scene, rt.a, 0, 0);
      pass(rt.a, rt.b, 1, 0); pass(rt.b, rt.a, 0, 1);
      pass(rt.a, rt.b, 2.5, 0); pass(rt.b, rt.a, 0, 2.5);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);
      gl.useProgram(this.compProg);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, rt.scene.tex);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, rt.a.tex);
      gl.uniform1i(this.CU.scene, 0); gl.uniform1i(this.CU.bloom, 1);
      const bg = this._bg;
      gl.uniform3f(this.CU.bg, bg[0], bg[1], bg[2]);
      gl.uniform1f(this.CU.glow, 0.6);
      gl.uniform1f(this.CU.sat, this.glassSat);
      gl.uniform1f(this.CU.flip, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.activeTexture(gl.TEXTURE0);
      gl.enable(gl.BLEND);
      gl.clearColor(bg[0], bg[1], bg[2], 1);
    }
  }

  customElements.define('voice-orb', VoiceOrbElement);
})();
