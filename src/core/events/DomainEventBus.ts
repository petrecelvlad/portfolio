export interface DomainEvent {
  type: string;
  timestamp: number;
  payload?: unknown;
}

export interface NodeSelectedEvent extends DomainEvent {
  type: 'NODE_SELECTED';
  payload: {
    nodeId: string;
    nodeName: string;
    category: string;
  };
}

export interface SkillFilterChangedEvent extends DomainEvent {
  type: 'SKILL_FILTER_CHANGED';
  payload: {
    category: string | null;
  };
}

export interface AudioEffectTriggeredEvent extends DomainEvent {
  type: 'AUDIO_EFFECT_TRIGGERED';
  payload: {
    effectName: string;
    volume?: number;
  };
}

export type AppDomainEvent =
  | NodeSelectedEvent
  | SkillFilterChangedEvent
  | AudioEffectTriggeredEvent;

type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void;

class EventBus {
  // Keyed by event type, so each Set only ever actually holds handlers for
  // that one event's payload shape — the stored type has to be widened to the
  // common base here since a Map can't express "value type depends on key,"
  // but subscribe/publish below are fully typed at the public boundary, so
  // callers never see this erasure.
  private listeners: Map<string, Set<EventHandler<AppDomainEvent>>> = new Map();

  /**
   * Subscribe to a specific domain event type.
   */
  subscribe<T extends AppDomainEvent>(eventType: T['type'], handler: EventHandler<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    const handlers = this.listeners.get(eventType)!;
    handlers.add(handler as EventHandler<AppDomainEvent>);

    return () => {
      handlers.delete(handler as EventHandler<AppDomainEvent>);
      if (handlers.size === 0) {
        this.listeners.delete(eventType);
      }
    };
  }

  /**
   * Publish a domain event to all subscribers.
   */
  publish<T extends AppDomainEvent>(event: T): void {
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (err) {
          console.error(`[DomainEventBus] Error handling event "${event.type}":`, err);
        }
      });
    }
  }

  /**
   * Clear all subscribers (useful for tests or teardown).
   */
  clear(): void {
    this.listeners.clear();
  }
}

export const DomainEventBus = new EventBus();
