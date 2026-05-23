---
id: mini_r4orin
title: "The Framework Dilemma"
date: "2026-01-13"
time: "11:19"
tags: ["project","experience","frameworks"]
featuredExcerpt: "I'm working on a project that involves running a YOLO model on the web using ONNX Runtime Web. On paper, it sounded straightforward: load the model, run inference, detect people. In practice, it turned into one of the most educational (and humbling) experiences I’ve had so far. I started the way I usually do with personal projects, dive in headfirst. I planned just enough to get moving, implemented things quickly, fixed errors as they came up,…"
---

---
I'm working on a project that involves running a YOLO model on the web using **ONNX Runtime Web**. On paper, it sounded straightforward: load the model, run inference, detect people. In practice, it turned into one of the most educational (and humbling) experiences I’ve had so far.

I started the way I usually do with personal projects, dive in headfirst. I planned just enough to get moving, implemented things quickly, fixed errors as they came up, and tried to squeeze out as much performance as possible. This approach has always worked for me. And honestly, there’s nothing wrong with it.

But this project was different.

This wasn’t just about “making it fast.” It was about understanding **why it wasn’t fast** and more importantly, how performance is actually measured and reasoned about in real-world software.

---

## When Numbers Don’t Make Sense

My initial inference time was around **5000 ms**. That’s bad. Detection lagged, the experience felt broken, and no amount of surface-level tweaking seemed to help. My instinct was to assume something was wrong with ONNX, the model, or even the browser.

That’s when I was taught something crucial. You map everything out. Every step. Every call. Every dependency.

That sounds obvious but it’s genuinely hard when you’ve never worked on a client-facing project before. For the first time, I wasn’t just optimizing for myself. I was dealing with **real constraints, real expectations, and real people**. That pressure changes how you think.

Once I slowed down and actually mapped out the pipeline, things began to click. And honestly, I was more annoyed at myself than anything else because the answer was right there.

---

## Vanilla JS vs Frameworks: The Real Difference

To isolate the issue, I compared my implementation with another project running the **same YOLOv12n model**, doing the same task (person detection). That project used **Next.js**. Their inference time? Around **150 ms**.

Mine? Still stuck around **1500 ms**. The difference wasn’t the model.  
It wasn’t ONNX. It wasn’t even the browser.

It was **how things were loaded and orchestrated**.

In my vanilla JavaScript setup, libraries were pulled in via CDN in a largely sequential manner. Scripts loaded step-by-step, dependencies resolved one after another, and the runtime paid the price.

Frameworks like Next.js, on the other hand, do a _lot_ of invisible work for you:

- Asynchronous and parallel loading of packages    
- Smarter bundling and dependency resolution    
- Optimized preprocessing pipelines    
- Runtime optimizations that you don’t even think about until you miss them    

Once I understood this, the performance gap stopped feeling mysterious and started feeling inevitable.

---

## What This Taught Me About Frameworks

We throw around the word _framework_ all the time. “Use React.” “Use Next.” “Frameworks make things faster.”

But **why**? This project finally answered that for me.

Frameworks aren’t magic. They’re distilled experience. They encode years of lessons about loading strategies, execution order, caching, and runtime behavior things that are incredibly hard to get right on your own unless you’ve already made every mistake once.

Once you understand _what_ a framework is actually doing for you, adapting to new tools becomes much easier. You stop treating them as black boxes and start seeing them as systems with advantages and trade-offs.

---

## The Bigger Takeaway

This experience taught me a lot about Development vs production thinking. About how you make something just to work vs making it reliable and more importantly it taught the consequences of optimizing blindy instead of with intent.   

It’s not the end of this project. But now I know it’s not about randomly optimizing or blaming the model. It’s about understanding the full pipeline: how things load, when they execute, and where time is actually spent.

Once that clicks, the problem stops feeling chaotic. Performance becomes something I can reason about, test systematically, and improve with intent.

To better understand everything end-to-end, I used **NotebookLM**, and it turned out to be genuinely enlightening.

If you’re curious, check it out here: 👉 [NotebookLM](https://notebooklm.google.com/notebook/ee800966-4605-4691-8492-79f27bc89f7c)
