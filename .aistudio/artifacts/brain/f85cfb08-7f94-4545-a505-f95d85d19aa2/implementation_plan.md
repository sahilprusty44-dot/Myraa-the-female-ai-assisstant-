# Full-Screen 3D Studio & Bottom-Right Floating Micro Orb Plan

Refining the 3D model showcase experience by expanding the 3D canvas to a panoramic viewport, automatically hiding the bottom-left chat box while 3D is active, and shrinking Myraa's Core Orb into an 80px floating micro orb avatar docked at the bottom-right of the screen.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following layout and behavior adjustments were confirmed through clarification:
> - **Full-Screen 3D Canvas**: When 3D mode is active, the 3D canvas expands to fill the central workspace (`w-full max-w-6xl h-[65vh] sm:h-[72vh] lg:h-[76vh]`), giving the 3D models the expansive showcase stage they deserve.
> - **Chat Box Auto-Disappear**: The bottom-left `LiveResponseCard` completely disappears/fades out while the 3D canvas is open, eliminating visual clutter from the viewport.
> - **Floating Micro Orb Avatar Docked Bottom-Right**: Instead of a wide split column that crowds the 3D viewport, Myraa's Core Orb glides down into a sleek **80px floating micro orb avatar** docked at the **bottom-right corner** (`bottom-6 right-6 z-40`).
> - **Micro Orb Visuals**: Uses an 80px circular glass medallion with an animated nucleus, live volume reactivity, thinking state changes, and quick awaken/mute touchpoints.

---

## 1. Sequence & Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Full-Screen 3D Showcase                           │
│                                                                             │
│  [Top Header: StatusBadge, 3D Studio active pill, Settings]                 │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                Full-Screen 3D Spatial Canvas (Center)                 │  │
│  │                                                                       │  │
│  │                     ┌──────────────────────────┐                      │  │
│  │                     │   Composite 3D Model     │                      │  │
│  │                     │   (Drone, Robot, Rover)  │                      │  │
│  │                     │   • Studio PBR Lighting  │                      │  │
│  │                     │   • Soft PCF Shadows     │                      │  │
│  │                     └──────────────────────────┘                      │  │
│  │                                                                       │  │
│  │  [Bottom Unified 3D Dock: Archetypes | Finishes | Explode | Camera]   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  (Chat box hidden)                                [Bottom-Right Float Avatar]
│                                                   ┌────────────────────────┐│
│                                                   │ [80px Myraa Micro Orb] ││
│                                                   │ • Voice Audio Wave     ││
│                                                   │ • Quick Mic/Mute Tool  ││
│                                                   └────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technical Changes

1. **`src/App.tsx`**:
   - Condition the `LiveResponseCard`: only render when `!scene3D.isOpen` (or add smooth fade-out).
   - Expand the 3D canvas container to full-width expansive presence (`w-full max-w-6xl h-[65vh] sm:h-[74vh]`).
   - When `scene3D.isOpen`, smoothly transition the Core Orb to a dedicated floating avatar docked at `bottom-6 right-6` with an 80px scale, or render a specialized micro orb companion when 3D is active while maintaining full microphone and voice audio streaming.
2. **`src/components/SpatialCanvas.tsx`**:
   - Update container height to fill available viewport space (`h-full min-h-[500px] lg:h-[72vh]`).
   - Call `renderer.setSize` properly on layout expand.
3. **`src/components/MicroOrbAvatar.tsx`** (New/Refined Component):
   - A dedicated 80px circular glass avatar docked at `bottom-6 right-6` with theme glow, audio-reactive pulse, miniature ThinkingOrb nucleus, and quick mic mute toggle.
