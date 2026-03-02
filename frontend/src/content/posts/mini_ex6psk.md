---
id: mini_ex6psk
title: "The Runtime Quandary"
date: "2026-02-19"
time: "23:29"
tags: ["project","computer vision"]
---

---
I’m working a computer vision project on the web, Running **Roboflow’s detection transformer model** through **Transformers.js v4** on a live camera feed. 

**Detection, tracking, segmentation**, all in-browser. On paper, it sounds clean but Transformers.js is an abstraction over **ONNX Runtime Web.** I’ve worked with ONNX Runtime Web directly before so this should’ve been straightforward.

***It wasn’t.***

---

What finally broke the deadlock wasn’t some grand architectural rewrite. It was a single line of configuration. One of those silent switches, on or off, that multiplies into chaos when misaligned. Everything looked relevant. Everything felt necessary. But a handful of small, barely noticeable mismatches were quietly killing the whole system.

Here’s what was actually happening:

Transformers.js v4 (still pre-release, installable only via a specific npm tag) does not bundle ONNX Runtime Web inside it. Instead it references it via CDN. That distinction matters more than I initially realized. My assumption was simple: if I install the package locally, it should pull in its runtime dependency and let me configure everything from my own environment. That’s not how it works unfortunately.

---

So I kept going back and forth.

I’d download ONNX Runtime Web locally, but accidentally run it with **Transformers.js v3.8** instead of **v4**. Then I’d switch to **v4**, only to realize ONNX Runtime Web was being pulled via CDN. I’d fix one thing, something else would misalign. Fix that, and another inconsistency would surface.

It became this strange oscillation between cloud and local setups with each half-configured, each subtly incompatible. Nothing was completely wrong, but nothing was fully aligned either.

I cursed Claude. I blamed the abstraction layer. I blamed the tooling.

But it all made sense when i found the real issue, the threading mechanism and more importantly finally figuring out where the runtime was actually being loaded from.

---

When you use WASM through a CDN-hosted ONNX Runtime Web, you’re constrained. WASM wants threads and so does ONNX  But without proper cross-origin headers, a CDN setup realistically runs single-threaded. Locally, you can configure that. You can control threading. You can optimize. Through a CDN, you’re limited unless you deliberately configure around those constraints.

The turning point was when I finally noticed that ONNX was still being pulled via CDN when I thought I was running it locally. That was the architectural crack. Everything clicked after that.

So I stopped mixing environments.

I configured both Transformers.js and ONNX Runtime Web to load via CDN. No hybrid setup. No partial overrides. Just consistency. Single-threaded, clean, predictable.

And it worked.

That moment clarified the entire stack. Transformers.js is a thin orchestration layer. It doesn’t bundle ONNX Runtime the way I had assumed. It doesn’t reconcile runtime configuration mismatches for you. If you mix local and CDN artifacts, the burden of configuration is entirely yours.

It was an architectural misunderstanding disguised as a configuration problem.

---

Now the next step is obvious: move everything local, configure WASM properly, enable multithreading with the right headers, and actually push performance. But this time, I understand the stack. I understand who calls whom. I understand where the boundaries are.

Sometimes the breakthrough isn’t technical. It’s conceptual.
