---
name: vue-to-react
version: 1.0.0
description: Use when converting Vue 3 components to React, migrating Vue Composition API to React hooks, translating Vue templates to JSX, converting Pinia stores to React state/context, or any Vue-to-React migration work.
triggers:
  - vue to react
  - vue2react
  - vue composition api
  - script setup
  - pinia to context
  - vue template to jsx
  - convert vue component
  - vue ref to react
role: specialist
scope: implementation
output-format: code
---

# Vue to React Conversion

Converting Vue 3 (Composition API / `<script setup>`) components to React with TypeScript.

## Role Definition

You are a Vue to React migration specialist. You accurately translate Vue 3 patterns to their React equivalents while preserving component behavior, styling, and accessibility.

---

## Core Conversion Rules

### 1. Template to JSX

| Vue | React JSX |
|-----|-----------|
| `{{ expression }}` | `{expression}` |
| `v-if="condition"` | `{condition && <Element />}` |
| `v-else-if="condition"` | `{condition ? <A /> : <B />}` |
| `v-else` | `{!condition && <Element />}` or `{condition ? <A /> : <B />}` |
| `v-for="item in items"` | `{items.map(item => <Element key={item.id} />)}` |
| `v-for="(item, index) in items"` | `{items.map((item, index) => <Element key={index} />)}` |
| `v-show="condition"` | `style={{ display: condition ? 'block' : 'none' }}` |
| `v-bind:attr="value"` | `attr={value}` (or `...` spread) |
| `:attr="value"` | `attr={value}` |
| `v-on:event="handler"` | `onEvent={handler}` |
| `@event="handler"` | `onEvent={handler}` |
| `@click.stop` | `onClick={(e) => { e.stopPropagation(); handler(); }}` |
| `v-model="value"` | Convert to controlled component with `value` prop + `onChange` handler |
| `v-model:propName="value"` | `propName={value} onPropNameChange={setValue}` |
| `v-html="html"` | `dangerouslySetInnerHTML={{ __html: html }}` |
| `ref="myRef"` | `ref={myRef}` (useRef or callback ref) |
| `v-slot:slotName` | `slotName` prop or children |
| `#slotName` | `slotName` prop or children |
| `is="componentType"` | `{React.createElement(componentType, ...)}` |

### 2. Script Setup to React Component

```vue
<!-- Vue -->
<template>
  <div>{{ message }}</div>
  <button @click="count++">Click</button>
</template>

<script setup lang="ts">
const message = 'Hello'
const count = ref(0)
</script>
```

```tsx
// React
function Component() {
  const [count, setCount] = useState(0)
  return (
    <div>{message}</div>
    <button onClick={() => setCount(c => c + 1)}>Click</button>
  )
}
```

### 3. Props

```vue
<!-- Vue -->
<script setup lang="ts">
interface Props {
  title: string
  count?: number
  onOpen: () => void
}

const props = defineProps<Props>()
const { title, count = 0 } = props
</script>
```

```tsx
// React
interface Props {
  title: string
  count?: number
  onOpen: () => void
}

function Component({ title, count = 0, onOpen }: Props) {
  // ...
}
```

### 4. Emits

```vue
<!-- Vue -->
<script setup lang="ts">
const emit = defineEmits<{
  open: []
  add: [item: Item]
}>()

emit('open')
emit('add', newItem)
</script>
```

```tsx
// React
function Component({ onOpen, onAdd }: Props) {
  const handleOpen = () => onOpen?.()
  const handleAdd = (item: Item) => onAdd?.(item)
}
```

### 5. Refs

```vue
<!-- Vue -->
<script setup lang="ts">
import { ref } from 'vue'

const inputRef = ref<HTMLInputElement | null>(null)
const count = ref(0)

count.value++           // reactive value
inputRef.value?.focus() // DOM access
</script>
```

```tsx
// React
function Component() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [count, setCount] = useState(0)

  setCount(c => c + 1)              // state update
  inputRef.current?.focus()         // DOM access
}
```

### 6. Reactive Objects

```vue
<!-- Vue -->
<script setup lang="ts">
import { reactive } from 'vue'

const state = reactive({
  name: 'John',
  age: 30
})

state.age++
</script>
```

```tsx
// React
function Component() {
  const [state, setState] = useState({
    name: 'John',
    age: 30
  })

  const updateState = (key: keyof typeof state, value: typeof state[keyof typeof state]) => {
    setState(prev => ({ ...prev, [key]: value }))
  }

  // or useReducer for complex state
}
```

### 7. Computed

```vue
<!-- Vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)
</script>
```

```tsx
// React
function Component() {
  const [count, setCount] = useState(0)
  const doubled = useMemo(() => count * 2, [count])
}
```

### 8. Watch

```vue
<!-- Vue -->
<script setup lang="ts">
import { watch, ref } from 'vue'

const count = ref(0)

watch(count, (newVal, oldVal) => {
  console.log(`changed from ${oldVal} to ${newVal}`)
})

watch(count, (newVal) => {
  console.log(`count is now ${newVal}`)
}, { immediate: true })
</script>
```

```tsx
// React
function Component() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    console.log(`count is now ${count}`)
  }, [count])

  // For immediate: run on mount
  useEffect(() => {
    console.log(`count is now ${count}`)
  }, [count]) // count's initial value runs on mount
}
```

### 9. Lifecycle

| Vue | React (hooks) |
|-----|---------------|
| `onMounted(() => {})` | `useEffect(() => {}, [])` (mount only) |
| `onUpdated(() => {})` | `useEffect(() => {})` (no deps - runs after every render) |
| `onUnmounted(() => {})` | `useEffect(() => { return () => {} }, [])` |
| `onBeforeMount(() => {})` | N/A (React doesn't have this) |
| `onErrorCaptured(() => {})` | `componentDidCatch` or error boundaries |

### 10. Conditional Classes

```vue
<!-- Vue -->
<div :class="{ active: isActive, 'text-red': hasError }"></div>
<div :class="[baseClass, { active: isActive }]"></div>
<div :class="isActive && 'active'"></div>
```

```tsx
// React
<div className={cn({ active: isActive, 'text-red': hasError })}></div>
<div className={[baseClass, isActive && 'active'].filter(Boolean).join(' ')}></div>
<div className={isActive ? 'active' : undefined}></div>

// With clsx or classnames utility
import clsx from 'clsx'
<div className={clsx(baseClass, { active: isActive })}></div>
```

### 11. Style Bindings

```vue
<!-- Vue -->
<div :style="{ color: textColor, fontSize: fontSize + 'px' }"></div>
<div :style="[baseStyle, overrideStyle]"></div>
```

```tsx
// React
<div style={{ color: textColor, fontSize: `${fontSize}px` }}></div>
<div style={{ ...baseStyle, ...overrideStyle }}></div>
```

### 12. Slot / Children

```vue
<!-- Vue Parent -->
<MyComponent>
  <template #header>
    <h1>Title</h1>
  </template>
  <p>Content</p>
</MyComponent>

<!-- Vue MyComponent -->
<slot name="header" />
<slot />
```

```tsx
// React Parent
<MyComponent
  header={<h1>Title</h1>}
>
  <p>Content</p>
</MyComponent>

// React MyComponent
function MyComponent({ header, children }) {
  return (
    <>
      {header}
      {children}
    </>
  )
}
```

### 13. Provide / Inject → React Context

```vue
<!-- Vue -->
import { provide } from 'vue'
provide('theme', 'dark')
```

```tsx
// React
const ThemeContext = createContext<string>('dark')
// Provider: <ThemeContext.Provider value="dark">
// Consumer: useContext(ThemeContext)
```

### 14. Pinia → React State Management

```typescript
// Pinia Store
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref('')

  function login(credentials) {
    // ...
  }

  return { user, token, login }
})
```

```tsx
// React - Option 1: Context + useReducer
const AuthContext = createContext<{
  user: User | null
  login: (creds: Credentials) => Promise<void>
} | null>(null)

// Option 2: Custom hook with useState
function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const login = async (credentials: Credentials) => { /* ... */ }
  return { user, login }
}

// Option 3: Zustand (recommended for larger apps)
import { create } from 'zustand'
const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  login: async (credentials) => { /* ... */ },
}))
```

### 15. Common Component Patterns

#### Button with Loading State

```vue
<!-- Vue -->
<template>
  <button :disabled="loading" @click="$emit('click')">
    {{ loading ? 'Saving…' : 'Save' }}
  </button>
</template>
```

```tsx
// React
function Button({ loading, onClick, children }: ButtonProps) {
  return (
    <button disabled={loading} onClick={onClick}>
      {loading ? 'Saving…' : children}
    </button>
  )
}
```

#### Input with v-model

```vue
<!-- Vue -->
<template>
  <input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />
</template>

<script setup lang="ts">
defineProps<{ modelValue: string }>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>
```

```tsx
// React
function Input({ value, onChange }: InputProps) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} />
}
```

---

## TypeScript Types

### Vue Types
```typescript
import type { PropType, Component } from 'vue'

// Complex prop types
defineProps<{
  status: 'pending' | 'success' | 'error'
  items: string[]
  onChange: (value: string) => void
  component: Component
}>()

// With default
const props = withDefaults(defineProps<{
  count?: number
}>(), {
  count: 0
})
```

### React Types
```typescript
// Simple component
type ButtonProps = {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
  onClick?: () => void
}

// HTML element props extend
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
}
```

---

## Styling Notes

- Vue scoped CSS → React CSS Modules or inline styles
- Vue's `:class` and `:style` → React `className` and `style`
- Tailwind classes translate 1:1 (same syntax in both)
- CSS variables work identically in both frameworks

---

## Common Pitfalls

1. **Forgetting `key` in maps** → Always use `key={item.id}` or `key={index}`
2. **React's event pooling** → Use `e.preventDefault()` and `e.stopPropagation()` directly
3. **State updates are async** → Don't expect immediate value change after `setState`
4. **Object/array state mutations** → Always create new reference: `setItems([...items, newItem])`
5. **Cleanup in effects** → Always return cleanup function from `useEffect`
6. **Vue refs auto-unwrap** → React refs need `.current`
7. **Vue's reactivity system** → React uses explicit `setState` triggers

---

## Utility Conversion

| Vue | React |
|-----|-------|
| `Object.assign({}, obj)` | `{...obj}` |
| `arr.push(item)` | `[...arr, item]` |
| `arr.filter(...)` | `arr.filter(...)` (same) |
| `arr.splice(i, 1)` | `arr.filter((_, idx) => idx !== i)` |
| `obj.key = value` | `{...obj, key: value}` |
| `delete obj.key` | `const { key, ...rest } = obj` |
