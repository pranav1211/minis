---
id: mini_t043s4
title: "A Stand Still : Lumex Project"
date: "2025-09-02"
time: "21:44"
tags: ["project","computer vision","ai"]
---

---
Today I was working on my big project, a multimodal AI application. For this, I’m using a Luxonis OAK-D Pro, which combines a depth sensor and a camera. The idea is simple: it provides more data than a regular camera, which is why I bought one in the first place.

But the title *“stand still”* sums up exactly where I am right now.

Last week, I thought I was routing the video stream directly to my phone. In reality, it was going from the camera → PC → phone. My first goal was a proper round trip, but I’ve hit a literal stand still right at the beginning.

After digging deeper, I found out that I couldn’t just use a web server or web app to connect. The OAK-D needs a **physical connection** between the app and the camera. I looked into some GitHub repos that supposedly did this, but they’re all 4+ years old and broken. I even tried Chaquopy and a bunch of random approaches, hoping something would stick.

Finally, I stripped it all down and aimed for the bare minimum: just get the RGB stream working. After about three hours, I managed to build an app that _ran without crashing_. But it still couldn’t connect to the camera, and that’s where my progress stands.

Talking it over with others made me realize something important: I’ve been shooting in the dark and just hoping things would work. That’s not uncommon, especially with how much AI and LLMs can “fill in the blanks” for you. But at some point, the shortcuts collapse.

Now I see the real path forward: I need to break this down even further. I have to understand the **protocols, pipelines, and data types** at play. Only then will I actually be able to make this work.

All of the the failing, the learning, the breaking down happened in a single day. But I know I won’t feel fine until I get it running. For clarity (and maybe some sanity), I will keep updating my progress on Minis.
