# SOLution Game - Deployable Version

## 🎮 About
An interactive RPG-style game simulating the Australian education and migration journey.

## 🚀 Quick Deploy to Vercel

1. **Upload to GitHub:**
   - Create a new repository on GitHub
   - Drag and drop this entire folder to your repository
   - Make sure all files are in the root directory (not in a subfolder)

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect it's a Vite project
   - Click "Deploy"

## 📁 Project Structure
```
SOLution-Game-Deploy/
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── vite.config.ts        # Vite config
├── index.html            # Entry point
├── src/                  # Source code
│   ├── App.tsx          # Main game component
│   ├── main.tsx         # React entry
│   └── ...
└── public/              # Static assets
    ├── data/            # CSV game data
    └── assets/          # Images and art
```

## 🎯 Features
- Character creation with 81 combinations
- 4 different migration routes (Student, Working Holiday, Graduate, Offshore)
- Dynamic event system with CSV data
- Mobile-optimized 9:16 layout
- Art gallery integration
- Local and global ending system

## 🛠️ Local Development
```bash
npm install
npm run dev
```

## 📱 Mobile Optimized
The game is designed for mobile devices with a 9:16 aspect ratio and vertical option layout.

## 🎨 Art Assets
- Character art: 81 combinations
- Route backgrounds: 4 different routes
- NPC art: Various characters
- UI elements: Buttons, cards, backgrounds
- Ending art: 15 different endings

---
**Ready to deploy!** Just drag this folder to GitHub and connect to Vercel.
