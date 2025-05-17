export interface Blog {
  id?: string 
  title: string
  content: string
  tags: string[]
  published: boolean
  createdAt: string
  updatedAt: string
}

export interface BlogInput {
  id?: string
  title: string
  content: string
  tags: string[]
}
