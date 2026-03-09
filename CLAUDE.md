# figma-ds-cli

CLI that controls Figma Desktop directly. No API key needed.

## Quick Reference

| User says | Command |
|-----------|---------|
| "connect to figma" | `node src/index.js connect` |
| "add shadcn colors" | `node src/index.js tokens preset shadcn` |
| "add tailwind colors" | `node src/index.js tokens tailwind` |
| "show colors on canvas" | `node src/index.js var visualize` |
| "create cards/buttons" | `render-batch` + `node to-component` |
| "create a rectangle/frame" | `node src/index.js render '<Frame>...'` |
| "convert to component" | `node src/index.js node to-component "ID"` |
| "list variables" | `node src/index.js var list` |
| "find nodes named X" | `node src/index.js find "X"` |
| "what's on canvas" | `node src/index.js canvas info` |
| "export as PNG/SVG" | `node src/index.js export png` |
| "show all variants" | `node src/index.js combos` |
| "create size variants" | `node src/index.js sizes --base small` |
| "create a slot" | `node src/index.js slot create "Name"` |
| "list slots" | `node src/index.js slot list` |
| "reset slot" | `node src/index.js slot reset` |
| "find component named X" | `node src/index.js find "X"` |
| "list all components" | eval `figma.currentPage.findAll(n => n.type === 'COMPONENT_SET')` |
| "inspect component properties" | eval `figma.getNodeById('ID').componentPropertyDefinitions` |
| "create instance of component" | eval `figma.getNodeById('ID').defaultVariant.createInstance()` |
| "set variant/property on instance" | eval `instance.setProperties({ 'Size': 'Large' })` |
| "list project variables" | `node src/index.js var list` |
| "test accessibility" | `node src/index.js lint` |
| "compose a page with components" | eval pattern (see Composing Pages section) |

**Full command reference:** See REFERENCE.md

---

## Design Tokens

"Add shadcn colors":
```bash
node src/index.js tokens preset shadcn   # 244 primitives + 32 semantic (Light/Dark)
```

"Add tailwind colors":
```bash
node src/index.js tokens tailwind        # 242 primitive colors only
```

"Create design system":
```bash
node src/index.js tokens ds              # IDS Base colors
```

**shadcn vs tailwind:**
- `tokens preset shadcn` = Full shadcn system (primitives + semantic tokens with Light/Dark mode)
- `tokens tailwind` = Just the Tailwind color palette (primitives only)

"Delete all variables":
```bash
node src/index.js var delete-all                    # All collections
node src/index.js var delete-all -c "primitives"    # Only specific collection
```

**Note:** `var list` only SHOWS existing variables. Use `tokens` commands to CREATE them.

---

## Fast Variable Binding (var: syntax)

Use `var:name` syntax to bind variables directly at creation time (currently searches shadcn collections):

### Create Commands with var:
```bash
node src/index.js create rect "Card" --fill "var:card" --stroke "var:border"
node src/index.js create circle "Avatar" --fill "var:primary"
node src/index.js create text "Hello" -c "var:foreground"
node src/index.js create line -c "var:border"
node src/index.js create frame "Section" --fill "var:background"
node src/index.js create autolayout "Container" --fill "var:muted"
node src/index.js create icon lucide:star -c "var:primary"
```

### JSX render with var:
```bash
node src/index.js render '<Frame bg="var:card" stroke="var:border" rounded={12} p={24}>
  <Text color="var:foreground" size={18}>Title</Text>
</Frame>'
```

### Set commands with var:
```bash
node src/index.js set fill "var:primary"
node src/index.js set stroke "var:border"
```

**Variables:** `background`, `foreground`, `card`, `primary`, `secondary`, `muted`, `accent`, `border`, and their `-foreground` variants.

---

## Connection Modes

### Yolo Mode (Recommended)
Patches Figma once, then connects directly. Fully automatic.
```bash
node src/index.js connect
```

### Safe Mode
Uses plugin, no Figma modification. Start plugin each session.
```bash
node src/index.js connect --safe
```
Then: Plugins → Development → FigCli

**Safe Mode Notes:**
- All commands work via daemon (no figma-use dependency)
- 60s timeout (same as Yolo Mode)
- For complex screens, use smaller batches or `eval` with native API
- `render-batch` automatically uses daemon-based rendering

---

## Creating Components

When user asks to "create cards", "design buttons":

1. **Each component = separate frame** (NOT inside parent gallery)
2. **Convert to component** after creation
3. **Use variables** for colors

```bash
# Step 1: Create separately
node src/index.js render-batch '[
  "<Frame name=\"Card 1\" w={320} h={200} bg=\"#18181b\" rounded={12} flex=\"col\" p={24}><Text color=\"#fff\">Title</Text></Frame>",
  "<Frame name=\"Card 2\" w={320} h={200} bg=\"#18181b\" rounded={12} flex=\"col\" p={24}><Text color=\"#fff\">Title</Text></Frame>"
]'

# Step 2: Convert
node src/index.js node to-component "ID1" "ID2"

# Step 3: Bind variables
node src/index.js bind fill "zinc/900" -n "ID1"
```

---

## Complex Components (Pricing Cards, etc.)

For complex multi-element components, use a **single eval** with native Figma API instead of JSX:

### Pattern
1. **Check for variables first** - don't assume any collection exists
2. **Use fallback colors** when no variables present
3. **Single eval** - create everything in one API call
4. **Data-driven** - define content in array, loop to create
5. **Equal height** - use `layoutAlign: "STRETCH"` and `layoutGrow: 1`

### Fallback Colors (Dark Theme)
```javascript
const colors = {
  bg: { r: 0.09, g: 0.09, b: 0.11 },       // #17171c
  card: { r: 0.11, g: 0.11, b: 0.13 },     // #1c1c21
  border: { r: 0.2, g: 0.2, b: 0.22 },     // #333338
  primary: { r: 0.23, g: 0.51, b: 0.97 },  // #3b82f8
  text: { r: 0.98, g: 0.98, b: 0.98 },     // #fafafa
  muted: { r: 0.6, g: 0.6, b: 0.65 },      // #999aa6
  white: { r: 1, g: 1, b: 1 }
};
```

### Variable Detection
```javascript
// Check for ANY variables, not just shadcn
const collections = await figma.variables.getLocalVariableCollectionsAsync();
if (collections.length > 0) {
  // Ask user which collection to use
} else {
  // Use fallback colors
}
```

### Equal Height Cards
```javascript
// After creating cards in container:
for (const card of container.children) {
  card.layoutAlign = 'STRETCH';           // Fill container height
  card.primaryAxisSizingMode = 'FIXED';   // Keep fixed width
  for (const child of card.children) {
    if (child.name === 'Features') {
      child.layoutGrow = 1;               // Features section grows
    }
  }
}
```

---

## Creating Webpages

Create ONE parent frame with vertical auto-layout containing all sections:

```bash
node src/index.js render '<Frame name="Landing Page" w={1440} flex="col" bg="#0a0a0f">
  <Frame name="Hero" w="fill" h={800} flex="col" justify="center" items="center" gap={24} p={80}>
    <Text size={64} weight="bold" color="#fff">Headline</Text>
    <Frame bg="#3b82f6" px={32} py={16} rounded={8}><Text color="#fff">CTA</Text></Frame>
  </Frame>
  <Frame name="Features" w="fill" flex="row" gap={40} p={80} bg="#111">
    <Frame flex="col" gap={12} grow={1}><Text size={24} weight="bold" color="#fff">Feature 1</Text></Frame>
  </Frame>
</Frame>'
```

---

## Slots

Figma's native slots feature allows flexible content areas in components. Slots let designers add, remove, and reorder content in instances without detaching.

### Slot Commands

```bash
# Create slot on selected component
node src/index.js slot create "Content" --flex col --gap 8 --padding 16

# List slots in component
node src/index.js slot list
node src/index.js slot list "component-id"

# Set preferred components for a slot
node src/index.js slot preferred "Slot#1:2" "component-id-1" "component-id-2"

# Reset slot in instance to defaults
node src/index.js slot reset
node src/index.js slot reset "slot-node-id"

# Convert frame to slot (must be inside component)
node src/index.js slot convert --name "Actions"

# Add content to slot in instance
node src/index.js slot add "slot-id" --component "component-id"
node src/index.js slot add "slot-id" --frame
node src/index.js slot add "slot-id" --text "Hello"
```

### JSX Slot Syntax

Use `<Slot>` in JSX to create slots. When parent is a component, creates real SLOT. Otherwise falls back to frame.

```jsx
<Frame name="Card" w={300} h={200} bg="#18181b" rounded={12} flex="col" p={16} gap={12}>
  <Text size={18} weight="bold" color="#fff">Card Title</Text>
  <Slot name="Content" flex="col" gap={8} w="fill">
    <Text size={14} color="#a1a1aa">Default slot content</Text>
  </Slot>
</Frame>
```

**Slot props:**
- `name` - Slot name (shown in properties panel)
- `flex` - Layout direction: "row" or "col"
- `gap` - Spacing between items
- `p`, `px`, `py` - Padding
- `w`, `h` - Size ("fill" or fixed)
- `bg` - Background fill

**Self-closing slot (empty):**
```jsx
<Slot name="Actions" flex="row" gap={8} />
```

### Slot Workflow

1. **Create component with slot:**
```bash
# Render component structure
node src/index.js render '<Frame name="Card" ...>
  <Slot name="Content" flex="col" w="fill" />
</Frame>'

# Convert to component
node src/index.js node to-component "frame-id"
```

2. **Or add slot to existing component:**
```bash
# Select component, then:
node src/index.js slot create "Content" --flex col --gap 8
```

3. **Set preferred components:**
```bash
node src/index.js slot preferred "Slot#1:2" "button-comp-id" "icon-comp-id"
```

4. **In instances, slots allow:**
- Adding any content (or only preferred if set)
- Reordering children
- Removing children
- Reset to defaults with `slot reset`

---

## JSX Syntax (render command)

```jsx
// Layout
flex="row"              // or "col"
gap={16}                // spacing between items
p={24}                  // padding all sides
px={16} py={8}          // padding x/y
pt={8} pr={16} pb={8} pl={16}  // individual padding

// Alignment
justify="center"        // main axis: start, center, end, between
items="center"          // cross axis: start, center, end

// Size
w={320} h={200}         // fixed size
w="fill" h="fill"       // fill parent
minW={100} maxW={500}   // constraints
minH={50} maxH={300}

// Appearance
bg="#fff"               // fill color
bg="var:card"           // bind to variable (FAST, inline binding)
stroke="#000"           // stroke color
stroke="var:border"     // bind stroke to variable
strokeWidth={2}         // stroke thickness
strokeAlign="inside"    // inside, outside, center
opacity={0.8}           // 0..1
blendMode="multiply"    // multiply, overlay, etc.

// Corners
rounded={16}            // all corners
roundedTL={8} roundedTR={8} roundedBL={0} roundedBR={0}  // individual
cornerSmoothing={0.6}   // iOS squircle (0..1)

// Effects
shadow="4px 4px 12px rgba(0,0,0,0.25)"  // drop shadow
blur={8}                // layer blur
overflow="hidden"       // clip content
rotate={45}             // rotation degrees

// Text
<Text size={18} weight="bold" color="#000" font="Inter">Hello</Text>
<Text color="var:foreground">Text with variable color</Text>
```

### Fast Variable Binding (var: syntax)

Use `var:name` syntax to bind variables directly at creation time (FAST, no separate bind commands needed):

```jsx
// Frame with bound fill and stroke
<Frame bg="var:card" stroke="var:border">
  <Text color="var:foreground">Bound text</Text>
  <Frame bg="var:primary">
    <Text color="var:primary-foreground">Button</Text>
  </Frame>
</Frame>
```

**Available shadcn variables:**
- `background`, `foreground` (page background/text)
- `card`, `card-foreground` (card backgrounds)
- `primary`, `primary-foreground` (buttons, accents)
- `secondary`, `secondary-foreground`
- `muted`, `muted-foreground` (subtle text)
- `accent`, `accent-foreground`
- `border`, `input`, `ring`

**Advantages over separate `bind` commands:**
- Single render call binds all variables at once
- No timeouts or multiple API calls
- Works with complex nested structures

**Also works with `set` commands:**
```bash
node src/index.js set fill "var:primary"    # Bind fill to existing element
node src/index.js set stroke "var:border"   # Bind stroke to existing element
```

### Auto-Layout

```jsx
// Wrap: items flow to next row when full
wrap={true}             // layoutWrap = 'WRAP'
rowGap={12}             // gap between rows (counterAxisSpacing)

// Grow: expand to fill remaining space
grow={1}                // layoutGrow = 1

// Stretch: fill cross-axis
stretch={true}          // layoutAlign = 'STRETCH'

// Absolute: position freely within parent
position="absolute" x={12} y={12}  // must have name for x/y to work
```

**Complete example:**
```bash
node src/index.js render '<Frame name="Card" w={300} flex="col" bg="#18181b" rounded={12} overflow="hidden">
  <Frame w="fill" h={100} bg="#333" />
  <Frame name="Badge" w={40} h={20} bg="#ef4444" rounded={4} position="absolute" x={12} y={12} />
  <Frame name="Tags" flex="row" wrap={true} rowGap={8} gap={8} p={16}>
    <Frame w={60} h={24} bg="#3b82f6" rounded={12} />
    <Frame w={70} h={24} bg="#22c55e" rounded={12} />
    <Frame w={80} h={24} bg="#a855f7" rounded={12} />
  </Frame>
  <Frame flex="row" p={16} gap={8}>
    <Frame w={40} h="fill" bg="#222" />
    <Frame h="fill" bg="#333" grow={1} />
  </Frame>
</Frame>'
```

**Common mistakes (silently ignored, no error!):**
```
WRONG                    RIGHT
layout="horizontal"   →  flex="row"
padding={24}          →  p={24}
fill="#fff"           →  bg="#fff"
cornerRadius={12}     →  rounded={12}
fontSize={18}         →  size={18}
fontWeight="bold"     →  weight="bold"
justify="between"     →  use grow={1} spacer instead
```

### Layout Patterns

**Push items to edges (navbar pattern):**
```jsx
// justify="between" doesn't work reliably, use grow spacer instead
<Frame flex="row" items="center">
  <Frame>Logo</Frame>
  <Frame grow={1} justify="center">Nav Links</Frame>
  <Frame>Buttons</Frame>
</Frame>
```

**Badge at avatar corner:**
```jsx
// Absolute x/y is relative to parent padding
// Avatar at padding=24, size=100, badge=20
// Position: padding + avatarSize - badgeSize/2 = 24 + 100 - 10 = 114
<Frame p={24}>
  <Frame w={100} h={100} rounded={50} />
  <Frame name="Badge" w={20} h={20} position="absolute" x={114} y={114} />
</Frame>
```

**Input at bottom (chat pattern):**
```jsx
<Frame flex="col" h={400}>
  <Frame>Message 1</Frame>
  <Frame>Message 2</Frame>
  <Frame grow={1} />
  <Frame>Input field</Frame>
</Frame>
```

**Avoid content overflow:**
```jsx
// BAD: fixed height too small for auto-sized children
<Frame h={160} p={24}><Frame h={139} /></Frame>  // 139+48 > 160!

// GOOD: ensure height fits content + padding
<Frame h={200} p={24}><Frame h={139} /></Frame>  // 139+48 < 200 ✓
```

**Complete card example:**
```bash
node src/index.js render '<Frame name="Card" w={320} h={200} bg="#18181b" rounded={12} flex="col" p={24} gap={12}>
  <Text size={18} weight="bold" color="#fff">Title</Text>
  <Text size={14} color="#a1a1aa" w="fill">Description text</Text>
  <Frame bg="#3b82f6" px={16} py={8} rounded={6}>
    <Text size={14} weight="medium" color="#fff">Button</Text>
  </Frame>
</Frame>'
```

### Common Pitfalls

**1. Text gets cut off (CRITICAL):**
```jsx
// BAD: Text without w="fill" will be single line and clip
<Frame flex="col" gap={8}>
  <Text size={16} weight="semibold" color="#fff">Title cut off</Text>
  <Text size={14} color="#a1a1aa">Description also cut off...</Text>
</Frame>

// GOOD: Add w="fill" to parent Frame AND ALL Text elements
<Frame flex="col" gap={8} w="fill">
  <Text size={16} weight="semibold" color="#fff" w="fill">Title wraps properly</Text>
  <Text size={14} color="#a1a1aa" w="fill">Description wraps properly.</Text>
</Frame>
```
**Rule:** For text to wrap, you need:
1. Parent frame with `w="fill"` or fixed width
2. **EVERY** Text element needs `w="fill"` (not just descriptions!)
3. Parent must have `flex="col"` or `flex="row"`

**IMPORTANT:** ALL text that could wrap needs `w="fill"`:
- Titles (e.g., "Wireless Noise-Canceling Headphones")
- Descriptions
- Labels
- Any multi-word text

**Real example - card with title AND description:**
```jsx
<Frame name="Card" w={340} bg="#18181b" rounded={16} flex="col" p={20} gap={16}>
  <Frame flex="col" gap={8} w="fill">
    <Text size={16} weight="semibold" color="#fff" w="fill">Wireless Noise-Canceling Headphones</Text>
    <Text size={14} color="#a1a1aa" w="fill">Premium audio experience with 40-hour battery life.</Text>
  </Frame>
</Frame>
```

**2. Toggle switches - use flex, not absolute:**
```jsx
// BAD: Absolute positioning for knob
<Frame w={52} h={28} bg="#3b82f6" rounded={14} p={2}>
  <Frame w={24} h={24} bg="#fff" rounded={12} position="absolute" x={26} y={2} />
</Frame>

// GOOD: Flex with justify for ON/OFF state
// ON state (knob right)
<Frame w={52} h={28} bg="#3b82f6" rounded={14} flex="row" items="center" p={2} justify="end">
  <Frame w={24} h={24} bg="#fff" rounded={12} />
</Frame>
// OFF state (knob left)
<Frame w={52} h={28} bg="#27272a" rounded={14} flex="row" items="center" p={2} justify="start">
  <Frame w={24} h={24} bg="#52525b" rounded={12} />
</Frame>
```

**3. Buttons need flex + fixed width for centered text:**
```jsx
// BAD: No flex, text not centered
<Frame bg="#3b82f6" px={16} py={10} rounded={10}>
  <Text>Button</Text>
</Frame>

// GOOD: Flex centers content
<Frame bg="#3b82f6" px={16} py={10} rounded={10} flex="row" justify="center" items="center">
  <Text>Button</Text>
</Frame>

// BEST (for components): Fixed width + auto-layout + text fills
<Frame w={100} h={40} bg="#3b82f6" rounded={8} flex="row" justify="center" items="center" px={16} py={10}>
  <Text color="#fff" w="fill" align="center">Button</Text>
</Frame>
```

**Button component pattern (for variants):**
```javascript
// When creating button components programmatically:
frame.layoutMode = "HORIZONTAL";
frame.primaryAxisSizingMode = "FIXED";    // Keep fixed width
frame.counterAxisSizingMode = "FIXED";    // Keep fixed height
frame.resize(100, 40);                     // Set size AFTER layout mode
frame.primaryAxisAlignItems = "CENTER";
frame.counterAxisAlignItems = "CENTER";
frame.paddingLeft = frame.paddingRight = 16;
frame.paddingTop = frame.paddingBottom = 10;

// Text inside button
text.textAlignHorizontal = "CENTER";
text.layoutAlign = "STRETCH";              // Fill available width
text.layoutGrow = 1;                       // Grow to fill
```

**4. No emojis - use shapes as icons:**
```jsx
// BAD: Emojis render inconsistently
<Text>🏠</Text>

// GOOD: Use shapes as icon placeholders
<Frame w={20} h={20} rounded={4} stroke="#fff" strokeWidth={2} />  // square icon
<Frame w={20} h={20} rounded={10} stroke="#fff" strokeWidth={2} /> // circle icon
```

**5. Three-dot menu icon:**
```jsx
<Frame flex="row" gap={3} justify="center" items="center">
  <Frame w={4} h={4} bg="#52525b" rounded={2} />
  <Frame w={4} h={4} bg="#52525b" rounded={2} />
  <Frame w={4} h={4} bg="#52525b" rounded={2} />
</Frame>
```

**6. Star rating with shapes:**
```jsx
<Frame flex="row" gap={4}>
  <Frame w={14} h={14} bg="#fbbf24" rounded={2} />
  <Frame w={14} h={14} bg="#fbbf24" rounded={2} />
  <Frame w={14} h={14} bg="#fbbf24" rounded={2} />
  <Frame w={14} h={14} bg="#fbbf24" rounded={2} />
  <Frame w={14} h={14} bg="#fbbf24" rounded={2} />
</Frame>
```

---

## Key Rules

1. **Always use `render` for frames** - has smart positioning
2. **Never use `eval` to create** - no positioning, overlaps at (0,0)
3. **Never use `npx figma-use render`** - no smart positioning
4. **For multiple frames:** Use `render-batch`
5. **Convert to components:** `node to-component` after creation

---

## Onboarding ("Initiate Project")

**Never show terminal commands to users.** Run silently, give friendly feedback.

1. Run `npm install` silently
2. Ask connection mode (Yolo or Safe)
3. Run `node src/index.js connect` (or `--safe`)
4. When connected, say: "Connected! What would you like to create?"

If permission error (macOS): System Settings → Privacy → Full Disk Access → Add Terminal

---

## Variable Visualization

"Show colors on canvas" / "display variables" / "create palette":
```bash
node src/index.js var visualize              # All collections
node src/index.js var visualize "primitives" # Filter
```

Creates shadcn-style color swatches bound to variables.

---

## Website Recreation

```bash
node src/index.js recreate-url "https://example.com" --name "Page"
node src/index.js screenshot-url "https://example.com"
```

---

## Speed Daemon

`connect` auto-starts daemon for 10x faster commands.

```bash
node src/index.js daemon status
node src/index.js daemon restart
```

---

## Working with Existing Components

When user asks to "use existing Button/Card", "create instances", "compose a screen with components".

**Always follow this 4-step workflow:**

### Step 1: Find the Component

```bash
node src/index.js find "Button"               # Partial name match
node src/index.js find "Card" -t COMPONENT_SET  # Filter type
```

Output example:
```
1:23 [COMPONENT_SET] Button
1:24 [COMPONENT] Button/Primary/Default
1:25 [COMPONENT] Button/Secondary/Large
```

Use the **COMPONENT_SET** id for variant access, or a specific **COMPONENT** id if you want a fixed variant.

### Step 2: Inspect Component Properties

```bash
node src/index.js eval "
const comp = figma.getNodeById('1:23');
const defs = comp.componentPropertyDefinitions;
return JSON.stringify(Object.entries(defs).map(([name, def]) => ({
  name,
  type: def.type,
  options: def.variantOptions || (def.type === 'BOOLEAN' ? [true, false] : ['(text)']),
  default: def.defaultValue
})), null, 2);
"
```

This returns: property names, types (`VARIANT`, `BOOLEAN`, `TEXT`), and available options.

### Step 3: Create Instance with Properties

```bash
node src/index.js eval "
const compSet = figma.getNodeById('1:23');
const instance = compSet.defaultVariant.createInstance();

// Set VARIANT, BOOLEAN, TEXT properties
instance.setProperties({
  'Size': 'Large',       // VARIANT
  'State': 'Default',    // VARIANT
  'hasIcon': false,      // BOOLEAN
  'Label': 'Click me'    // TEXT (if supported as property)
});

instance.x = 100;
instance.y = 100;
figma.currentPage.appendChild(instance);
return { id: instance.id, name: instance.name };
"
```

### Step 4: Set Text Content Inside Instance

If the component has internal text nodes (not TEXT properties), edit them directly:

```bash
node src/index.js eval "
const instance = figma.getNodeById('INSTANCE_ID');

// Find text node by name
const textNode = instance.findOne(n => n.type === 'TEXT' && n.name === 'Label');
if (textNode) {
  await figma.loadFontAsync(textNode.fontName);
  textNode.characters = 'New text content';
}

// Or iterate all text nodes
const allText = instance.findAll(n => n.type === 'TEXT');
return JSON.stringify(allText.map(t => ({ id: t.id, name: t.name, text: t.characters })));
"
```

**CRITICAL: Always call `figma.loadFontAsync(textNode.fontName)` before changing `characters`.**

### List All Components in File

```bash
node src/index.js eval "
const comps = figma.currentPage.findAll(n =>
  n.type === 'COMPONENT' || n.type === 'COMPONENT_SET'
);
return JSON.stringify(comps.map(c => ({
  id: c.id,
  name: c.name,
  type: c.type,
  w: Math.round(c.width),
  h: Math.round(c.height)
})), null, 2);
"
```

---

## Project Variables (Existing)

When user says "use existing variables", "bind our design tokens", "apply brand colors".

**ALWAYS discover variables first before using `var:` syntax or `bind` commands.**

### Step 1: List Existing Variables

```bash
node src/index.js var list              # All variables (names + types)
node src/index.js bind list             # All bindable variables
node src/index.js bind list -t COLOR    # Color variables only
```

### Step 2: Find by Name Pattern

```bash
node src/index.js var find "primary"    # Search by pattern
node src/index.js var find "semantic"   # Find semantic tokens
node src/index.js var find "color/"     # Find by path prefix
```

### Step 3: Use Exact Variable Name in var: Syntax

After discovering the real name from `var list`, use it directly:

```bash
# Use exact name from var list output (e.g. "semantic/background", "colors/blue-500")
node src/index.js render '<Frame bg="var:semantic/background" stroke="var:semantic/border">
  <Text color="var:semantic/foreground">Text</Text>
</Frame>'
```

**`var:name` works with ANY local variable, not just shadcn presets. Use the exact name from `var list`.**

### Step 4: Bind Variable to Existing Node

```bash
node src/index.js bind fill "semantic/background" -n "NODE_ID"
node src/index.js bind stroke "semantic/border" -n "NODE_ID"
node src/index.js bind radius "spacing/sm" -n "NODE_ID"
node src/index.js bind gap "spacing/md" -n "NODE_ID"
```

### Switch Variable Mode (Light/Dark)

```bash
node src/index.js eval "
const node = figma.getNodeById('FRAME_ID');

// Discover modes from bound variables
function findModeCollection(n) {
  if (n.boundVariables) {
    for (const [, binding] of Object.entries(n.boundVariables)) {
      const b = Array.isArray(binding) ? binding[0] : binding;
      if (b?.id) {
        const variable = figma.variables.getVariableById(b.id);
        if (variable) {
          const col = figma.variables.getVariableCollectionById(variable.variableCollectionId);
          if (col?.modes?.length > 1) return { col, modes: col.modes };
        }
      }
    }
  }
  if (n.children) for (const c of n.children) {
    const found = findModeCollection(c);
    if (found) return found;
  }
  return null;
}

const found = findModeCollection(node);
if (found) {
  // found.modes = [{ modeId, name }]  e.g. 'Light', 'Dark'
  const mode = found.modes.find(m => m.name.toLowerCase().includes('dark'));
  if (mode) node.setExplicitVariableModeForCollection(found.col, mode.modeId);
}
return found ? found.modes.map(m => m.name) : 'no modes found';
"
```

---

## Composing Pages with Existing Components

When user asks to "compose a home page", "design a screen using our components", "create a layout with Navbar + Hero + Footer".

**Strategy: Use a single `eval` with `createInstance()` calls.**
This is more reliable than `render` for complex layouts with existing components.

### Discovery First (Always Run Before Composing)

```bash
# 1. See all available components
node src/index.js eval "
const comps = figma.currentPage.findAll(n => n.type === 'COMPONENT_SET');
return JSON.stringify(comps.map(c => ({ id: c.id, name: c.name })));
"

# 2. See what's already on canvas
node src/index.js canvas info
```

### Page Composition Pattern

```bash
node src/index.js eval "
// 1. Create page frame with vertical auto-layout
const page = figma.createFrame();
page.name = 'Home Page';
page.resize(1440, 900);
page.layoutMode = 'VERTICAL';
page.primaryAxisSizingMode = 'FIXED';
page.counterAxisSizingMode = 'FIXED';
page.itemSpacing = 0;
page.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];

// 2. Add Navbar instance
const navbarSet = figma.getNodeById('NAVBAR_COMPONENT_SET_ID');
const navbar = navbarSet.defaultVariant.createInstance();
navbar.layoutAlign = 'STRETCH';  // Fill page width
navbar.primaryAxisSizingMode = 'AUTO';
page.appendChild(navbar);

// 3. Add Hero instance with custom properties
const heroSet = figma.getNodeById('HERO_COMPONENT_SET_ID');
const hero = heroSet.defaultVariant.createInstance();
hero.layoutAlign = 'STRETCH';
hero.setProperties({ 'Variant': 'Dark', 'hasImage': true });
page.appendChild(hero);

// 4. Add Cards section (manual frame with instances inside)
const cardsRow = figma.createFrame();
cardsRow.layoutMode = 'HORIZONTAL';
cardsRow.itemSpacing = 24;
cardsRow.paddingLeft = cardsRow.paddingRight = 80;
cardsRow.paddingTop = cardsRow.paddingBottom = 64;
cardsRow.layoutAlign = 'STRETCH';
cardsRow.primaryAxisSizingMode = 'AUTO';
cardsRow.counterAxisSizingMode = 'AUTO';
cardsRow.fills = [];

const cardSet = figma.getNodeById('CARD_COMPONENT_SET_ID');
const cardTitles = ['Feature One', 'Feature Two', 'Feature Three'];
for (const title of cardTitles) {
  const card = cardSet.defaultVariant.createInstance();
  // Set text content
  const titleNode = card.findOne(n => n.type === 'TEXT' && n.name === 'Title');
  if (titleNode) {
    await figma.loadFontAsync(titleNode.fontName);
    titleNode.characters = title;
  }
  cardsRow.appendChild(card);
}
page.appendChild(cardsRow);

// 5. Position on canvas
page.x = 0;
page.y = 0;
figma.currentPage.appendChild(page);
figma.viewport.scrollAndZoomIntoView([page]);
return { id: page.id, name: page.name };
"
```

### Multiple Different Pages in a File

```bash
node src/index.js eval "
// Create named frames for each screen
const screens = [
  { name: 'Home', componentId: 'HOME_ID' },
  { name: 'About', componentId: 'ABOUT_ID' },
  { name: 'Contact', componentId: 'CONTACT_ID' }
];

let x = 0;
for (const screen of screens) {
  const comp = figma.getNodeById(screen.componentId);
  if (!comp) continue;
  const frame = comp.defaultVariant.createInstance();
  frame.name = screen.name;
  frame.x = x;
  frame.y = 0;
  figma.currentPage.appendChild(frame);
  x += frame.width + 100;
}
figma.viewport.scrollAndZoomIntoView(figma.currentPage.children);
"
```

---

## Accessibility Testing

When user asks for "accessibility test", "check WCAG", "test contrast", "a11y audit".

### Basic Lint (Covers Most A11y Checks)

```bash
node src/index.js lint              # Lint entire canvas
node src/index.js lint "NODE_ID"    # Lint specific frame
```

**Checks performed automatically:**
- Color contrast (WCAG AA ≥4.5:1 for normal text, ≥3:1 for large text)
- Text size (warning if < 12px)
- Missing component descriptions (alt text equivalent)
- Hardcoded colors not bound to variables
- Deep nesting (>10 levels)
- Empty frames

### Contrast Check for Specific Element

```bash
node src/index.js eval "
function luminance(r, g, b) {
  return [r, g, b].reduce((acc, c, i) => {
    c = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return acc + c * [0.2126, 0.7152, 0.0722][i];
  }, 0);
}

function contrast(c1, c2) {
  const L1 = luminance(c1.r, c1.g, c1.b);
  const L2 = luminance(c2.r, c2.g, c2.b);
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

// Find all text nodes and check their contrast
const texts = figma.currentPage.findAll(n => n.type === 'TEXT');
const results = [];
for (const text of texts) {
  const fill = text.fills[0];
  if (!fill || fill.type !== 'SOLID') continue;
  // Find parent background
  let parent = text.parent;
  while (parent && parent.type !== 'PAGE') {
    const bg = parent.fills?.[0];
    if (bg?.type === 'SOLID') {
      const ratio = contrast(fill.color, bg.color);
      results.push({
        node: text.name || text.characters?.slice(0, 20),
        ratio: ratio.toFixed(2),
        AA: ratio >= 4.5 ? 'PASS' : 'FAIL',
        AALarge: ratio >= 3 ? 'PASS' : 'FAIL'
      });
      break;
    }
    parent = parent.parent;
  }
}
return JSON.stringify(results, null, 2);
"
```

### Full Accessibility Report

```bash
node src/index.js eval "
const issues = [];

// 1. Text too small
figma.currentPage.findAll(n => n.type === 'TEXT').forEach(t => {
  if (t.fontSize < 12) issues.push({ type: 'error', id: t.id, msg: 'Text too small: ' + t.fontSize + 'px' });
  if (t.fontSize < 16 && t.fontSize >= 12) issues.push({ type: 'warning', id: t.id, msg: 'Text small: ' + t.fontSize + 'px' });
});

// 2. Interactive elements without descriptions
figma.currentPage.findAll(n => n.type === 'INSTANCE').forEach(inst => {
  if (!inst.description && (inst.name.toLowerCase().includes('button') || inst.name.toLowerCase().includes('link'))) {
    issues.push({ type: 'warning', id: inst.id, msg: 'Interactive element missing description: ' + inst.name });
  }
});

// 3. Empty frames
figma.currentPage.findAll(n => n.type === 'FRAME' && n.children.length === 0).forEach(f => {
  issues.push({ type: 'info', id: f.id, msg: 'Empty frame: ' + f.name });
});

const counts = { error: 0, warning: 0, info: 0 };
issues.forEach(i => counts[i.type]++);
return JSON.stringify({ summary: counts, issues }, null, 2);
"
```
