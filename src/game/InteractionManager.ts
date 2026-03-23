/**
 * InteractionManager — resolves what happens when the player presses Space/Enter
 * on an interaction tile. Each room registers named interaction handlers keyed
 * by a string ID (e.g., "resume-chest", "station-specguard").
 */
export type InteractionHandler = () => void

export interface InteractionZone {
  id: string
  /** Pixel bounding box of the interaction zone */
  x: number
  y: number
  width: number
  height: number
  handler: InteractionHandler
}

export class InteractionManager {
  private zones: InteractionZone[] = []

  register(zone: InteractionZone) {
    this.zones.push(zone)
  }

  clearAll() {
    this.zones = []
  }

  /** Returns the zone the player is currently standing in, if any. */
  getActiveZone(playerX: number, playerY: number): InteractionZone | null {
    return (
      this.zones.find(
        (z) =>
          playerX >= z.x &&
          playerX <= z.x + z.width &&
          playerY >= z.y &&
          playerY <= z.y + z.height,
      ) ?? null
    )
  }

  /** Call when player presses interact. Returns true if handled. */
  tryInteract(playerX: number, playerY: number): boolean {
    const zone = this.getActiveZone(playerX, playerY)
    if (zone) {
      zone.handler()
      return true
    }
    return false
  }
}
