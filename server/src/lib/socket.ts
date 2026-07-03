import { Server } from 'socket.io'

let io: Server | null = null

export function initSocket(server: Server): void {
  io = server
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io has not been initialised — call initSocket first')
  }
  return io
}