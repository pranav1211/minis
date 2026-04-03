---
id: mini_72wjze
title: "The Subtle Art of Not Fucking Up a Prompt"
date: "2026-04-03"
time: "17:31"
tags: ["ai","blog","project","experience"]
---

***

**This is a story of two builds.**

Both are about creating an application, but they couldn’t be more different in how they demanded to be approached. Over the past few months, I’ve been using Claude Code, learning what works, what doesn’t, how to push it, and how to recover when things break. Usually, I work on one project at a time, and my thinking stays aligned with that. My prompts follow a rhythm, and things flow.

Recently, that changed. I found myself working on two projects at the same time, one at work and one for myself, and the difference between them exposed something I hadn’t consciously understood before.

***

At work, everything leans toward frontend styling and UI/UX decisions. That kind of work isn’t rigid, it’s psychological, sometimes even instinctive. You don’t always know what you want upfront, you feel your way toward it. My prompts reflected that. I’d say things like “move this somewhere better,” “change the tone,” or “this doesn’t feel right.” all in one prompt. They were abstract, messy, sometimes even contradictory. I’d start with one direction, pivot midway, dump thoughts, and hope something useful came out. And to Claude’s credit, it usually did. Even when it missed, I could recalibrate and move closer to what I wanted.

The second project was completely different. I wanted to build a finance tracking app, just for myself. No scale, no feature bloat, no need to impress anyone. Just something that matched how I think about money. I had tracked everything in Excel from 2022 to 2024, and then in 2025, I just stopped. Nothing really changed. I still spent money, just without the overhead of tracking every detail like some forced routine. But the desire for order didn’t go away. It just sat there quietly.

***

So I started building.

This time, the requirements were clear. I wasn’t exploring, I was translating. Taking habits I already understood and turning them into systems. Automating what I used to do manually. It was also a chance to explore backend concepts like authentication and storage. The first version came together smoothly. I listed what I needed, gave a structured prompt, and it worked. Styling was straightforward because I already had assets in mind. It felt clean.
Then came refinement, and that’s where everything broke.

I knew exactly what I wanted, down to the smallest detail, but I couldn’t express it in a way the AI could actually execute. And unlike the UI work, this wasn’t forgiving. Ambiguity didn’t lead to exploration, it led to wrong outputs. I got frustrated. I cursed the AI when it broke things. At one point, I genuinely considered abandoning the project. I even tried switching tools and brought in OpenAI Codex, and that only made things worse. Looking back, it might not have been just the tool, it was how I was using it, but in that moment, it just felt like everything was collapsing.

**I managed to recover from that mess, but barely.**

***

Then today, something clicked. I was talking to Claude, thinking about switching frameworks, and it just kept agreeing with everything I said. No resistance, no direction, just a constant “yes.” That irritated me enough to step back and rethink what I was doing. So I took the same problem to ChatGPT, and the response was different. It pointed out something simple that I hadn’t been seeing: the framework was never the problem, my approach was.

**I was treating a structured problem like a creative one.**

That realization shifted everything. Instead of prompting loosely, I started writing what I actually meant, then refining it into structured instructions. Turning thoughts into clear actions, removing room for interpretation. When I went back to Claude Code with that clarity, it worked. No confusion, no weird outputs, just execution.

And now, I have a money management app that actually fits me, the way I think, the way I spend, the things I care about tracking. I started this on March 31st, and now it’s April 4th, and it’s done. That still feels a bit unreal.

***

But the bigger takeaway isn’t the app. It’s what this process revealed.

People talk about mastering prompts like it’s some technique or formula, but this wasn’t about that. This was about alignment. The difference between vague intent and precise instruction, between feeling something and actually defining it. The problem isn’t that AI doesn’t understand you: **It’s that your words don’t always mean what you think they mean.**

I know this won’t be the last time I run into something like this. Things will break again. But now I understand what the situation demands, and more importantly, how to approach it when things start getting complex.
