export interface Blog {
  _id?: string 
  title: string
  content: string
  tags: string[]
  published: boolean
  createdAt: string
  updatedAt: string
  status: string
}

export interface BlogInput {
  _id?: string
  title: string
  content: string
  tags: string[]
}
