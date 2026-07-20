// backend/src/api/crawler/zhihu-feedloom.js

const express = require('express')
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const { Article, Category } = require('../../models')

const execPromise = promisify(exec)
const router = express.Router()

const TEMP_DIR = path.join(__dirname, '../../../temp')

// 确保临时目录存在
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
}

// ============================================================
// 抓取知乎文章
// ============================================================
router.post('/fetch', async (req, res) => {
  try {
    const { urls, category_id, type = 1, autoPublish = false } = req.body
    
    if (!urls || urls.length === 0) {
      return res.status(400).json({ code: 1, message: '请提供 URL 列表' })
    }
    
    if (!category_id) {
      return res.status(400).json({ code: 1, message: '请选择目标分类' })
    }
    
    const results = { success: 0, fail: 0, skipped: 0, errors: [], items: [] }
    
    for (const url of urls) {
      try {
        console.log(`📥 [${results.success + results.fail + results.skipped + 1}] Feedloom 抓取:`, url)
        
        const articleData = await fetchWithFeedloom(url)
        
        if (!articleData) {
          results.fail++
          results.errors.push({ url, error: '抓取失败' })
          continue
        }
        
        // 检查是否已存在
        const exist = await Article.findOne({
          where: { 
            title: articleData.title,
            status: 1
          }
        })
        
        if (exist) {
          results.skipped++
          results.items.push({ ...articleData, status: 'skipped' })
          continue
        }
        
        const article = await Article.create({
          title: articleData.title || '知乎文章',
          subtitle: `来源: 知乎 · ${articleData.author || '未知作者'}`,
          cover: articleData.cover || '',
          summary: articleData.summary || '',
          content: articleData.content || '<p>内容加载失败</p>',
          category_id: category_id,
          type: type,
          points_required: type === 2 ? 10 : 0,
          status: autoPublish ? 1 : 0,
          publish_time: articleData.publishTime || new Date(),
          view_count: 0,
          pay_count: 0,
          is_top: 0
        })
        
        results.success++
        results.items.push({ ...articleData, id: article.id, status: 'success' })
        
      } catch (err) {
        console.error('❌ 抓取失败:', err.message)
        results.fail++
        results.errors.push({ url, error: err.message })
      }
    }
    
    res.json({
      code: 0,
      data: results,
      message: `成功 ${results.success} 篇，跳过 ${results.skipped} 篇，失败 ${results.fail} 篇`
    })
    
  } catch (error) {
    console.error('❌ 批量抓取失败:', error)
    res.status(500).json({ code: 1, message: '抓取失败' })
  }
})

// ============================================================
// Feedloom 抓取函数（修正版）
// ============================================================
async function fetchWithFeedloom(url) {
  try {
    // ✅ 使用正确的命令格式
    // 输出到临时目录，文件名为 feedloom_output.md
    const outputFile = path.join(TEMP_DIR, `feedloom_${Date.now()}.md`)
    
    // Feedloom 命令格式：feedloom "URL" --output-dir ./outputs
    // 我们直接读取 stdout 输出
    const command = `npx -y @ariesfish/feedloom "${url}" --fetch-mode stealth`
    
    console.log('🔧 执行命令:', command)
    
    const { stdout, stderr } = await execPromise(command, {
      timeout: 120000,
      maxBuffer: 1024 * 1024 * 10 // 10MB
    })
    
    if (stderr) {
      console.warn('⚠️ Feedloom stderr:', stderr)
    }
    
    // ✅ Feedloom 默认输出到 stdout，直接解析
    const content = stdout
    
    if (!content || content.trim().length === 0) {
      throw new Error('抓取内容为空')
    }
    
    // 解析 Markdown 内容
    const parsed = parseMarkdown(content, url)
    
    return parsed
    
  } catch (error) {
    console.error('❌ Feedloom 抓取失败:', error.message)
    return null
  }
}

// ============================================================
// 解析 Markdown 内容
// ============================================================
function parseMarkdown(markdown, url) {
  const lines = markdown.split('\n')
  let title = ''
  let author = ''
  let content = ''
  let cover = ''
  let summary = ''
  let inFrontmatter = false
  
  for (const line of lines) {
    // YAML frontmatter
    if (line.trim() === '---') {
      inFrontmatter = !inFrontmatter
      continue
    }
    
    if (inFrontmatter) {
      if (line.startsWith('title:')) {
        title = line.replace('title:', '').trim()
      }
      if (line.startsWith('author:')) {
        author = line.replace('author:', '').trim()
      }
      if (line.startsWith('cover:')) {
        cover = line.replace('cover:', '').trim()
      }
      if (line.startsWith('description:')) {
        summary = line.replace('description:', '').trim()
      }
      continue
    }
    
    // 从 Markdown 标题提取
    if (!title && line.startsWith('# ')) {
      title = line.replace('# ', '').trim()
    }
    
    // 收集内容
    if (!inFrontmatter && !line.startsWith('---')) {
      content += line + '\n'
    }
  }
  
  // 默认值
  if (!title) {
    title = '知乎文章_' + Date.now()
  }
  
  if (!summary) {
    summary = content.replace(/[#*_`>]/g, '').substring(0, 200) + '...'
  }
  
  // Markdown 转 HTML
  const htmlContent = markdownToHtml(content)
  
  return {
    title: title,
    author: author || '知乎用户',
    cover: cover || '',
    summary: summary,
    content: htmlContent || '<p>内容加载失败</p>',
    publishTime: new Date(),
    sourceUrl: url
  }
}

// ============================================================
// Markdown 转 HTML（简单版）
// ============================================================
function markdownToHtml(markdown) {
  let html = markdown
  
  // 标题
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')
  
  // 粗体
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  
  // 斜体
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  
  // 链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
  
  // 图片
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
  
  // 段落
  html = html.replace(/\n\n/g, '</p><p>')
  html = '<p>' + html + '</p>'
  html = html.replace(/<p><\/p>/g, '')
  
  // 列表
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
  
  return html
}

// ============================================================
// 预览单篇文章
// ============================================================
router.post('/preview', async (req, res) => {
  try {
    const { url } = req.body
    
    if (!url) {
      return res.status(400).json({ code: 1, message: '请提供 URL' })
    }
    
    const data = await fetchWithFeedloom(url)
    res.json({ code: 0, data })
  } catch (error) {
    console.error('❌ 预览失败:', error)
    res.status(500).json({ code: 1, message: '预览失败' })
  }
})

module.exports = router