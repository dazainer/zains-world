/**
 * RoomManager — room data types and registry.
 *
 * Every room (overworld + interiors) conforms to `RoomData`, giving the engine
 * a uniform shape for collision, doors, interaction zones, and ambient sprites.
 */
import type { TileType } from './CollisionMap'
import type { AmbientSprite } from './AmbientSprite'
import type { Direction } from './Player'

export type RoomId =
  | 'overworld'
  | 'projectsLab'
  | 'skillsForge'
  | 'experienceTower_1'
  | 'experienceTower_2'
  | 'experienceTower_3'
  | 'contactPortal'
  | 'secretRoom'

export interface DoorDef {
  col: number
  row: number
  targetRoom: RoomId
  /** World-pixel X to place player in the target room */
  spawnX: number
  /** World-pixel Y to place player in the target room */
  spawnY: number
  /** Direction player faces after transition */
  spawnDirection: Direction
}

export interface InteractionZoneDef {
  col: number
  row: number
  id: string
  /** E.g. projectId for project stations, skillName for skills */
  payload?: string
}

export interface RoomData {
  id: RoomId
  cols: number
  rows: number
  tileSize: number
  collisionGrid: TileType[][]
  defaultSpawn: { x: number; y: number }
  doors: DoorDef[]
  interactionZones: InteractionZoneDef[]
  /** Interior rooms use canvas-drawn walls/floors; overworld uses tilesets */
  isInterior: boolean
  /** Factory returning ambient sprites for this room (torches, etc.) */
  buildAmbients?: () => AmbientSprite[]
}

// ── Registry ────────────────────────────────────────────────────────────────

class RoomRegistry {
  private rooms = new Map<RoomId, RoomData>()

  register(id: RoomId, room: RoomData) {
    this.rooms.set(id, room)
  }

  get(id: RoomId): RoomData {
    const room = this.rooms.get(id)
    if (!room) throw new Error(`Room "${id}" not registered`)
    return room
  }
}

export const roomRegistry = new RoomRegistry()
