---
id: mini_4o458m
title: "A Realization : Lumex Project"
date: "2025-09-03"
time: "22:54"
tags: ["project","computer vision","ai","software"]
---

This is a continuation of me working on my big project, and I’ve made some progress. I broke things down to the core basics of what I’m actually trying to do. After some deep digging (and a stressful back-and-forth with AI), I realized that the repo I was relying on which I already knew was 4 years old, was simply too flawed to sit and fix. I tried starting from scratch, but then I hit the real issue: **AI itself.**

AI is good, no doubt. Without it, I wouldn’t have even thought of this project, let alone gotten this far without a complete breakdown. But the problem is, it just kept giving me the same outdated suggestions again and again.

If there’s one thing this project has taught me so far, it’s how much software can make your life miserable. Documentation is scarce, libraries change, support is thin, and when you’re trying to build something that hasn’t really been done before, it’s brutally difficult. The panic-filled sleeps and the dreams of failing have been haunting me since Sunday (31/8/25). Talking things over with my father, my accomplishments and failures alike has helped. Even if the problem doesn’t get solved, just talking about it helps. There’s really no one else I can share this with, so I’m grateful I at least have that.

Now, onto the progress. After going in circles, I finally snapped and told ChatGPT straight: *“I’m running in loops here. I’m doing the same thing again and again. All your references are outdated — 4 years old. Existing libraries don’t work due to changes. Stop giving me the same stuff and let’s actually think through how this can work.”*

It paused for over four minutes and finally gave me the right direction. The solution: there **does** exist a Java API for DepthAI. It is : (JAVA CPP DEPTHAI Preset)[https://github.com/bytedeco/javacpp-presets/tree/master/depthai] It was last updated just 10 months ago, and seeing it still being used in 2024 is a good sign. From there, I broke things down even further. Now my current version is basically just checking if the device is connected no OpenCV, nothing extra, just DepthAI.

After some back and forth with settings (and still battling the AI feeding me old information), I managed to create an APK that actually compiled the DepthAI library and built successfully. The only issue is that it was built under the assumption that the PC, phone, and OAK were all connected together. The APK ended up being around 400 MB, which isn’t a big deal, but now the next step is to strip it down: build a minimal UI and get this raw functionality working.

For now, I’ve had to pause because of some external device issues, but I’ll get back to it soon. In the meantime, I want to focus, reflect, and most importantly get my latest F1 recap out.

And that’s where my progress stands. If nothing else, I’ve already learned that frustration and failure are just part of the process. The important thing is that I’m still moving, even when it feels like I’m standing still.
