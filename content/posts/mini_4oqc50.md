---
id: mini_4oqc50
title: "Decent Progress : Lumex Project"
date: "2025-09-11"
time: "21:18"
tags: ["project","computer vision","ai","software"]
---

**Progress Update**  
Over the past couple of days, I focused on getting the DepthAI AAR properly configured and integrated. For context, the AAR is essentially a packaged library (like a zip file) that contains the critical components of the DepthAI module, including the firmware and essential functionality.

Previously, I discovered that the Bytedeco C++ library worked with DepthAI but only supported the camera itself. not the USB connection. The publicly available AAR only supports USB. This led me to create a **custom AAR** that works for both the camera and USB.

The AAR build is now **successful**. Initially, there were compilation issues where only a single class file was being compiled while the others were skipped. After cleaning the Gradle cache, double-checking syntax, and following some debugging references, all class files are now correctly included in the AAR.

With the new AAR integrated, I managed to reach a working APK where both the USB connection and DepthAI function properly. Logs now show **“OAK connected”** and **“Pipeline started”**, confirming that real communication is happening between the phone and the device and no dummy test is happening.

---

**Current Challenge: RGB Streaming**  
The next milestone is streaming RGB video to the phone. However, I ran into issues. likely due to a firmware mismatch. While communication works, the streaming pipeline isn’t functioning correctly. I attempted fixes but ended up in loops, so I’ve paused this part for now.

Moving forward, I am rolling back to the **pipeline-check checkpoint** and rebuild from there, ensuring stability before moving onto streaming. I’m also moving the project to **IntelliJ**, as it’s suggested to be more efficient for this workflow compared to Android Studio. Some configuration issues came up, but I’m confident they’ll be resolved soon.

---

### **Reflections and Learnings**

It’s been a week since I started this intensive phase of the project. effectively my second week. Progress isn’t measured by speed alone, the issues I’m encountering would take teams to resolve. Fortunately, I’m not alone in this my father has been assisting me, offering 35 years of software development experience. Talking to him gives me perspective and motivation when things feel overwhelming.

Mentally, I’m stable, but there are moments of fear and self-doubt that made it hard to open Android Studio some days. Even when I make progress, my heart races, and I feel momentarily lost. Yet, I’m still moving forward, which feels like a core part of me saying, *“The only way forward is through.”*

This project is changing me in ways I don’t fully understand yet. I know that taking breaks is important, but equally important is coming back from them with determination, rather than letting fear take hold. Despite challenges, I feel a quiet confidence that this journey is worth every bit of effort.
