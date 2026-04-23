export type ShortcutActionId =
  | 'toggleExplorer'
  | 'toggleProperties'
  | 'toggleBottomPanel'
  | 'goHome'
  | 'openFile'
  | 'openFolder'
  | 'saveFile';

export interface ShortcutBinding {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  key: string;
}

export interface ShortcutStorageAdapter {
  loadBindings: () => Promise<Partial<Record<ShortcutActionId, string>> | null>;
  saveBindings: (bindings: Record<ShortcutActionId, string>) => Promise<void>;
}

type ShortcutHandler = () => void;

const DEFAULT_SHORTCUT_BINDINGS: Record<ShortcutActionId, string> = {
  toggleExplorer: 'Ctrl+Shift+E',
  toggleProperties: 'Ctrl+Shift+P',
  toggleBottomPanel: 'Ctrl+J',
  goHome: 'Ctrl+Shift+H',
  openFile: 'Ctrl+O',
  openFolder: 'Ctrl+Shift+O',
  saveFile: 'Ctrl+S'
};

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
};

const normalizeKeyName = (key: string) => {
  if (key.length === 1) return key.toLowerCase();
  const lower = key.toLowerCase();
  if (lower === 'space') return ' ';
  return lower;
};

const normalizeBinding = (binding: ShortcutBinding): ShortcutBinding => ({
  ctrl: Boolean(binding.ctrl),
  shift: Boolean(binding.shift),
  alt: Boolean(binding.alt),
  meta: Boolean(binding.meta),
  key: normalizeKeyName(binding.key)
});

const parseAccelerator = (accelerator: string): ShortcutBinding | null => {
  if (!accelerator.trim()) return null;
  const tokens = accelerator
    .split('+')
    .map((token) => token.trim())
    .filter(Boolean);
  if (tokens.length === 0) return null;

  const binding: ShortcutBinding = {
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
    key: ''
  };

  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (lower === 'ctrl' || lower === 'control') {
      binding.ctrl = true;
      continue;
    }
    if (lower === 'shift') {
      binding.shift = true;
      continue;
    }
    if (lower === 'alt' || lower === 'option') {
      binding.alt = true;
      continue;
    }
    if (lower === 'meta' || lower === 'cmd' || lower === 'command' || lower === 'win') {
      binding.meta = true;
      continue;
    }
    binding.key = normalizeKeyName(token);
  }

  if (!binding.key) return null;
  return normalizeBinding(binding);
};

const bindingToAccelerator = (binding: ShortcutBinding) => {
  const parts: string[] = [];
  if (binding.ctrl) parts.push('Ctrl');
  if (binding.shift) parts.push('Shift');
  if (binding.alt) parts.push('Alt');
  if (binding.meta) parts.push('Meta');
  const key = binding.key.length === 1 ? binding.key.toUpperCase() : binding.key;
  parts.push(key);
  return parts.join('+');
};

class ShortcutManager {
  private readonly actionHandlers = new Map<ShortcutActionId, Set<ShortcutHandler>>();
  private readonly bindings = new Map<ShortcutActionId, ShortcutBinding>();
  private storageAdapter: ShortcutStorageAdapter | null = null;
  private initialized = false;
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor() {
    this.resetToDefaults();
  }

  async initialize() {
    if (this.initialized) return;
    this.initialized = true;
    await this.loadBindingsFromStorage();
    this.keydownHandler = (event: KeyboardEvent) => this.handleKeydown(event);
    document.addEventListener('keydown', this.keydownHandler);
  }

  dispose() {
    if (!this.initialized) return;
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    this.initialized = false;
  }

  onAction(action: ShortcutActionId, handler: ShortcutHandler) {
    const handlers = this.actionHandlers.get(action) ?? new Set<ShortcutHandler>();
    handlers.add(handler);
    this.actionHandlers.set(action, handlers);
    return () => {
      const current = this.actionHandlers.get(action);
      if (!current) return;
      current.delete(handler);
      if (current.size === 0) this.actionHandlers.delete(action);
    };
  }

  getBindings() {
    const result = {} as Record<ShortcutActionId, string>;
    (Object.keys(DEFAULT_SHORTCUT_BINDINGS) as ShortcutActionId[]).forEach((action) => {
      const binding = this.bindings.get(action);
      result[action] = binding ? bindingToAccelerator(binding) : DEFAULT_SHORTCUT_BINDINGS[action];
    });
    return result;
  }

  getBinding(action: ShortcutActionId) {
    const binding = this.bindings.get(action);
    return binding ? bindingToAccelerator(binding) : DEFAULT_SHORTCUT_BINDINGS[action];
  }

  setBinding(action: ShortcutActionId, accelerator: string) {
    const parsed = parseAccelerator(accelerator);
    if (!parsed) return { success: false as const, reason: 'invalid-accelerator' as const };

    const conflictAction = this.findActionByBinding(parsed, action);
    if (conflictAction) {
      return { success: false as const, reason: 'binding-conflict' as const, conflictAction };
    }

    this.bindings.set(action, parsed);
    void this.persistBindings();
    return { success: true as const };
  }

  resetToDefaults() {
    this.bindings.clear();
    (Object.keys(DEFAULT_SHORTCUT_BINDINGS) as ShortcutActionId[]).forEach((action) => {
      const parsed = parseAccelerator(DEFAULT_SHORTCUT_BINDINGS[action]);
      if (parsed) this.bindings.set(action, parsed);
    });
  }

  setStorageAdapter(adapter: ShortcutStorageAdapter | null) {
    this.storageAdapter = adapter;
  }

  private handleKeydown(event: KeyboardEvent) {
    if (event.repeat) return;
    const matchedAction = this.findActionByEvent(event);
    if (!matchedAction) return;
    // 允许在文本编辑区域触发保存，其它全局快捷键仍避免打断输入体验
    if (isEditableTarget(event.target) && matchedAction !== 'saveFile') return;
    event.preventDefault();
    const handlers = this.actionHandlers.get(matchedAction);
    if (!handlers) return;
    handlers.forEach((handler) => {
      try {
        handler();
      } catch (_error) {
        // 快捷键处理函数由上层注入，单个回调异常不应影响其它动作
      }
    });
  }

  private findActionByEvent(event: KeyboardEvent): ShortcutActionId | null {
    const current: ShortcutBinding = normalizeBinding({
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey,
      meta: event.metaKey,
      key: event.key
    });
    return this.findActionByBinding(current, null);
  }

  private findActionByBinding(binding: ShortcutBinding, excludedAction: ShortcutActionId | null): ShortcutActionId | null {
    for (const [action, current] of this.bindings.entries()) {
      if (excludedAction && action === excludedAction) continue;
      if (
        current.ctrl === binding.ctrl &&
        current.shift === binding.shift &&
        current.alt === binding.alt &&
        current.meta === binding.meta &&
        current.key === binding.key
      ) {
        return action;
      }
    }
    return null;
  }

  private async loadBindingsFromStorage() {
    if (!this.storageAdapter) return;
    const stored = await this.storageAdapter.loadBindings();
    if (!stored) return;

    (Object.keys(stored) as ShortcutActionId[]).forEach((action) => {
      const accelerator = stored[action];
      if (!accelerator) return;
      const parsed = parseAccelerator(accelerator);
      if (!parsed) return;
      this.bindings.set(action, parsed);
    });
  }

  private async persistBindings() {
    if (!this.storageAdapter) return;
    await this.storageAdapter.saveBindings(this.getBindings());
  }
}

export const shortcutService = new ShortcutManager();
