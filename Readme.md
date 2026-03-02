# Minis By Beyond Me Btw

Minis is a lightweight, fast, and minimal web application designed to help me create and manage small, focused content units or mini blogs. Whether that’s notes, snippets, logs, or micro-projects.

 Built with simplicity in mind, Minis prioritizes clarity, performance, and a distraction-free user experience.

👉 Site: [Minis.BeyondMeBtw.com](Https://minis.beyondmebtw.com)

This is an extension of my main blog : [Beyondmebtw](Https://beyondmebtw.com)

![Minis Page](https://content.beyondmebtw.com/thumbnails/experience/exp30.webp)

# Changelog

## V2.1 (02/03/26)
- fixed an issue with sitemap generation for the individual posts, it was generating by copying content but didnt remove the old ones which led to an addition type situation, it nows starts fresh to ensure all pages are indexed.
- Created a changelog and readme

## V 2.0 (19/02/26)

- minis now stands as an indpenednt platform which it always was but this is more codebase wise. It was from the filesystem of the main repo but is now its own repo
- this change was made to make it easier to manage content and backend operations without hampering the experience
- this new version has an updated backend logic regarding new function for update and delete while improving performace for create
- moved to a better method to store the blogs to allow for individual and whole access
- Migrated to astro js framework to allow for a better content dleivery and management system. This runs a static astro site.
- with this came improvements to the ui of the backend.
- on the frontend changes were made to show more of the post.
- new tags section was added and search function for better accesibility.
- automated the way the html files and he markdown files are processed to prevent a rebuild everytime a new post is added.
 