import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const dataDir = path.join(process.cwd(), 'data')

export function readMarkdown(category: string, slug: string) {
  const filePath = path.join(dataDir, category, `${slug}.md`)
  const raw = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(raw)
  return { meta: data, content: content.trim() }
}

export function readAllMarkdown(category: string) {
  const dir = path.join(dataDir, category)
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort()
  return files.map(file => {
    const slug = file.replace('.md', '')
    return { slug, ...readMarkdown(category, slug) }
  })
}
