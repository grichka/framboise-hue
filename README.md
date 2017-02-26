# framboise-hue
A personal project whose goal is to sync my connected light bulbs with screen colors and sounds of my computer.
Many projects already do such things but none of them are using NodeJS. I also wanted to develop it on my own!

# Limitations
This is project is very young and contains some experiments. Please don't judge me on them :)
Current version supports only Windows computers.

The project will evolve depending on my spare time... But i'll try to do a first release soon.

# Installation
Screen analysis relies on node-canvas. Its installation can be a bit complicated. I'll describe steps later.

Note: Visual Studio Community 2013 is needed. Versions above 2013 will not work with node-gyp version less that 2.0.0.

```
cd src/server
npm install
npm start
```