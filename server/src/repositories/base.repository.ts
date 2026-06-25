export interface BaseRepository<T, CreateInput, UpdateInput> {
  findById(id: string): Promise<T | null>
  findAll(): Promise<T[]>
  create(data: CreateInput): Promise<T>
  update(id: string, data: UpdateInput): Promise<T>
  delete(id: string): Promise<void>
}