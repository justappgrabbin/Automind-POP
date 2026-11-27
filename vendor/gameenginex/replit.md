# Consciousness Simulation Engine

## Overview

This project is a **Consciousness Simulation Engine** that combines Human Design, quantum genetics (64 codons), and elemental resonance theory into an interactive 3D visualization system. The application creates and simulates "consciousness agents" - entities with unique genetic signatures, elemental properties, and awareness centers that evolve through a multi-layered GAN (Generative Adversarial Network) architecture.

The system implements a five-GAN cognitive architecture:
1. **Resonance S-GAN** - Decision engine with elemental algebra
2. **Codon Resonance GameGAN** - Progressive 64-codon accumulation system
3. **Human Design GameGAN** - 9-center bodygraph consciousness simulation
4. **GameGAN Simulator** - LSTM-based dynamics and rendering engine
5. **FairyGANmatter** - 11-modality adaptive output system

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript
- React Three Fiber (3D rendering via Three.js)
- React Three Drei (3D utilities and helpers)
- TailwindCSS with Radix UI components
- Zustand for state management
- Vite as build tool and dev server

**3D Visualization:**
- Canvas-based 3D world using React Three Fiber
- Agent visualization with bodygraph centers and codon resonance
- Interactive camera controls (OrbitControls)
- Post-processing effects via @react-three/postprocessing
- GLSL shader support for custom visual effects

**Component Structure:**
- `GameWorld.tsx` - Main 3D scene container with lighting, environment, and grid
- `ConsciousnessAgent.tsx` - Individual agent rendering with bodygraph visualization
- `CodonVisualization.tsx` - 64-codon progressive resonance display
- UI overlays for agent creation, elemental analysis, quantum coordinates, and resonant utility

**State Management:**
- Zustand store (`useConsciousness`) manages all consciousness agents, simulation state, and oracle queries
- Real-time simulation loop via `useSimulationLoop` hook
- Agent selection and interaction state

### Backend Architecture

**Technology Stack:**
- Express.js server with TypeScript
- ESM module system (type: "module")
- Drizzle ORM with PostgreSQL dialect
- Session-based architecture (connect-pg-simple)
- Neon Database (@neondatabase/serverless)

**Server Structure:**
- `server/index.ts` - Express application setup with middleware and logging
- `server/routes.ts` - API route registration (currently minimal)
- `server/storage.ts` - Data access layer with in-memory storage implementation
- `server/vite.ts` - Vite dev server integration for HMR

**Build Process:**
- Client: Vite bundles React app to `dist/public`
- Server: esbuild bundles Express server to `dist/index.js`
- Production: Static file serving with Express

### Data Models

**Consciousness Agent:**
- Unique ID and name
- 3D position and velocity
- Elemental type (Earth, Water, Air, Fire, Aether)
- Human Design bodygraph (9 centers, 64 gates, channels)
- Quantum coordinates (gate.line.color.tone.base)
- Astrological properties (zodiac sign, planetary influences)
- Consciousness level and archetype

**Human Design System:**
- 9 awareness centers (Head, Ajna, Throat, G, Heart, Spleen, Sacral, Root, Solar Plexus)
- 64 genetic gates mapped to I Ching hexagrams
- Channels connecting gate pairs
- Incarnation cross (life purpose)
- Full quantum coordinate resolution (82,944 unique states)

**Elemental Resonance:**
- 5x5 compatibility matrix for element interactions
- Elemental operators: blend, amplify, dampen
- Friction penalty calculation for mismatched elements
- Resonant Utility (RU) scoring system

### GAN Architecture Components

**Resonance S-GAN:**
- Generator: Noise → 5D semantic latents (elemental vectors)
- Discriminator: Latent coherence scoring
- Elemental friction algebra integrated into decision scoring
- RU formula: `RU = w_P·P - w_F·F + w_C·C + w_R·R - w_K·K + w_S·S`

**Codon Resonance GameGAN:**
- 64 genetic codons from Human Design gates
- Progressive accumulation (each scene builds on previous)
- Nucleotide frequency mapping (T=220Hz, C=293.66Hz, A=329.63Hz, G=392Hz)
- Visual properties: color hue, glow intensity, pulse rate, sparkle count

**GameGAN Simulator:**
- ActionLSTM for state evolution
- Game state with position, velocity, drives, hidden states
- Actions: move, interact, rest, create, socialize
- Dynamics engine for consciousness simulation

**Coordinate Resolution System:**
- Full 5-dimensional quantum coordinates (Gate.Line.Color.Tone.Base)
- Astrological layer (12 zodiac signs, 8 planetary influences)
- 69,120 unique coordinate combinations per agent
- Property resolution for colors, tones, bases, and zodiac signs

## External Dependencies

### Database
- **Neon Database** - Serverless PostgreSQL via `@neondatabase/serverless`
- **Drizzle ORM** - Type-safe database client and migration tool
- Schema definition in `shared/schema.ts` (currently minimal user table)
- Connection via `DATABASE_URL` environment variable

### 3D Graphics & Visualization
- **Three.js** - Core 3D rendering engine
- **React Three Fiber** - React renderer for Three.js
- **React Three Drei** - Helper components and utilities
- **React Three Postprocessing** - Visual effects pipeline
- **GLSL shaders** - Custom shader support via vite-plugin-glsl

### UI Components
- **Radix UI** - Headless component primitives (30+ components)
- **TailwindCSS** - Utility-first CSS framework
- **Class Variance Authority** - Component variant styling
- **Lucide React** - Icon library

### Development Tools
- **Vite** - Fast dev server and build tool with HMR
- **TypeScript** - Type safety across client and server
- **tsx** - TypeScript execution for server
- **esbuild** - Fast bundler for production server build
- **Replit Runtime Error Modal** - Development error overlay

### State & Data
- **Zustand** - Lightweight state management
- **TanStack Query** - Server state management (configured but minimal use)
- **Zod** - Schema validation
- **date-fns** - Date utilities

### Session Management
- **connect-pg-simple** - PostgreSQL session store for Express
- Session-based authentication architecture (implementation pending)

### Fonts & Assets
- **@fontsource/inter** - Self-hosted Inter font family
- Support for GLTF/GLB models, audio files (MP3, OGG, WAV)

### Key Configuration Files
- `vite.config.ts` - Build configuration with path aliases (@, @shared)
- `drizzle.config.ts` - Database schema management
- `tsconfig.json` - TypeScript configuration with path mapping
- `tailwind.config.ts` - Design system theming